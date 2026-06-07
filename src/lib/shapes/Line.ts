import { boundsFromPoints, expandBounds } from "../math/bounds";
import type { Bounds } from "../math/bounds";
import { distance } from "../math/point";
import type { Point2D } from "../math/point";
import type { RasterRenderer } from "../renderer/RasterRenderer";
import { Shape } from "./Shape";
import type { ShapeJSON } from "./Shape";

export interface LineJSON extends ShapeJSON {
  type: "line";
  p1: Point2D;
  p2: Point2D;
}

function distanceToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return distance(p, { x: a.x + dx * t, y: a.y + dy * t });
}

export class Line extends Shape {
  p1: Point2D;
  p2: Point2D;

  constructor(p1: Point2D = { x: -60, y: 0 }, p2: Point2D = { x: 60, y: 0 }) {
    super("line", "Линия");
    this.p1 = { ...p1 };
    this.p2 = { ...p2 };
    this.fillOpacity = 0;
    this.strokeStyle = "#f97316";
    this.strokeWidth = 3;
  }

  devicePoints() {
    return [this.transformPointToDevice(this.p1.x, this.p1.y), this.transformPointToDevice(this.p2.x, this.p2.y)];
  }

  drawRaster(renderer: RasterRenderer): void {
    const [a, b] = this.devicePoints();
    renderer.drawLine(a, b, this.strokeStyle, this.strokeOpacity, this.strokeWidth);
  }

  hitTest(deviceX: number, deviceY: number): boolean {
    const [a, b] = this.devicePoints();
    return distanceToSegment({ x: deviceX, y: deviceY }, a, b) <= Math.max(6, this.strokeWidth + 3);
  }

  getBounds(): Bounds {
    return expandBounds(boundsFromPoints(this.devicePoints()), this.strokeWidth + 2);
  }

  getLocalBounds(): Bounds {
    return boundsFromPoints([this.p1, this.p2]);
  }

  clone(): Line {
    const l = new Line(this.p1, this.p2);
    l.applyBaseJSON(this.toJSON());
    return l;
  }

  toJSON(): LineJSON {
    return { type: "line", ...this.baseJSON(), p1: { ...this.p1 }, p2: { ...this.p2 } };
  }

  static fromJSON(json: LineJSON): Line {
    const l = new Line(json.p1, json.p2);
    l.applyBaseJSON(json);
    return l;
  }
}
