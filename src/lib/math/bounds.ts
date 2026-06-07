import type { Point2D } from "./point";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundsFromPoints(points: Point2D[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, minY, maxX, maxY };
}

export function normalizeBounds(a: Bounds): Bounds {
  return {
    minX: Math.min(a.minX, a.maxX),
    minY: Math.min(a.minY, a.maxY),
    maxX: Math.max(a.minX, a.maxX),
    maxY: Math.max(a.minY, a.maxY),
  };
}

export function expandBounds(b: Bounds, pad: number): Bounds {
  return {
    minX: b.minX - pad,
    minY: b.minY - pad,
    maxX: b.maxX + pad,
    maxY: b.maxY + pad,
  };
}

export function boundsWidth(b: Bounds): number {
  return b.maxX - b.minX;
}

export function boundsHeight(b: Bounds): number {
  return b.maxY - b.minY;
}

export function boundsCenter(b: Bounds): Point2D {
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
}

export function pointInBounds(p: Point2D, b: Bounds, pad = 0): boolean {
  return p.x >= b.minX - pad && p.x <= b.maxX + pad && p.y >= b.minY - pad && p.y <= b.maxY + pad;
}
