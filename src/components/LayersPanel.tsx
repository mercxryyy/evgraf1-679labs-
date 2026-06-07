import type { Shape } from "../lib/shapes/Shape";

interface LayersPanelProps {
  shapes: Shape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function LayersPanel({ shapes, selectedId, onSelect }: LayersPanelProps) {
  const ordered = [...shapes].reverse();
  return (
    <aside className="w-72 shrink-0 border-l border-slate-800 bg-slate-950/80 p-3">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Слои</h2>
      {ordered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
          Фигур пока нет. Выберите инструмент слева и кликните по холсту.
        </div>
      ) : (
        <div className="space-y-2">
          {ordered.map((shape, index) => (
            <button
              key={shape.id}
              onClick={() => onSelect(shape.id)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selectedId === shape.id
                  ? "border-blue-500 bg-blue-950/70"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{shape.name}</span>
                <span className="text-xs text-slate-500">#{ordered.length - index}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">{shape.type}</div>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
