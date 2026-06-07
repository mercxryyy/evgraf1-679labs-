import type { Bounds } from "../math/bounds";
import type { Point2D } from "../math/point";
import { lerp } from "../math/point";
import type { RasterRenderer } from "../renderer/RasterRenderer";
import { Shape } from "./Shape";
import type { ShapeJSON } from "./Shape";
import { boundsForPolyline, distanceToPolyline } from "./BezierBase";

export interface QuadraticBezierJSON extends ShapeJSON {
  type: "quadraticBezier";
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;
}

export class QuadraticBezier extends Shape {
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;

  constructor(p0: Point2D = { x: -80, y: 45 }, p1: Point2D = { x: 0, y: -80 }, p2: Point2D = { x: 80, y: 45 }) {
    super("quadraticBezier", "Квадратичная Безье");
    this.p0 = { ...p0 };
    this.p1 = { ...p1 };
    this.p2 = { ...p2 };
    this.fillOpacity = 0;
    this.strokeStyle = "#facc15";
    this.strokeWidth = 3;
  }

  pointAt(t: number): Point2D {
    const x01 = lerp(this.p0.x, this.p1.x, t);
    const y01 = lerp(this.p0.y, this.p1.y, t);
    const x12 = lerp(this.p1.x, this.p2.x, t);
    const y12 = lerp(this.p1.y, this.p2.y, t);
    return { x: lerp(x01, x12, t), y: lerp(y01, y12, t) };
  }

  localPolyline(steps = 64): Point2D[] {
    const pts: Point2D[] = [];
    for (let i = 0; i <= steps; i += 1) pts.push(this.pointAt(i / steps));
    return pts;
  }

  devicePolyline(steps = 64): Point2D[] {
    return this.localPolyline(steps).map((p) => this.transformPointToDevice(p.x, p.y));
  }

  controlPointsLocal(): Point2D[] {
    return [this.p0, this.p1, this.p2];
  }

  setControlPoint(index: number, local: Point2D): void {
    if (index === 0) this.p0 = { ...local };
    if (index === 1) this.p1 = { ...local };
    if (index === 2) this.p2 = { ...local };
  }

  drawRaster(renderer: RasterRenderer): void {
    const curve = this.devicePolyline();
    const controls = this.controlPointsLocal().map((p) => this.transformPointToDevice(p.x, p.y));
    renderer.strokePolyline([controls[0], controls[1], controls[2]], "#64748b", 0.65, 1, false);
    renderer.strokePolyline(curve, this.strokeStyle, this.strokeOpacity, this.strokeWidth, false);
  }

  hitTest(deviceX: number, deviceY: number): boolean {
    return distanceToPolyline({ x: deviceX, y: deviceY }, this.devicePolyline()) <= Math.max(7, this.strokeWidth + 4);
  }

  getBounds(): Bounds {
    return boundsForPolyline(this.devicePolyline(96), this.strokeWidth + 2);
  }

  getLocalBounds(): Bounds {
    return boundsForPolyline(this.localPolyline(96), 0);
  }

  clone(): QuadraticBezier {
    const q = new QuadraticBezier(this.p0, this.p1, this.p2);
    q.applyBaseJSON(this.toJSON());
    return q;
  }

  toJSON(): QuadraticBezierJSON {
    return { type: "quadraticBezier", ...this.baseJSON(), p0: { ...this.p0 }, p1: { ...this.p1 }, p2: { ...this.p2 } };
  }

  static fromJSON(json: QuadraticBezierJSON): QuadraticBezier {
    const q = new QuadraticBezier(json.p0, json.p1, json.p2);
    q.applyBaseJSON(json);
    return q;
  }
}
