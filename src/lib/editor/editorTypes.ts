import type { LineAlgorithm } from "../renderer/RasterRenderer";
import type { ShapeType } from "../shapes/Shape";

export type EditorTool = "select" | ShapeType;

export interface EditorProjectJSON {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lineAlgorithm: LineAlgorithm;
  shapes: unknown[];
}

export interface ProjectIndexItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}
// uzbek