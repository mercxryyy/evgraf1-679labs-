import { boundsFromPoints } from "../math/bounds";
import type { Bounds } from "../math/bounds";
import type { RasterRenderer } from "../renderer/RasterRenderer";
import { Shape } from "./Shape";
import type { ShapeJSON } from "./Shape";

export interface OvalJSON extends ShapeJSON {
  type: "oval";
  rx: number;
  ry: number;
}

export class Oval extends Shape {
  rx: number;
  ry: number;

  constructor(rx = 70, ry = 45) {
    super("oval", "Овал");
    this.rx = rx;
    this.ry = ry;
    this.fillStyle = "#a78bfa";
  }

  sampleDevicePoints(steps = 96) {
    const pts = [];
    for (let i = 0; i < steps; i += 1) {
      const t = (i / steps) * Math.PI * 2;
      pts.push(this.transformPointToDevice(Math.cos(t) * this.rx, Math.sin(t) * this.ry));
    }
    return pts;
  }

  drawRaster(renderer: RasterRenderer): void {
    const pts = this.sampleDevicePoints();
    if (this.fillOpacity > 0) renderer.fillPolygon(pts, this.fillStyle, this.fillOpacity);
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      renderer.strokePolyline(pts, this.strokeStyle, this.strokeOpacity, this.strokeWidth, true);
    }
  }

  hitTest(deviceX: number, deviceY: number): boolean {
    const p = this.transformPointToLocal(deviceX, deviceY);
    const value = (p.x * p.x) / (this.rx * this.rx) + (p.y * p.y) / (this.ry * this.ry);
    return value <= 1.08;
  }

  getBounds(): Bounds {
    return boundsFromPoints(this.sampleDevicePoints(128));
  }

  getLocalBounds(): Bounds {
    return { minX: -this.rx, minY: -this.ry, maxX: this.rx, maxY: this.ry };
  }

  clone(): Oval {
    const o = new Oval(this.rx, this.ry);
    o.applyBaseJSON(this.toJSON());
    return o;
  }

  toJSON(): OvalJSON {
    return { type: "oval", ...this.baseJSON(), rx: this.rx, ry: this.ry };
  }

  static fromJSON(json: OvalJSON): Oval {
    const o = new Oval(json.rx, json.ry);
    o.applyBaseJSON(json);
    return o;
  }
}
