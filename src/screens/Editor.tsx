// src/screens/Editor.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import CanvasScene from "../components/CanvasScene";
import Toolbar from "../components/Toolbar";
import LayersPanel from "../components/LayersPanel";
import InspectorPanel from "../components/InspectorPanel";
import type { EditorProjectJSON, EditorTool } from "../lib/editor/editorTypes";
import type { LineAlgorithm } from "../lib/renderer/RasterRenderer";
import type { Shape } from "../lib/shapes/Shape";
import { shapeFromJSON } from "../lib/shapes/shapeFromJSON";
import { newProjectId, loadProject, saveProject } from "../lib/projectStorage";
import { Rect, Line, Oval, Triangle, QuadraticBezier, CubicBezier, PathBezier } from "../lib/shapes";

export default function Editor() {
  const params = useParams();
  const routeId = params.id ?? "new";
  const [projectId, setProjectId] = useState(routeId === "new" ? newProjectId() : routeId);
  const [title, setTitle] = useState("Новый проект");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString());
  const [shapes, setShapes] = useState<Shape[]>(() => {
    if (routeId === "new") {
      return [
        // Прямоугольник
        (() => {
          const rect = new Rect(120, 80);
          rect.transform.x = 150;
          rect.transform.y = 150;
          rect.fillStyle = "#ef4444";
          return rect;
        })(),
        // Овал
        (() => {
          const oval = new Oval(70, 50);
          oval.transform.x = 350;
          oval.transform.y = 150;
          oval.fillStyle = "#3b82f6";
          return oval;
        })(),
        // Треугольник
        (() => {
          const triangle = new Triangle();
          triangle.transform.x = 600;
          triangle.transform.y = 150;
          triangle.fillStyle = "#22c55e";
          return triangle;
        })(),
        // Линия
        (() => {
          const line = new Line({ x: -60, y: 0 }, { x: 60, y: 0 });
          line.transform.x = 150;
          line.transform.y = 350;
          line.strokeStyle = "#f97316";
          line.strokeWidth = 4;
          return line;
        })(),
        // Квадратичная Безье
        (() => {
          const quad = new QuadraticBezier();
          quad.transform.x = 400;
          quad.transform.y = 350;
          quad.strokeStyle = "#facc15";
          return quad;
        })(),
        // Кубическая Безье
        (() => {
          const cubic = new CubicBezier();
          cubic.transform.x = 650;
          cubic.transform.y = 350;
          cubic.strokeStyle = "#fb7185";
          return cubic;
        })(),
        (() => {
          const path = new PathBezier([
            { x: -80, y: -40 },
            { x: -40, y: 30 },
            { x: 40, y: -30 },
            { x: 60, y: -20 },
            { x: -80, y: -40 },
            { x: -40, y: 30 },
            { x: 40, y: -30 },
            { x: 60, y: -20 },
            { x: 80, y: 40 }
          ]);
          path.transform.x = 400;
          path.transform.y = 550;
          path.strokeStyle = "#2dd4bf";
          path.strokeWidth = 4;
          path.fillOpacity = 0;
          path.closed = true;      
          path.mode = "catmullRom";    
          return path;
        })(),
      ];
    }
    return [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<EditorTool>("select");
  const [lineAlgorithm, setLineAlgorithm] = useState<LineAlgorithm>("bresenham");
  const [status, setStatus] = useState("Готово");

  useEffect(() => {
    let alive = true;
    async function run() {
      if (routeId === "new") return;
      const loaded = await loadProject(routeId);
      if (!alive || !loaded) return;
      setProjectId(loaded.id);
      setTitle(loaded.title);
      setCreatedAt(loaded.createdAt);
      setLineAlgorithm(loaded.lineAlgorithm ?? "bresenham");
      setShapes((loaded.shapes as any[]).map((item) => shapeFromJSON(item)));
      setStatus("Проект загружен");
    }
    run().catch(() => setStatus("Не удалось загрузить проект"));
    return () => { alive = false; };
  }, [routeId]);

  const selectedShape = useMemo(() => shapes.find((shape) => shape.id === selectedId) ?? null, [shapes, selectedId]);

  function deleteSelected() {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((shape) => shape.id !== selectedId));
    setSelectedId(null);
  }

  function moveLayer(direction: "up" | "down") {
    if (!selectedId) return;
    setShapes((prev) => {
      const index = prev.findIndex((shape) => shape.id === selectedId);
      if (index < 0) return prev;
      const next = [...prev];
      const target = direction === "up" ? index + 1 : index - 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    const now = new Date().toISOString();
    const project: EditorProjectJSON = {
      id: projectId,
      title,
      createdAt,
      updatedAt: now,
      lineAlgorithm,
      shapes: shapes.map((shape) => shape.toJSON()),
    };
    await saveProject(project);
    setStatus(`Сохранено: ${new Date(now).toLocaleTimeString("ru-RU")}`);
  }

  return (
    <section className="flex h-[calc(100vh-64px)] min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <input
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          className="w-72 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
        <div className="text-sm text-slate-500">id: {projectId}</div>
        <div className="ml-auto text-sm text-slate-400">{status}</div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Toolbar
          tool={tool}
          lineAlgorithm={lineAlgorithm}
          onToolChange={setTool}
          onLineAlgorithmChange={setLineAlgorithm}
          onSave={() => { void handleSave(); }}
          onDelete={deleteSelected}
          onLayerUp={() => moveLayer("up")}
          onLayerDown={() => moveLayer("down")}
        />

        <CanvasScene
          shapes={shapes}
          selectedId={selectedId}
          tool={tool}
          lineAlgorithm={lineAlgorithm}
          onShapesChange={setShapes}
          onSelect={setSelectedId}
          onToolChange={setTool}
        />

        <div className="flex w-72 shrink-0 flex-col border-l border-slate-800">
          <LayersPanel shapes={shapes} selectedId={selectedId} onSelect={setSelectedId} />
          <div className="border-t border-slate-800 bg-slate-950/80 p-3">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Параметры</h2>
            <InspectorPanel shape={selectedShape} />
          </div>
        </div>
      </div>
    </section>
  );
}