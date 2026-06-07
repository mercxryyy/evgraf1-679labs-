import type { Bounds } from "../math/bounds";
import { boundsCenter, boundsHeight, boundsWidth } from "../math/bounds";
import { composeTransform, inverse, transformPoint } from "../math/mat3";
import type { Mat3 } from "../math/mat3";
import type { Point2D } from "../math/point";
import type { RasterRenderer } from "../renderer/RasterRenderer";

export type ShapeType = "rect" | "line" | "oval" | "triangle" | "quadraticBezier" | "cubicBezier" | "pathBezier";

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface BaseShapeJSON {
  id: string;
  name: string;
  transform: Transform;
  fillStyle: string;
  fillOpacity: number;
  strokeStyle: string;
  strokeWidth: number;
  strokeOpacity: number;
}

export interface ShapeJSON extends BaseShapeJSON {
  type: ShapeType;
  [key: string]: unknown;
}

export function createId(prefix = "shape"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export abstract class Shape {
  readonly type: ShapeType;
  id: string;
  name: string;
  transform: Transform;
  fillStyle = "#38bdf8";
  fillOpacity = 0.55;
  strokeStyle = "#e2e8f0";
  strokeWidth = 2;
  strokeOpacity = 1;

  protected constructor(type: ShapeType, name: string, id = createId(type)) {
    this.type = type;
    this.id = id;
    this.name = name;
    this.transform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  }

  getLocalToDeviceMatrix(): Mat3 {
    return composeTransform(
      this.transform.x,
      this.transform.y,
      this.transform.rotation,
      this.transform.scaleX,
      this.transform.scaleY,
    );
  }

  getDeviceToLocalMatrix(): Mat3 {
    return inverse(this.getLocalToDeviceMatrix());
  }

  transformPointToDevice(px: number, py: number): Point2D {
    return transformPoint(this.getLocalToDeviceMatrix(), px, py);
  }

  transformPointToLocal(px: number, py: number): Point2D {
    return transformPoint(this.getDeviceToLocalMatrix(), px, py);
  }

  getCenter(): Point2D {
    return boundsCenter(this.getBounds());
  }

  setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
    const local = this.getLocalBounds();
    const localW = Math.max(1, boundsWidth(local));
    const localH = Math.max(1, boundsHeight(local));
    const nextW = Math.max(8, Math.abs(maxX - minX));
    const nextH = Math.max(8, Math.abs(maxY - minY));
    this.transform.x = (minX + maxX) / 2;
    this.transform.y = (minY + maxY) / 2;
    this.transform.scaleX = nextW / localW;
    this.transform.scaleY = nextH / localH;
  }

  protected baseJSON(): BaseShapeJSON {
    return {
      id: this.id,
      name: this.name,
      transform: { ...this.transform },
      fillStyle: this.fillStyle,
      fillOpacity: this.fillOpacity,
      strokeStyle: this.strokeStyle,
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity,
    };
  }

  protected applyBaseJSON(json: ShapeJSON): void {
    this.id = json.id;
    this.name = json.name;
    this.transform = { ...json.transform };
    this.fillStyle = json.fillStyle;
    this.fillOpacity = json.fillOpacity;
    this.strokeStyle = json.strokeStyle;
    this.strokeWidth = json.strokeWidth;
    this.strokeOpacity = json.strokeOpacity;
  }

  abstract drawRaster(renderer: RasterRenderer): void;
  abstract hitTest(deviceX: number, deviceY: number): boolean;
  abstract getBounds(): Bounds;
  abstract getLocalBounds(): Bounds;
  abstract clone(): Shape;
  abstract toJSON(): ShapeJSON;
}
