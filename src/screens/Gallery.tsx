import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, FolderOpen } from "lucide-react";
import { loadProjectIndex } from "../lib/projectStorage";
import type { ProjectIndexItem } from "../lib/editor/editorTypes";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
}

export default function Gallery() {
  const [projects, setProjects] = useState<ProjectIndexItem[]>([]);

  useEffect(() => {
    loadProjectIndex().then(setProjects).catch(() => setProjects([]));
  }, []);

  return (
    <section className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Галерея проектов</h1>
          <p className="mt-2 text-slate-400">Сохранённые JSON-проекты векторного редактора.</p>
        </div>
        <Link to="/editor/new" className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-500">
          <FilePlus2 size={20} /> Новый проект
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center">
          <FolderOpen className="mx-auto mb-4 text-slate-500" size={48} />
          <h2 className="text-xl font-semibold text-slate-200">Сохранённых проектов пока нет</h2>
          <p className="mt-2 text-slate-500">Создайте проект в редакторе и нажмите «Сохранить».</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/editor/${project.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-blue-500 hover:bg-slate-900">
              <div className="mb-3 h-32 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950" />
              <h2 className="truncate text-lg font-semibold text-slate-100">{project.title}</h2>
              <p className="mt-1 text-sm text-slate-500">Изменён: {formatDate(project.updatedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
