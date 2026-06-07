import { useEffect, useRef } from "react";
import type { Point2D } from "../lib/math/point";
import { RasterRenderer } from "../lib/renderer/RasterRenderer";
import type { LineAlgorithm } from "../lib/renderer/RasterRenderer";
import type { EditorTool } from "../lib/editor/editorTypes";
import {
  effectiveLocalBounds,
  hitHandle,
  localPointForResizeHandle,
  oppositeResizeHandle,
  resizeHandlePointsForShape,
  rotateHandlePointForShape,
  selectionBoxPoints,
  shapeControlPoints,
} from "../lib/editor/handles";
import type { ResizeHandle } from "../lib/editor/handles";
import type { Shape } from "../lib/shapes/Shape";
import { Rect, Line, Oval, Triangle, QuadraticBezier, CubicBezier, PathBezier } from "../lib/shapes";

interface CanvasSceneProps {
  shapes: Shape[];
  selectedId: string | null;
  tool: EditorTool;
  lineAlgorithm: LineAlgorithm;
  onShapesChange: (next: Shape[]) => void;
  onSelect: (id: string | null) => void;
  onToolChange: (tool: EditorTool) => void;
}

type DragState =
  | { mode: "move"; id: string; startPointer: Point2D; startTransform: { x: number; y: number; rotation: number; scaleX: number; scaleY: number } }
  | {
      mode: "resize";
      id: string;
      handle: ResizeHandle;
      anchorDevice: Point2D;
      anchorLocal: Point2D;
      draggedLocal: Point2D;
      rotation: number;
    }
  | { mode: "rotate"; id: string; center: Point2D; startAngle: number; startRotation: number }
  | { mode: "control"; id: string; index: number };

function shapeAt(tool: EditorTool, p: Point2D): Shape | null {
  let shape: Shape | null = null;
  switch (tool) {
    case "rect": shape = new Rect(140, 90); break;
    case "line": shape = new Line({ x: -70, y: 0 }, { x: 70, y: 0 }); break;
    case "oval": shape = new Oval(75, 48); break;
    case "triangle": shape = new Triangle(); break;
    case "quadraticBezier": shape = new QuadraticBezier(); break;
    case "cubicBezier": shape = new CubicBezier(); break;
    case "pathBezier": shape = new PathBezier(); break;
    default: return null;
  }
  shape.transform.x = p.x;
  shape.transform.y = p.y;
  return shape;
}

function findShape(shapes: Shape[], id: string | null): Shape | null {
  return shapes.find((s) => s.id === id) ?? null;
}

function updateControlPoint(shape: Shape, index: number, devicePoint: Point2D): void {
  const local = shape.transformPointToLocal(devicePoint.x, devicePoint.y);
  if (shape instanceof QuadraticBezier || shape instanceof CubicBezier || shape instanceof PathBezier) {
    shape.setControlPoint(index, local);
  }
}

function canvasPoint(canvas: HTMLCanvasElement, ev: React.PointerEvent<HTMLCanvasElement>): Point2D {
  const rect = canvas.getBoundingClientRect();
  const dpr = canvas.width / Math.max(1, rect.width);
  return {
    x: (ev.clientX - rect.left) * dpr,
    y: (ev.clientY - rect.top) * dpr,
  };
}

