import { describe, it, expect, beforeEach } from "vitest";
import { Triangle } from "./Triangle";
import { QuadraticBezier } from "./QuadraticBezier";
import { CubicBezier } from "./CubicBezier";
import { PathBezier } from "./PathBezier";
import type { Point2D } from "../math/point";

function expectPointCloseTo(p: Point2D, expected: Point2D, epsilon = 1e-5) {
  expect(p.x).toBeCloseTo(expected.x, epsilon);
  expect(p.y).toBeCloseTo(expected.y, epsilon);
}

describe("Triangle", () => {
  it("creates triangle with default points centered", () => {
    const tri = new Triangle();
    const bounds = tri.getLocalBounds();
    expect(bounds.minX).toBeLessThan(0);
    expect(bounds.maxX).toBeGreaterThan(0);
    expect(bounds.minY).toBeLessThan(0);
    expect(bounds.maxY).toBeGreaterThan(0);
  });

  it("hitTest inside", () => {
    const tri = new Triangle([
      { x: 0, y: -70 },
      { x: 70, y: 55 },
      { x: -70, y: 55 },
    ]);
    expect(tri.hitTest(0, 0)).toBe(true);
    expect(tri.hitTest(30, 20)).toBe(true);
    expect(tri.hitTest(80, 0)).toBe(false);
  });

  it("hitTest after translation", () => {
    const tri = new Triangle();
    tri.transform.x = 100;
    tri.transform.y = 200;
    expect(tri.hitTest(100, 200)).toBe(true);
    expect(tri.hitTest(100 + 50, 200 + 30)).toBe(true);
    expect(tri.hitTest(100 + 80, 200)).toBe(false);
  });
});

describe("QuadraticBezier", () => {
  it("pointAt gives correct midpoint for symmetric curve", () => {
    const qb = new QuadraticBezier(
      { x: -50, y: 0 },
      { x: 0, y: -50 },
      { x: 50, y: 0 }
    );
    const p = qb.pointAt(0.5);
    expectPointCloseTo(p, { x: 0, y: -25 });
  });

  it("hitTest near curve", () => {
    const qb = new QuadraticBezier(
      { x: -60, y: 0 },
      { x: 0, y: -60 },
      { x: 60, y: 0 }
    );
    qb.strokeWidth = 4;
    expect(qb.hitTest(0, -30)).toBe(true);
    expect(qb.hitTest(0, -90)).toBe(false);
  });

  it("bounds after transformation", () => {
    const qb = new QuadraticBezier(
      { x: -40, y: 0 },
      { x: 0, y: -40 },
      { x: 40, y: 0 }
    );
    qb.transform.x = 200;
    qb.transform.y = 150;
    const bounds = qb.getBounds();
    expect(bounds.minX).toBeGreaterThan(150);
    expect(bounds.maxX).toBeLessThan(250);
    expect(bounds.minY).toBeGreaterThan(100);
    expect(bounds.maxY).toBeLessThan(200);
  });
});

describe("CubicBezier", () => {
  it("pointAt start and end", () => {
    const cb = new CubicBezier(
      { x: -80, y: 0 },
      { x: -40, y: -60 },
      { x: 40, y: 60 },
      { x: 80, y: 0 }
    );
    expectPointCloseTo(cb.pointAt(0), { x: -80, y: 0 });
    expectPointCloseTo(cb.pointAt(1), { x: 80, y: 0 });
  });

  it("hitTest near curve", () => {
    const cb = new CubicBezier(
      { x: -80, y: 0 },
      { x: -40, y: -60 },
      { x: 40, y: 60 },
      { x: 80, y: 0 }
    );
    cb.strokeWidth = 4;
    expect(cb.hitTest(0, 0)).toBe(true);
    expect(cb.hitTest(0, 20)).toBe(false);
  });
});

describe("PathBezier", () => {
  let path: PathBezier;

  beforeEach(() => {
    path = new PathBezier([
      { x: -80, y: -40 },
      { x: -40, y: 40 },
      { x: 40, y: -40 },
      { x: 80, y: 40 }
    ]);
  });

  it("keeps symmetric points centered in local coordinates", () => {
    const localPoints = path.controlPointsLocal();
    const xs = localPoints.map((p) => p.x);
    const ys = localPoints.map((p) => p.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    expect(centerX).toBeCloseTo(0);
    expect(centerY).toBeCloseTo(0);
    expect(path.transform.x).toBe(0);
    expect(path.transform.y).toBe(0);
  });

  it("rotation changes world points but keeps local points", () => {
    const localPointsBefore = path.controlPointsLocal();
    const deviceCenterBefore = path.transformPointToDevice(0, 0);
    path.transform.rotation = Math.PI / 2;
    const deviceCenterAfter = path.transformPointToDevice(0, 0);
    expectPointCloseTo(deviceCenterAfter, deviceCenterBefore);
    const localPointsAfter = path.controlPointsLocal();
    for (let i = 0; i < localPointsBefore.length; i++) {
      expectPointCloseTo(localPointsAfter[i], localPointsBefore[i]);
    }
  });

  it("hitTest works after rotation", () => {
    const worldCenter = path.transformPointToDevice(0, 0);
    expect(path.hitTest(worldCenter.x, worldCenter.y)).toBe(true);
    path.transform.rotation = Math.PI / 3;
    const newWorldCenter = path.transformPointToDevice(0, 0);
    expect(path.hitTest(newWorldCenter.x, newWorldCenter.y)).toBe(true);
    const farPoint = { x: newWorldCenter.x + 200, y: newWorldCenter.y + 200 };
    expect(path.hitTest(farPoint.x, farPoint.y)).toBe(false);
  });

  it("adding point does not shift world center dramatically", () => {
    const oldCenterWorld = path.transformPointToDevice(0, 0);
    path.addPointLocal(120, 0);
    const newCenterWorld = path.transformPointToDevice(0, 0);
    expect(Math.abs(newCenterWorld.x - oldCenterWorld.x)).toBeLessThan(10);
    expect(Math.abs(newCenterWorld.y - oldCenterWorld.y)).toBeLessThan(10);
  });

  it("bounds after scaling are roughly double (allow 15px error)", () => {
    const boundsBefore = path.getBounds();
    const widthBefore = boundsBefore.maxX - boundsBefore.minX;
    const heightBefore = boundsBefore.maxY - boundsBefore.minY;
    path.transform.scaleX = 2;
    path.transform.scaleY = 2;
    const boundsAfter = path.getBounds();
    const widthAfter = boundsAfter.maxX - boundsAfter.minX;
    const heightAfter = boundsAfter.maxY - boundsAfter.minY;
    expect(Math.abs(widthAfter - widthBefore * 2)).toBeLessThan(15);
    expect(Math.abs(heightAfter - heightBefore * 2)).toBeLessThan(15);
  });
});
