import type { Bounds } from "../math/bounds";
import { boundsCenter } from "../math/bounds";
import { distance } from "../math/point";
import type { Point2D } from "../math/point";
import type { Shape } from "../shapes/Shape";
import { QuadraticBezier } from "../shapes/QuadraticBezier";
import { CubicBezier } from "../shapes/CubicBezier";
import { PathBezier } from "../shapes/PathBezier";

export type ResizeHandle = "nw" | "ne" | "se" | "sw";
export type EditorHandle =
  | { kind: "resize"; handle: ResizeHandle; point: Point2D }
  | { kind: "rotate"; point: Point2D }
  | { kind: "control"; index: number; point: Point2D };

const MIN_LOCAL_SIZE = 1;

export function effectiveLocalBounds(shape: Shape): Bounds {
  const raw = shape.getLocalBounds();
  let { minX, minY, maxX, maxY } = raw;

  if (Math.abs(maxX - minX) < MIN_LOCAL_SIZE) {
    const cx = (minX + maxX) / 2;
    minX = cx - MIN_LOCAL_SIZE / 2;
    maxX = cx + MIN_LOCAL_SIZE / 2;
  }

  if (Math.abs(maxY - minY) < MIN_LOCAL_SIZE) {
    const cy = (minY + maxY) / 2;
    minY = cy - MIN_LOCAL_SIZE / 2;
    maxY = cy + MIN_LOCAL_SIZE / 2;
  }

  return { minX, minY, maxX, maxY };
}

export function localPointForResizeHandle(bounds: Bounds, handle: ResizeHandle): Point2D {
  return {
    x: handle.includes("w") ? bounds.minX : bounds.maxX,
    y: handle.includes("n") ? bounds.minY : bounds.maxY,
  };
}

export function oppositeResizeHandle(handle: ResizeHandle): ResizeHandle {
  switch (handle) {
    case "nw": return "se";
    case "ne": return "sw";
    case "se": return "nw";
    case "sw": return "ne";
  }
}

export function resizeHandlePointsForShape(shape: Shape): Array<{ handle: ResizeHandle; point: Point2D; local: Point2D }> {
  const bounds = effectiveLocalBounds(shape);
  return (["nw", "ne", "se", "sw"] as ResizeHandle[]).map((handle) => {
    const local = localPointForResizeHandle(bounds, handle);
    return {
      handle,
      local,
      point: shape.transformPointToDevice(local.x, local.y),
    };
  });
}

export function selectionBoxPoints(shape: Shape): Point2D[] {
  const bounds = effectiveLocalBounds(shape);
  return (["nw", "ne", "se", "sw"] as ResizeHandle[]).map((handle) => {
    const local = localPointForResizeHandle(bounds, handle);
    return shape.transformPointToDevice(local.x, local.y);
  });
}

export function rotateHandlePointForShape(shape: Shape): Point2D {
  const bounds = effectiveLocalBounds(shape);
  const centerLocal = boundsCenter(bounds);
  const centerDevice = shape.transformPointToDevice(centerLocal.x, centerLocal.y);
  const topMiddleDevice = shape.transformPointToDevice(centerLocal.x, bounds.minY);
  const vx = topMiddleDevice.x - centerDevice.x;
  const vy = topMiddleDevice.y - centerDevice.y;
  const len = Math.hypot(vx, vy) || 1;

  return {
    x: topMiddleDevice.x + (vx / len) * 36,
    y: topMiddleDevice.y + (vy / len) * 36,
  };
}

export function shapeControlPoints(shape: Shape): Point2D[] {
  if (shape instanceof QuadraticBezier || shape instanceof CubicBezier || shape instanceof PathBezier) {
    return shape.controlPointsLocal().map((p) => shape.transformPointToDevice(p.x, p.y));
  }
  return [];
}

export function hitHandle(shape: Shape, p: Point2D, radius = 10): EditorHandle | null {
  const controls = shapeControlPoints(shape);
  for (let i = 0; i < controls.length; i += 1) {
    if (distance(p, controls[i]) <= radius) {
      return { kind: "control", index: i, point: controls[i] };
    }
  }

  const rotate = rotateHandlePointForShape(shape);
  if (distance(p, rotate) <= radius + 2) return { kind: "rotate", point: rotate };

  for (const item of resizeHandlePointsForShape(shape)) {
    if (distance(p, item.point) <= radius) return { kind: "resize", handle: item.handle, point: item.point };
  }

  return null;
}
