export interface Point2D {
  x: number;
  y: number;
}

export function point(x = 0, y = 0): Point2D {
  return { x, y };
}

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clonePoint(p: Point2D): Point2D {
  return { x: p.x, y: p.y };
}
