import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { EditorProjectJSON, ProjectIndexItem } from "./editor/editorTypes";

const PROJECT_DIR = "VectorEngine/projects";
const INDEX_PATH = `${PROJECT_DIR}/index.json`;
const LOCAL_INDEX_KEY = "vectorengine:index";

function projectPath(id: string): string {
  return `${PROJECT_DIR}/${id}.json`;
}

function canUseTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function ensureProjectDir(): Promise<void> {
  if (!canUseTauri()) return;
  if (!(await exists(PROJECT_DIR, { baseDir: BaseDirectory.Document }))) {
    await mkdir(PROJECT_DIR, { baseDir: BaseDirectory.Document, recursive: true });
  }
}

function loadLocalIndex(): ProjectIndexItem[] {
  const raw = localStorage.getItem(LOCAL_INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ProjectIndexItem[];
  } catch {
    return [];
  }
}

function saveLocalIndex(items: ProjectIndexItem[]): void {
  localStorage.setItem(LOCAL_INDEX_KEY, JSON.stringify(items));
}

async function upsertIndexItem(project: EditorProjectJSON): Promise<void> {
  const item: ProjectIndexItem = {
    id: project.id,
    title: project.title,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
  const index = await loadProjectIndex();
  const next = [item, ...index.filter((p) => p.id !== project.id)]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  if (canUseTauri()) {
    await ensureProjectDir();
    await writeTextFile(INDEX_PATH, JSON.stringify(next, null, 2), { baseDir: BaseDirectory.Document });
  } else {
    saveLocalIndex(next);
  }
}

export async function saveProject(project: EditorProjectJSON): Promise<void> {
  const json = JSON.stringify(project, null, 2);
  if (canUseTauri()) {
    await ensureProjectDir();
    await writeTextFile(projectPath(project.id), json, { baseDir: BaseDirectory.Document });
  } else {
    localStorage.setItem(`vectorengine:project:${project.id}`, json);
  }
  await upsertIndexItem(project);
}

export async function loadProject(id: string): Promise<EditorProjectJSON | null> {
  if (canUseTauri()) {
    await ensureProjectDir();
    const path = projectPath(id);
    if (!(await exists(path, { baseDir: BaseDirectory.Document }))) return null;
    const raw = await readTextFile(path, { baseDir: BaseDirectory.Document });
    return JSON.parse(raw) as EditorProjectJSON;
  }

  const raw = localStorage.getItem(`vectorengine:project:${id}`);
  return raw ? JSON.parse(raw) as EditorProjectJSON : null;
}

export async function loadProjectIndex(): Promise<ProjectIndexItem[]> {
  if (canUseTauri()) {
    try {
      await ensureProjectDir();
      if (!(await exists(INDEX_PATH, { baseDir: BaseDirectory.Document }))) return [];
      return JSON.parse(await readTextFile(INDEX_PATH, { baseDir: BaseDirectory.Document })) as ProjectIndexItem[];
    } catch {
      return [];
    }
  }
  return loadLocalIndex();
}

export function newProjectId(): string {
  return `project_${Date.now().toString(36)}`;
}
