import type { ReactNode } from "react";
import { MousePointer2, Square, Slash, Circle, Triangle as TriangleIcon, PenTool, Save, Trash2, ChevronsUp, ChevronsDown } from "lucide-react";
import type { EditorTool } from "../lib/editor/editorTypes";
import type { LineAlgorithm } from "../lib/renderer/RasterRenderer";

interface ToolbarProps {
  tool: EditorTool;
  lineAlgorithm: LineAlgorithm;
  onToolChange: (tool: EditorTool) => void;
  onLineAlgorithmChange: (algorithm: LineAlgorithm) => void;
  onSave: () => void;
  onDelete: () => void;
  onLayerUp: () => void;
  onLayerDown: () => void;
}

const toolItems: Array<{ tool: EditorTool; title: string; icon: ReactNode }> = [
  { tool: "select", title: "Выбор", icon: <MousePointer2 size={18} /> },
  { tool: "rect", title: "Прямоугольник", icon: <Square size={18} /> },
  { tool: "line", title: "Линия", icon: <Slash size={18} /> },
  { tool: "oval", title: "Овал", icon: <Circle size={18} /> },
  { tool: "triangle", title: "Треугольник", icon: <TriangleIcon size={18} /> },
  { tool: "quadraticBezier", title: "Квадратичная Безье", icon: <PenTool size={18} /> },
  { tool: "cubicBezier", title: "Кубическая Безье", icon: <PenTool size={18} /> },
  { tool: "pathBezier", title: "Path / Catmull-Rom", icon: <PenTool size={18} /> },
];

export default function Toolbar({
  tool,
  lineAlgorithm,
  onToolChange,
  onLineAlgorithmChange,
  onSave,
  onDelete,
  onLayerUp,
  onLayerDown,
}: ToolbarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-3 border-r border-slate-800 bg-slate-950/80 p-3">
      <div>
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Инструменты</div>
        <div className="grid grid-cols-2 gap-2">
          {toolItems.map((item) => (
            <button
              key={item.tool}
              title={item.title}
              onClick={() => onToolChange(item.tool)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                tool === item.tool
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              {item.icon}
              <span className="truncate">{item.title.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Алгоритм линий</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onLineAlgorithmChange("bresenham")}
            className={`rounded-lg px-3 py-2 text-sm ${lineAlgorithm === "bresenham" ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700"}`}
          >
            Bresenham
          </button>
          <button
            onClick={() => onLineAlgorithmChange("wu")}
            className={`rounded-lg px-3 py-2 text-sm ${lineAlgorithm === "wu" ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700"}`}
          >
            Wu
          </button>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <button onClick={onLayerUp} className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">
          <ChevronsUp size={16} /> Выше
        </button>
        <button onClick={onLayerDown} className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">
          <ChevronsDown size={16} /> Ниже
        </button>
        <button onClick={onDelete} className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm hover:bg-rose-500">
          <Trash2 size={16} /> Удалить
        </button>
        <button onClick={onSave} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500">
          <Save size={16} /> Сохранить
        </button>
      </div>
    </aside>
  );
}
