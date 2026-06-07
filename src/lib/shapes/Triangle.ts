import { boundsFromPoints } from "../math/bounds";
import type { Bounds } from "../math/bounds";
import type { Point2D } from "../math/point";
import type { RasterRenderer } from "../renderer/RasterRenderer";
import { Shape } from "./Shape";
import type { ShapeJSON } from "./Shape";

export interface TriangleJSON extends ShapeJSON {
  type: "triangle";
  points: [Point2D, Point2D, Point2D];
}

function sign(p1: Point2D, p2: Point2D, p3: Point2D): number {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

export class Triangle extends Shape {
  points: [Point2D, Point2D, Point2D];

  constructor(points: [Point2D, Point2D, Point2D] = [{ x: 0, y: -70 }, { x: 70, y: 55 }, { x: -70, y: 55 }]) {
    super("triangle", "Треугольник");
    this.points = points.map((p) => ({ ...p })) as [Point2D, Point2D, Point2D];
    this.fillStyle = "#22c55e";
  }

  devicePoints() {
    return this.points.map((p) => this.transformPointToDevice(p.x, p.y));
  }

  drawRaster(renderer: RasterRenderer): void {
    const pts = this.devicePoints();
    if (this.fillOpacity > 0) renderer.fillPolygon(pts, this.fillStyle, this.fillOpacity);
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      renderer.strokePolyline(pts, this.strokeStyle, this.strokeOpacity, this.strokeWidth, true);
    }
  }

  hitTest(deviceX: number, deviceY: number): boolean {
    const p = this.transformPointToLocal(deviceX, deviceY);
    const [a, b, c] = this.points;
    const d1 = sign(p, a, b);
    const d2 = sign(p, b, c);
    const d3 = sign(p, c, a);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  getBounds(): Bounds {
    return boundsFromPoints(this.devicePoints());
  }

  getLocalBounds(): Bounds {
    return boundsFromPoints(this.points);
  }

  clone(): Triangle {
    const t = new Triangle(this.points);
    t.applyBaseJSON(this.toJSON());
    return t;
  }

  toJSON(): TriangleJSON {
    return { type: "triangle", ...this.baseJSON(), points: this.points.map((p) => ({ ...p })) as [Point2D, Point2D, Point2D] };
  }

  static fromJSON(json: TriangleJSON): Triangle {
    const t = new Triangle(json.points);
    t.applyBaseJSON(json);
    return t;
  }
}
