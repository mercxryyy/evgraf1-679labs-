import type { Point2D } from "../math/point";

export type LineAlgorithm = "bresenham" | "wu";

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function parseColor(color: string, opacity = 1): RGBA {
  const css = color.trim();
  if (css.startsWith("#")) {
    const raw = css.slice(1);
    const full = raw.length === 3
      ? raw.split("").map((ch) => ch + ch).join("")
      : raw.padEnd(6, "0").slice(0, 6);
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: clamp255(opacity * 255),
    };
  }

  const nums = css.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [255, 255, 255];
  return {
    r: clamp255(nums[0] ?? 255),
    g: clamp255(nums[1] ?? 255),
    b: clamp255(nums[2] ?? 255),
    a: clamp255((nums[3] ?? opacity) * 255),
  };
}

export class RasterRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  imageData: ImageData;
  buf: Uint8ClampedArray;
  width = 1;
  height = 1;
  dpr = 1;
  lineAlgorithm: LineAlgorithm = "bresenham";

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Canvas 2D context is not available");
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.imageData = ctx.createImageData(1, 1);
    this.buf = this.imageData.data;
    this.resizeToDisplaySize();
  }

  resizeToDisplaySize(): boolean {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * this.dpr));
    const height = Math.max(1, Math.floor(rect.height * this.dpr));

    if (this.canvas.width === width && this.canvas.height === height) {
      return false;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.ctx.imageSmoothingEnabled = false;
    this.imageData = this.ctx.createImageData(width, height);
    this.buf = this.imageData.data;
    return true;
  }

  clear(color = "#0f172a"): void {
    const c = parseColor(color, 1);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const i = (y * this.width + x) * 4;
        this.buf[i] = c.r;
        this.buf[i + 1] = c.g;
        this.buf[i + 2] = c.b;
        this.buf[i + 3] = c.a;
      }
    }
  }

  present(): void {
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  blendPixel(x: number, y: number, color: RGBA, coverage = 1): void {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) {
      return;
    }

    const idx = (iy * this.width + ix) * 4;
    const srcA = Math.max(0, Math.min(1, (color.a / 255) * coverage));
    const dstA = this.buf[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);

    if (outA <= 0) {
      this.buf[idx] = 0;
      this.buf[idx + 1] = 0;
      this.buf[idx + 2] = 0;
      this.buf[idx + 3] = 0;
      return;
    }

    this.buf[idx] = clamp255((color.r * srcA + this.buf[idx] * dstA * (1 - srcA)) / outA);
    this.buf[idx + 1] = clamp255((color.g * srcA + this.buf[idx + 1] * dstA * (1 - srcA)) / outA);
    this.buf[idx + 2] = clamp255((color.b * srcA + this.buf[idx + 2] * dstA * (1 - srcA)) / outA);
    this.buf[idx + 3] = clamp255(outA * 255);
  }

  drawLine(a: Point2D, b: Point2D, color: string, opacity = 1, width = 1): void {
    const rgba = parseColor(color, opacity);
    if (this.lineAlgorithm === "wu" && width <= 1.5) {
      this.drawLineWu(a, b, rgba);
      return;
    }
    this.drawLineBresenham(a, b, rgba, Math.max(1, width));
  }

  drawLineBresenham(a: Point2D, b: Point2D, color: RGBA, width = 1): void {
    let x0 = Math.round(a.x);
    let y0 = Math.round(a.y);
    const x1 = Math.round(b.x);
    const y1 = Math.round(b.y);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    const radius = Math.max(0, Math.floor(width / 2));

    while (true) {
      for (let yy = -radius; yy <= radius; yy += 1) {
        for (let xx = -radius; xx <= radius; xx += 1) {
          if (xx * xx + yy * yy <= radius * radius + 0.5) {
            this.blendPixel(x0 + xx, y0 + yy, color);
          }
        }
      }
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  drawLineWu(a: Point2D, b: Point2D, color: RGBA): void {
    const ipart = Math.floor;
    const round = Math.round;
    const fpart = (x: number) => x - Math.floor(x);
    const rfpart = (x: number) => 1 - fpart(x);

    let x0 = a.x;
    let y0 = a.y;
    let x1 = b.x;
    let y1 = b.y;
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);

    if (steep) {
      [x0, y0] = [y0, x0];
      [x1, y1] = [y1, x1];
    }
    if (x0 > x1) {
      [x0, x1] = [x1, x0];
      [y0, y1] = [y1, y0];
    }

    const dx = x1 - x0;
    const dy = y1 - y0;
    const gradient = dx === 0 ? 1 : dy / dx;

    let xEnd = round(x0);
    let yEnd = y0 + gradient * (xEnd - x0);
    let xGap = rfpart(x0 + 0.5);
    const xPixel1 = xEnd;
    const yPixel1 = ipart(yEnd);
    if (steep) {
      this.blendPixel(yPixel1, xPixel1, color, rfpart(yEnd) * xGap);
      this.blendPixel(yPixel1 + 1, xPixel1, color, fpart(yEnd) * xGap);
    } else {
      this.blendPixel(xPixel1, yPixel1, color, rfpart(yEnd) * xGap);
      this.blendPixel(xPixel1, yPixel1 + 1, color, fpart(yEnd) * xGap);
    }
    let intery = yEnd + gradient;

    xEnd = round(x1);
    yEnd = y1 + gradient * (xEnd - x1);
    xGap = fpart(x1 + 0.5);
    const xPixel2 = xEnd;
    const yPixel2 = ipart(yEnd);

    if (steep) {
      this.blendPixel(yPixel2, xPixel2, color, rfpart(yEnd) * xGap);
      this.blendPixel(yPixel2 + 1, xPixel2, color, fpart(yEnd) * xGap);
      for (let x = xPixel1 + 1; x < xPixel2; x += 1) {
        this.blendPixel(ipart(intery), x, color, rfpart(intery));
        this.blendPixel(ipart(intery) + 1, x, color, fpart(intery));
        intery += gradient;
      }
    } else {
      this.blendPixel(xPixel2, yPixel2, color, rfpart(yEnd) * xGap);
      this.blendPixel(xPixel2, yPixel2 + 1, color, fpart(yEnd) * xGap);
      for (let x = xPixel1 + 1; x < xPixel2; x += 1) {
        this.blendPixel(x, ipart(intery), color, rfpart(intery));
        this.blendPixel(x, ipart(intery) + 1, color, fpart(intery));
        intery += gradient;
      }
    }
  }

  strokePolyline(points: Point2D[], color: string, opacity = 1, width = 1, closed = false): void {
    if (points.length < 2) return;
    for (let i = 0; i < points.length - 1; i += 1) {
      this.drawLine(points[i], points[i + 1], color, opacity, width);
    }
    if (closed) {
      this.drawLine(points[points.length - 1], points[0], color, opacity, width);
    }
  }

  fillPolygon(points: Point2D[], color: string, opacity = 1): void {
    if (points.length < 3) return;
    const rgba = parseColor(color, opacity);
    let minX = Math.floor(Math.min(...points.map((p) => p.x)));
    let maxX = Math.ceil(Math.max(...points.map((p) => p.x)));
    let minY = Math.floor(Math.min(...points.map((p) => p.y)));
    let maxY = Math.ceil(Math.max(...points.map((p) => p.y)));
    minX = Math.max(0, minX);
    minY = Math.max(0, minY);
    maxX = Math.min(this.width - 1, maxX);
    maxY = Math.min(this.height - 1, maxY);

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (this.pointInPolygon({ x: x + 0.5, y: y + 0.5 }, points)) {
          this.blendPixel(x, y, rgba);
        }
      }
    }
  }

  pointInPolygon(p: Point2D, poly: Point2D[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
      const pi = poly[i];
      const pj = poly[j];
      const intersect = pi.y > p.y !== pj.y > p.y &&
        p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y + Number.EPSILON) + pi.x;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  fillEllipse(center: Point2D, rx: number, ry: number, color: string, opacity = 1): void {
    const rgba = parseColor(color, opacity);
    const minX = Math.max(0, Math.floor(center.x - rx));
    const maxX = Math.min(this.width - 1, Math.ceil(center.x + rx));
    const minY = Math.max(0, Math.floor(center.y - ry));
    const maxY = Math.min(this.height - 1, Math.ceil(center.y + ry));
    const rx2 = rx * rx || 1;
    const ry2 = ry * ry || 1;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x + 0.5 - center.x;
        const dy = y + 0.5 - center.y;
        if ((dx * dx) / rx2 + (dy * dy) / ry2 <= 1) {
          this.blendPixel(x, y, rgba);
        }
      }
    }
  }

  strokeEllipse(center: Point2D, rx: number, ry: number, color: string, opacity = 1, width = 1): void {
    const points: Point2D[] = [];
    const steps = Math.max(32, Math.ceil(Math.max(rx, ry) / 2));
    for (let i = 0; i < steps; i += 1) {
      const t = (i / steps) * Math.PI * 2;
      points.push({ x: center.x + Math.cos(t) * rx, y: center.y + Math.sin(t) * ry });
    }
    this.strokePolyline(points, color, opacity, width, true);
  }

  drawSquare(center: Point2D, size: number, color: string, opacity = 1): void {
    const half = size / 2;
    this.fillPolygon([
      { x: center.x - half, y: center.y - half },
      { x: center.x + half, y: center.y - half },
      { x: center.x + half, y: center.y + half },
      { x: center.x - half, y: center.y + half },
    ], color, opacity);
  }
}
