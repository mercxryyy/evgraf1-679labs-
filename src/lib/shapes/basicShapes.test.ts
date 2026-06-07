import { describe, expect, it } from "vitest";
import { Rect } from "./Rect";
import { Line } from "./Line";
import { Oval } from "./Oval";
import { Triangle } from "./Triangle";

function expectPointCloseTo(actual: { x: number; y: number }, expected: { x: number; y: number }, digits = 5) {
  expect(actual.x).toBeCloseTo(expected.x, digits);
  expect(actual.y).toBeCloseTo(expected.y, digits);
}

describe("basic shapes", () => {
  it("Rect hitTest works after translation, rotation and scale", () => {
    const rect = new Rect(100, 60);
    rect.transform.x = 300;
    rect.transform.y = 200;
    rect.transform.rotation = Math.PI / 4;
    rect.transform.scaleX = 1.5;
    rect.transform.scaleY = 0.75;

    const inside = rect.transformPointToDevice(20, 10);
    const outside = rect.transformPointToDevice(80, 40);

    expect(rect.hitTest(inside.x, inside.y)).toBe(true);
    expect(rect.hitTest(outside.x, outside.y)).toBe(false);
  });

  it("Rect bounds contain all device corners", () => {
    const rect = new Rect(120, 80);
    rect.transform.x = 40;
    rect.transform.y = -20;
    rect.transform.rotation = 0.35;
    const bounds = rect.getBounds();

    for (const p of rect.deviceCorners()) {
      expect(p.x).toBeGreaterThanOrEqual(bounds.minX - 1e-8);
      expect(p.x).toBeLessThanOrEqual(bounds.maxX + 1e-8);
      expect(p.y).toBeGreaterThanOrEqual(bounds.minY - 1e-8);
      expect(p.y).toBeLessThanOrEqual(bounds.maxY + 1e-8);
    }
  });

  it("Line hitTest respects transforms", () => {
    const line = new Line({ x: -50, y: 0 }, { x: 50, y: 0 });
    line.transform.x = 100;
    line.transform.y = 50;
    line.transform.rotation = Math.PI / 2;
    line.strokeWidth = 3;

    expect(line.hitTest(100, 50)).toBe(true);
    expect(line.hitTest(100, 95)).toBe(true);
    expect(line.hitTest(135, 50)).toBe(false);
  });

  it("Oval hitTest works in local coordinates after rotation", () => {
    const oval = new Oval(60, 30);
    oval.transform.x = 220;
    oval.transform.y = 160;
    oval.transform.rotation = Math.PI / 3;
    oval.transform.scaleX = 1.25;
    oval.transform.scaleY = 0.8;

    const inside = oval.transformPointToDevice(20, 10);
    const outside = oval.transformPointToDevice(80, 0);

    expect(oval.hitTest(inside.x, inside.y)).toBe(true);
    expect(oval.hitTest(outside.x, outside.y)).toBe(false);
  });

  it("Triangle includes inner point and rejects outer point", () => {
    const triangle = new Triangle([
      { x: 0, y: -50 },
      { x: 60, y: 50 },
      { x: -60, y: 50 },
    ]);
    triangle.transform.x = 10;
    triangle.transform.y = 20;
    triangle.transform.rotation = 0.2;

    const inner = triangle.transformPointToDevice(0, 0);
    const outer = triangle.transformPointToDevice(90, 0);

    expect(triangle.hitTest(inner.x, inner.y)).toBe(true);
    expect(triangle.hitTest(outer.x, outer.y)).toBe(false);
  });

  it("transformPointToLocal is inverse to transformPointToDevice", () => {
    const rect = new Rect(100, 100);
    rect.transform.x = 12;
    rect.transform.y = -8;
    rect.transform.rotation = 0.7;
    rect.transform.scaleX = 2;
    rect.transform.scaleY = 0.5;

    const device = rect.transformPointToDevice(11, -6);
    const local = rect.transformPointToLocal(device.x, device.y);
    expectPointCloseTo(local, { x: 11, y: -6 });
  });
});