function shapeLocalBoundsCenterDevice(shape: Shape): Point2D {
  const b = effectiveLocalBounds(shape);
  return shape.transformPointToDevice((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2);
}

function drawSelection(renderer: RasterRenderer, shape: Shape): void {
  const corners = selectionBoxPoints(shape);
  renderer.strokePolyline(corners, "#60a5fa", 1, 2, true);

  const rotate = rotateHandlePointForShape(shape);
  const centerDevice = shapeLocalBoundsCenterDevice(shape);
  renderer.drawLine(centerDevice, rotate, "#60a5fa", 0.85, 1);
  renderer.drawSquare(rotate, 11, "#f59e0b", 1);

  for (const item of resizeHandlePointsForShape(shape)) {
    renderer.drawSquare(item.point, 10, "#60a5fa", 1);
  }

  for (const p of shapeControlPoints(shape)) {
    renderer.drawSquare(p, 9, "#22c55e", 1);
  }
}

function applyResizeWithFixedAnchor(shape: Shape, drag: Extract<DragState, { mode: "resize" }>, pointer: Point2D, minDeviceSize: number): void {
  const dxLocal = drag.draggedLocal.x - drag.anchorLocal.x;
  const dyLocal = drag.draggedLocal.y - drag.anchorLocal.y;
  if (Math.abs(dxLocal) < 1e-9 || Math.abs(dyLocal) < 1e-9) return;

  const dx = pointer.x - drag.anchorDevice.x;
  const dy = pointer.y - drag.anchorDevice.y;
  const cos = Math.cos(drag.rotation);
  const sin = Math.sin(drag.rotation);

  // Переводим вектор "опора → курсор" в систему координат фигуры,
  // но без текущего масштаба. Поэтому повёрнутая фигура масштабируется
  // вдоль собственных локальных осей, а не по осям экрана.
  const localScaledX = cos * dx + sin * dy;
  const localScaledY = -sin * dx + cos * dy;

  let scaleX = localScaledX / dxLocal;
  let scaleY = localScaledY / dyLocal;

  const minScaleX = minDeviceSize / Math.abs(dxLocal);
  const minScaleY = minDeviceSize / Math.abs(dyLocal);
  const signX = scaleX < 0 ? -1 : 1;
  const signY = scaleY < 0 ? -1 : 1;
  if (Math.abs(scaleX) < minScaleX) scaleX = signX * minScaleX;
  if (Math.abs(scaleY) < minScaleY) scaleY = signY * minScaleY;

  const anchorAfterRotateScale = {
    x: cos * (scaleX * drag.anchorLocal.x) - sin * (scaleY * drag.anchorLocal.y),
    y: sin * (scaleX * drag.anchorLocal.x) + cos * (scaleY * drag.anchorLocal.y),
  };

  shape.transform.rotation = drag.rotation;
  shape.transform.scaleX = scaleX;
  shape.transform.scaleY = scaleY;
  shape.transform.x = drag.anchorDevice.x - anchorAfterRotateScale.x;
  shape.transform.y = drag.anchorDevice.y - anchorAfterRotateScale.y;
}

export default function CanvasScene({
  shapes,
  selectedId,
  tool,
  lineAlgorithm,
  onShapesChange,
  onSelect,
  onToolChange,
}: CanvasSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const shapesRef = useRef(shapes);
  const selectedIdRef = useRef(selectedId);

  shapesRef.current = shapes;
  selectedIdRef.current = selectedId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new RasterRenderer(canvas);
    rendererRef.current = renderer;

    const resizeObserver = new ResizeObserver(() => {
      renderer.resizeToDisplaySize();
      render();
    });
    resizeObserver.observe(canvas);

    function render() {
      renderer.lineAlgorithm = lineAlgorithm;
      renderer.resizeToDisplaySize();
      renderer.clear("#0f172a");
      const gridColor = "#1e293b";
      const step = Math.round(40 * renderer.dpr);
      for (let x = 0; x < renderer.width; x += step) {
        renderer.drawLine({ x, y: 0 }, { x, y: renderer.height }, gridColor, 0.5, 1);
      }
      for (let y = 0; y < renderer.height; y += step) {
        renderer.drawLine({ x: 0, y }, { x: renderer.width, y }, gridColor, 0.5, 1);
      }
      for (const shape of shapesRef.current) shape.drawRaster(renderer);
      const selected = findShape(shapesRef.current, selectedIdRef.current);
      if (selected) drawSelection(renderer, selected);
      renderer.present();
    }

    render();
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.lineAlgorithm = lineAlgorithm;
    renderer.resizeToDisplaySize();
    renderer.clear("#0f172a");
    const step = Math.round(40 * renderer.dpr);
    for (let x = 0; x < renderer.width; x += step) {
      renderer.drawLine({ x, y: 0 }, { x, y: renderer.height }, "#1e293b", 0.5, 1);
    }
    for (let y = 0; y < renderer.height; y += step) {
      renderer.drawLine({ x: 0, y }, { x: renderer.width, y }, "#1e293b", 0.5, 1);
    }
    for (const shape of shapes) shape.drawRaster(renderer);
    const selected = findShape(shapes, selectedId);
    if (selected) drawSelection(renderer, selected);
    renderer.present();
  }, [shapes, selectedId, lineAlgorithm]);

  function emit(next = shapesRef.current) {
    onShapesChange([...next]);
  }

  function handlePointerDown(ev: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(ev.pointerId);
    const p = canvasPoint(canvas, ev);

    if (tool !== "select") {
      const nextShape = shapeAt(tool, p);
      if (nextShape) {
        const next = [...shapesRef.current, nextShape];
        onShapesChange(next);
        onSelect(nextShape.id);
        onToolChange("select");
      }
      return;
    }

    const selected = findShape(shapesRef.current, selectedIdRef.current);
    if (selected) {
      const handle = hitHandle(selected, p, 12 * (rendererRef.current?.dpr ?? 1));
      if (handle?.kind === "control") {
        dragRef.current = { mode: "control", id: selected.id, index: handle.index };
        return;
      }
      if (handle?.kind === "rotate") {
        const center = shapeLocalBoundsCenterDevice(selected);
        dragRef.current = {
          mode: "rotate",
          id: selected.id,
          center,
          startAngle: Math.atan2(p.y - center.y, p.x - center.x),
          startRotation: selected.transform.rotation,
        };
        return;
      }
      if (handle?.kind === "resize") {
        const localBounds = effectiveLocalBounds(selected);
        const opposite = oppositeResizeHandle(handle.handle);
        const anchorLocal = localPointForResizeHandle(localBounds, opposite);
        const draggedLocal = localPointForResizeHandle(localBounds, handle.handle);
        dragRef.current = {
          mode: "resize",
          id: selected.id,
          handle: handle.handle,
          anchorDevice: selected.transformPointToDevice(anchorLocal.x, anchorLocal.y),
          anchorLocal,
          draggedLocal,
          rotation: selected.transform.rotation,
        };
        return;
      }
    }

    for (let i = shapesRef.current.length - 1; i >= 0; i -= 1) {
      const shape = shapesRef.current[i];
      if (shape.hitTest(p.x, p.y)) {
        onSelect(shape.id);
        dragRef.current = {
          mode: "move",
          id: shape.id,
          startPointer: p,
          startTransform: { ...shape.transform },
        };
        return;
      }
    }

    onSelect(null);
    dragRef.current = null;
  }

  function handlePointerMove(ev: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const p = canvasPoint(canvas, ev);
    const shape = findShape(shapesRef.current, drag.id);
    if (!shape) return;

    if (drag.mode === "move") {
      shape.transform.x = drag.startTransform.x + (p.x - drag.startPointer.x);
      shape.transform.y = drag.startTransform.y + (p.y - drag.startPointer.y);
    }

    if (drag.mode === "rotate") {
      const angle = Math.atan2(p.y - drag.center.y, p.x - drag.center.x);
      shape.transform.rotation = drag.startRotation + angle - drag.startAngle;
    }

    if (drag.mode === "resize") {
      const minSize = 12 * (rendererRef.current?.dpr ?? 1);
      applyResizeWithFixedAnchor(shape, drag, p, minSize);
    }

    if (drag.mode === "control") {
      updateControlPoint(shape, drag.index, p);
    }

    emit();
  }

  function handlePointerUp(ev: React.PointerEvent<HTMLCanvasElement>) {
    canvasRef.current?.releasePointerCapture(ev.pointerId);
    dragRef.current = null;
  }

  return (
    <div className="relative h-full min-h-0 flex-1 overflow-hidden bg-slate-900">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-slate-700 bg-slate-950/75 px-3 py-2 text-xs text-slate-400 shadow-lg">
        Инструмент: <span className="text-slate-100">{tool}</span>. Клик по холсту создаёт фигуру, клик по фигуре выделяет её.
      </div>
    </div>
  );
}
