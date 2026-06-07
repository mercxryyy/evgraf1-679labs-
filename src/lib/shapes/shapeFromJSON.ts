import type { Shape, ShapeJSON } from "./Shape";
import { Rect } from "./Rect";
import type { RectJSON } from "./Rect";
import { Line } from "./Line";
import type { LineJSON } from "./Line";
import { Oval } from "./Oval";
import type { OvalJSON } from "./Oval";
import { Triangle } from "./Triangle";
import type { TriangleJSON } from "./Triangle";
import { QuadraticBezier } from "./QuadraticBezier";
import type { QuadraticBezierJSON } from "./QuadraticBezier";
import { CubicBezier } from "./CubicBezier";
import type { CubicBezierJSON } from "./CubicBezier";
import { PathBezier } from "./PathBezier";
import type { PathBezierJSON } from "./PathBezier";

export type AnyShapeJSON = RectJSON | LineJSON | OvalJSON | TriangleJSON | QuadraticBezierJSON | CubicBezierJSON | PathBezierJSON;

export function shapeFromJSON(json: ShapeJSON): Shape {
  switch (json.type) {
    case "rect": return Rect.fromJSON(json as RectJSON);
    case "line": return Line.fromJSON(json as LineJSON);
    case "oval": return Oval.fromJSON(json as OvalJSON);
    case "triangle": return Triangle.fromJSON(json as TriangleJSON);
    case "quadraticBezier": return QuadraticBezier.fromJSON(json as QuadraticBezierJSON);
    case "cubicBezier": return CubicBezier.fromJSON(json as CubicBezierJSON);
    case "pathBezier": return PathBezier.fromJSON(json as PathBezierJSON);
    default: throw new Error(`Unknown shape type: ${(json as ShapeJSON).type}`);
  }
}
