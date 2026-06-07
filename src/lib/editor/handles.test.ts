import { describe, expect, it } from "vitest";
import { Rect } from "../shapes/Rect";
import { QuadraticBezier } from "../shapes/QuadraticBezier";
import {
  effectiveLocalBounds,
  hitHandle,
  localPointForResizeHandle,
  oppositeResizeHandle,
  resizeHandlePointsForShape,
  rotateHandlePointForShape,
  selectionBoxPoints,
  shapeControlPoints,
} from "./handles";

describe("editor handles", () => {
  it("returns correct opposite resize handles", () => {
    expect(oppositeResizeHandle("nw")).toBe("se");
    expect(oppositeResizeHandle("ne")).toBe("sw");
    expect(oppositeResizeHandle("se")).toBe("nw");
    expect(oppositeResizeHandle("sw")).toBe("ne");
  });

  it("builds resize and selection points from local rotated bounds", () => {
    const rect = new Rect(100, 60);
    rect.transform.x = 300;
    rect.transform.y = 200;
    rect.transform.rotation = Math.PI / 5;

    const handles = resizeHandlePointsForShape(rect);
    const box = selectionBoxPoints(rect);

    expect(handles).toHaveLength(4);
    expect(box).toHaveLength(4);
    expect(handles.map((h) => h.handle)).toEqual(["nw", "ne", "se", "sw"]);

    for (let i = 0; i < handles.length; i += 1) {
      expect(handles[i].point.x).toBeCloseTo(box[i].x);
      expect(handles[i].point.y).toBeCloseTo(box[i].y);
    }
  });

  it("finds resize handle under pointer", () => {
    const rect = new Rect(100, 60);
    rect.transform.x = 300;
    rect.transform.y = 200;
    rect.transform.rotation = 0.4;
    const se = resizeHandlePointsForShape(rect).find((item) => item.handle === "se")!;

    expect(hitHandle(rect, se.point, 12)).toEqual({ kind: "resize", handle: "se", point: se.point });
  });

  it("finds rotate handle under pointer", () => {
    const rect = new Rect(100, 60);
    rect.transform.x = 300;
    rect.transform.y = 200;
    const rotate = rotateHandlePointForShape(rect);

    expect(hitHandle(rect, rotate, 12)).toEqual({ kind: "rotate", point: rotate });
  });

  it("returns control points for bezier shapes and prioritizes them in hitHandle", () => {
    const curve = new QuadraticBezier({ x: -40, y: 0 }, { x: 0, y: -60 }, { x: 40, y: 0 });
    curve.transform.x = 100;
    curve.transform.y = 50;

    const controls = shapeControlPoints(curve);
    expect(controls).toHaveLength(3);
    expect(hitHandle(curve, controls[1], 12)).toEqual({ kind: "control", index: 1, point: controls[1] });
  });

  it("prevents zero-sized local bounds", () => {
    const rect = new Rect(0, 0);
    const bounds = effectiveLocalBounds(rect);
    const nw = localPointForResizeHandle(bounds, "nw");
    const se = localPointForResizeHandle(bounds, "se");

    expect(se.x - nw.x).toBeGreaterThan(0);
    expect(se.y - nw.y).toBeGreaterThan(0);
  });
});
