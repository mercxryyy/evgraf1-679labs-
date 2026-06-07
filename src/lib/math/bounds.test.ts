import { describe, expect, it } from "vitest";
import {
  boundsCenter,
  boundsFromPoints,
  boundsHeight,
  boundsWidth,
  expandBounds,
  normalizeBounds,
  pointInBounds,
} from "./bounds";

describe("bounds helpers", () => {
  it("creates zero bounds for empty point list", () => {
    expect(boundsFromPoints([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it("finds min and max coordinates", () => {
    const b = boundsFromPoints([
      { x: 10, y: -5 },
      { x: -3, y: 4 },
      { x: 8, y: 12 },
    ]);
    expect(b).toEqual({ minX: -3, minY: -5, maxX: 10, maxY: 12 });
  });

  it("normalizes inverted bounds", () => {
    expect(normalizeBounds({ minX: 10, minY: 8, maxX: -2, maxY: -6 })).toEqual({
      minX: -2,
      minY: -6,
      maxX: 10,
      maxY: 8,
    });
  });

  it("computes width, height and center", () => {
    const b = { minX: -10, minY: 5, maxX: 30, maxY: 25 };
    expect(boundsWidth(b)).toBe(40);
    expect(boundsHeight(b)).toBe(20);
    expect(boundsCenter(b)).toEqual({ x: 10, y: 15 });
  });

  it("expands bounds by padding and checks point containment", () => {
    const expanded = expandBounds({ minX: 0, minY: 0, maxX: 10, maxY: 20 }, 5);
    expect(expanded).toEqual({ minX: -5, minY: -5, maxX: 15, maxY: 25 });
    expect(pointInBounds({ x: -4, y: 10 }, expanded)).toBe(true);
    expect(pointInBounds({ x: -7, y: 10 }, expanded)).toBe(false);
  });
});
