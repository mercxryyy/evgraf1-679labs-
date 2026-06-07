import type { Shape } from "../lib/shapes/Shape";
import { radToDeg } from "../lib/math/mat3";

interface InspectorPanelProps {
  shape: Shape | null;
}

export default function InspectorPanel({ shape }: InspectorPanelProps) {
  if (!shape) {
    return <div className="text-xs text-slate-500">Выделите объект, чтобы увидеть параметры.</div>;
  }

  const b = shape.getBounds();
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
      <div className="mb-2 font-semibold text-slate-100">{shape.name}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="text-slate-500">x</span><span>{shape.transform.x.toFixed(1)}</span>
        <span className="text-slate-500">y</span><span>{shape.transform.y.toFixed(1)}</span>
        <span className="text-slate-500">rotation</span><span>{radToDeg(shape.transform.rotation).toFixed(1)}°</span>
        <span className="text-slate-500">scale</span><span>{shape.transform.scaleX.toFixed(2)} × {shape.transform.scaleY.toFixed(2)}</span>
        <span className="text-slate-500">bounds</span><span>{Math.round(b.maxX - b.minX)} × {Math.round(b.maxY - b.minY)}</span>
      </div>
    </div>
  );
}
