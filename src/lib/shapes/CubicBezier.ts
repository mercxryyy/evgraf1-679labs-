import type { Bounds } from "../math/bounds";
import type { Point2D } from "../math/point";
import { lerp } from "../math/point";
import type { RasterRenderer } from "../renderer/RasterRenderer";
import { Shape } from "./Shape";
import type { ShapeJSON } from "./Shape";
import { boundsForPolyline, distanceToPolyline } from "./BezierBase";

export interface CubicBezierJSON extends ShapeJSON {
  type: "cubicBezier";
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;
}

export class CubicBezier extends Shape {
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;

  constructor(
    p0: Point2D = { x: -90, y: 45 },
    p1: Point2D = { x: -40, y: -90 },
    p2: Point2D = { x: 50, y: 90 },
    p3: Point2D = { x: 90, y: -35 },
  ) {
    super("cubicBezier", "Кубическая Безье");
    this.p0 = { ...p0 };
    this.p1 = { ...p1 };
    this.p2 = { ...p2 };
    this.p3 = { ...p3 };
    this.fillOpacity = 0;
    this.strokeStyle = "#fb7185";
    this.strokeWidth = 3;
  }

  pointAt(t: number): Point2D {
    const x01 = lerp(this.p0.x, this.p1.x, t);
    const y01 = lerp(this.p0.y, this.p1.y, t);
    const x12 = lerp(this.p1.x, this.p2.x, t);
    const y12 = lerp(this.p1.y, this.p2.y, t);
    const x23 = lerp(this.p2.x, this.p3.x, t);
    const y23 = lerp(this.p2.y, this.p3.y, t);
    const x012 = lerp(x01, x12, t);
    const y012 = lerp(y01, y12, t);
    const x123 = lerp(x12, x23, t);
    const y123 = lerp(y12, y23, t);
    return { x: lerp(x012, x123, t), y: lerp(y012, y123, t) };
  }

  localPolyline(steps = 80): Point2D[] {
    const pts: Point2D[] = [];
    for (let i = 0; i <= steps; i += 1) pts.push(this.pointAt(i / steps));
    return pts;
  }

  devicePolyline(steps = 80): Point2D[] {
    return this.localPolyline(steps).map((p) => this.transformPointToDevice(p.x, p.y));
  }

  controlPointsLocal(): Point2D[] {
    return [this.p0, this.p1, this.p2, this.p3];
  }

  setControlPoint(index: number, local: Point2D): void {
    if (index === 0) this.p0 = { ...local };
    if (index === 1) this.p1 = { ...local };
    if (index === 2) this.p2 = { ...local };
    if (index === 3) this.p3 = { ...local };
  }

  drawRaster(renderer: RasterRenderer): void {
    const controls = this.controlPointsLocal().map((p) => this.transformPointToDevice(p.x, p.y));
    renderer.strokePolyline([controls[0], controls[1]], "#64748b", 0.65, 1, false);
    renderer.strokePolyline([controls[2], controls[3]], "#64748b", 0.65, 1, false);
    renderer.strokePolyline(this.devicePolyline(), this.strokeStyle, this.strokeOpacity, this.strokeWidth, false);
  }

  hitTest(deviceX: number, deviceY: number): boolean {
    return distanceToPolyline({ x: deviceX, y: deviceY }, this.devicePolyline()) <= Math.max(7, this.strokeWidth + 4);
  }

  getBounds(): Bounds {
    return boundsForPolyline(this.devicePolyline(120), this.strokeWidth + 2);
  }

  getLocalBounds(): Bounds {
    return boundsForPolyline(this.localPolyline(120), 0);
  }

  clone(): CubicBezier {
    const c = new CubicBezier(this.p0, this.p1, this.p2, this.p3);
    c.applyBaseJSON(this.toJSON());
    return c;
  }

  toJSON(): CubicBezierJSON {
    return { type: "cubicBezier", ...this.baseJSON(), p0: { ...this.p0 }, p1: { ...this.p1 }, p2: { ...this.p2 }, p3: { ...this.p3 } };
  }

  static fromJSON(json: CubicBezierJSON): CubicBezier {
    const c = new CubicBezier(json.p0, json.p1, json.p2, json.p3);
    c.applyBaseJSON(json);
    return c;
  }
}
