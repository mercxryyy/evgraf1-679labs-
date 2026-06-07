// src/lib/shapes/PathBezier.ts
import type { Bounds } from "../math/bounds";
import type { Point2D } from "../math/point";
import { lerp } from "../math/point";
import type { RasterRenderer } from "../renderer/RasterRenderer";
import { Shape } from "./Shape";
import type { ShapeJSON } from "./Shape";
import { boundsForPolyline, distanceToPolyline } from "./BezierBase";

export type PathMode = "polyline" | "bezier" | "catmullRom";

export interface PathBezierJSON extends ShapeJSON {
  type: "pathBezier";
  points: Point2D[];
  closed: boolean;
  mode: PathMode;
}

// Катмулл-Ром сплайн (гладкий)
function catmullRom(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

// Кубическая Безье (для режима bezier)
function cubicBezierPoint(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const mt = 1 - t;
  const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
  const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
  return { x, y };
}

export class PathBezier extends Shape {
  points: Point2D[];
  closed = false;
  mode: PathMode = "catmullRom";

  constructor(points: Point2D[] = [{ x: -100, y: 20 }, { x: -30, y: -80 }, { x: 55, y: 45 }, { x: 110, y: -35 }]) {
    super("pathBezier", "Путь Безье / сплайн");
    this.points = points.map((p) => ({ ...p }));
    this.fillOpacity = 0;
    this.strokeStyle = "#2dd4bf";
    this.strokeWidth = 3;
  }

  // ------------------------------------------------------------
  // Построение гладкой ломаной (аппроксимация для отрисовки)
  // ------------------------------------------------------------
  localPolyline(stepsPerSegment = 24): Point2D[] {
    if (this.points.length === 0) return [];
    if (this.mode === "polyline") {
      // Ломаная без сглаживания
      const pts = this.points.map((p) => ({ ...p }));
      if (this.closed && pts.length > 1) pts.push({ ...pts[0] });
      return pts;
    }

    if (this.mode === "bezier") {
      // Режим кубических сегментов (не гарантирует гладкость на стыках)
      const result: Point2D[] = [];
      const n = this.points.length;
      for (let i = 0; i + 3 < n; i += 3) {
        const p0 = this.points[i];
        const p1 = this.points[i + 1];
        const p2 = this.points[i + 2];
        const p3 = this.points[i + 3];
        for (let s = 0; s <= stepsPerSegment; s++) {
          const t = s / stepsPerSegment;
          result.push(cubicBezierPoint(p0, p1, p2, p3, t));
        }
      }
      if (this.closed && result.length > 0 && this.points.length >= 2) {
        const first = this.points[0];
        const last = this.points[this.points.length - 1];
        for (let s = 1; s <= stepsPerSegment; s++) {
          const t = s / stepsPerSegment;
          result.push({ x: lerp(last.x, first.x, t), y: lerp(last.y, first.y, t) });
        }
      }
      return result;
    }

    // режим catmullRom – ГЛАДКИЙ СПЛАЙН
    const result: Point2D[] = [];
    const n = this.points.length;
    const totalSegments = this.closed ? n : n - 1;
    for (let i = 0; i < totalSegments; i++) {
      const p0 = this.points[(i - 1 + n) % n];
      const p1 = this.points[i % n];
      const p2 = this.points[(i + 1) % n];
      const p3 = this.points[(i + 2) % n];
      for (let s = 0; s < stepsPerSegment; s++) {
        const t = s / stepsPerSegment;
        result.push(catmullRom(p0, p1, p2, p3, t));
      }
    }
    // Добавляем последнюю точку для замыкания (если замкнут)
    if (this.closed && n > 2) {
      result.push({ ...this.points[0] });
    } else if (!this.closed && n > 1) {
      result.push({ ...this.points[n - 1] });
    }
    return result;
  }

  devicePolyline(): Point2D[] {
    return this.localPolyline().map((p) => this.transformPointToDevice(p.x, p.y));
  }

  // ------------------------------------------------------------
  // Управление контрольными точками
  // ------------------------------------------------------------
  controlPointsLocal(): Point2D[] {
    return this.points;
  }

  setControlPoint(index: number, local: Point2D): void {
    if (index >= 0 && index < this.points.length) this.points[index] = { ...local };
  }

  addPointLocal(x: number, y: number): void {
    this.points.push({ x, y });
  }

  insertPointNear(point: Point2D): number {
    this.points.push({ ...point });
    return this.points.length - 1;
  }

  removePoint(index: number): void {
    if (index >= 0 && index < this.points.length) this.points.splice(index, 1);
  }

  // ------------------------------------------------------------
  // Отрисовка
  // ------------------------------------------------------------
  drawRaster(renderer: RasterRenderer): void {
    const controls = this.points.map((p) => this.transformPointToDevice(p.x, p.y));
    // Рисуем вспомогательные линии (серые)
    if (this.mode === "bezier") {
      renderer.strokePolyline(controls, "#64748b", 0.65, 1, false);
    } else {
      renderer.strokePolyline(controls, "#64748b", 0.65, 1, this.closed);
    }
    // Рисуем саму кривую
    const curve = this.devicePolyline();
    renderer.strokePolyline(curve, this.strokeStyle, this.strokeOpacity, this.strokeWidth, this.closed);
  }

  // ------------------------------------------------------------
  // Hit test
  // ------------------------------------------------------------
  hitTest(deviceX: number, deviceY: number): boolean {
    return distanceToPolyline({ x: deviceX, y: deviceY }, this.devicePolyline()) <= Math.max(7, this.strokeWidth + 4);
  }

  // ------------------------------------------------------------
  // Границы
  // ------------------------------------------------------------
  getBounds(): Bounds {
    return boundsForPolyline(this.devicePolyline(), this.strokeWidth + 2);
  }

  getLocalBounds(): Bounds {
    return boundsForPolyline(this.localPolyline(), 0);
  }

  // ------------------------------------------------------------
  // Сериализация и клонирование
  // ------------------------------------------------------------
  clone(): PathBezier {
    const p = new PathBezier(this.points);
    p.closed = this.closed;
    p.mode = this.mode;
    p.applyBaseJSON(this.toJSON());
    return p;
  }

  toJSON(): PathBezierJSON {
    return { type: "pathBezier", ...this.baseJSON(), points: this.points.map((p) => ({ ...p })), closed: this.closed, mode: this.mode };
  }

  static fromJSON(json: PathBezierJSON): PathBezier {
    const p = new PathBezier(json.points);
    p.closed = json.closed;
    p.mode = json.mode;
    p.applyBaseJSON(json);
    return p;
  }
}