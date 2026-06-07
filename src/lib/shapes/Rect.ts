import { boundsFromPoints } from "../math/bounds";
import type { Bounds } from "../math/bounds";
import type { RasterRenderer } from "../renderer/RasterRenderer";
import { Shape } from "./Shape";
import type { ShapeJSON } from "./Shape";

export interface RectJSON extends ShapeJSON {
  type: "rect";
  w: number;
  h: number;
}

export class Rect extends Shape {
  w: number;
  h: number;

  constructor(w = 120, h = 80) {
    super("rect", "Прямоугольник");
    this.w = w;
    this.h = h;
  }

  localCorners() {
    const hw = this.w / 2;
    const hh = this.h / 2;
    return [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];
  }

  deviceCorners() {
    return this.localCorners().map((p) => this.transformPointToDevice(p.x, p.y));
  }

  drawRaster(renderer: RasterRenderer): void {
    const pts = this.deviceCorners();
    if (this.fillOpacity > 0) renderer.fillPolygon(pts, this.fillStyle, this.fillOpacity);
    if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
      renderer.strokePolyline(pts, this.strokeStyle, this.strokeOpacity, this.strokeWidth, true);
    }
  }

  hitTest(deviceX: number, deviceY: number): boolean {
    const p = this.transformPointToLocal(deviceX, deviceY);
    return Math.abs(p.x) <= this.w / 2 + this.strokeWidth && Math.abs(p.y) <= this.h / 2 + this.strokeWidth;
  }

  getBounds(): Bounds {
    return boundsFromPoints(this.deviceCorners());
  }

  getLocalBounds(): Bounds {
    return { minX: -this.w / 2, minY: -this.h / 2, maxX: this.w / 2, maxY: this.h / 2 };
  }

  clone(): Rect {
    const r = new Rect(this.w, this.h);
    r.applyBaseJSON(this.toJSON());
    return r;
  }

  toJSON(): RectJSON {
    return { type: "rect", ...this.baseJSON(), w: this.w, h: this.h };
  }

  static fromJSON(json: RectJSON): Rect {
    const r = new Rect(json.w, json.h);
    r.applyBaseJSON(json);
    return r;
  }
}
