import { boundsFromPoints, expandBounds } from "../math/bounds";
import type { Bounds } from "../math/bounds";
import { distance } from "../math/point";
import type { Point2D } from "../math/point";

export function distanceToPolyline(p: Point2D, pts: Point2D[]): number {
  if (pts.length === 0) return Infinity;
  if (pts.length === 1) return distance(p, pts[0]);
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    best = Math.min(best, distance(p, q));
  }
  return best;
}

export function boundsForPolyline(pts: Point2D[], pad: number): Bounds {
  return expandBounds(boundsFromPoints(pts), pad);
}
