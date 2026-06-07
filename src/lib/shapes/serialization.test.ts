import { describe, expect, it } from "vitest";
import { Rect } from "./Rect";
import { Line } from "./Line";
import { Oval } from "./Oval";
import { Triangle } from "./Triangle";
import { QuadraticBezier } from "./QuadraticBezier";
import { CubicBezier } from "./CubicBezier";
import { PathBezier } from "./PathBezier";
import { shapeFromJSON } from "./shapeFromJSON";
import type { Shape } from "./Shape";

function decorate(shape: Shape): Shape {
  shape.id = `${shape.type}_test_id`;
  shape.name = `${shape.type} name`;
  shape.transform = { x: 10, y: 20, rotation: 0.3, scaleX: 1.4, scaleY: -0.8 };
  shape.fillStyle = "#123456";
  shape.fillOpacity = 0.25;
  shape.strokeStyle = "#abcdef";
  shape.strokeWidth = 5;
  shape.strokeOpacity = 0.75;
  return shape;
}

describe("shape serialization", () => {
  const shapes = [
    decorate(new Rect(120, 80)),
    decorate(new Line({ x: -30, y: 5 }, { x: 70, y: -10 })),
    decorate(new Oval(50, 25)),
    decorate(new Triangle([{ x: 0, y: -40 }, { x: 50, y: 40 }, { x: -45, y: 35 }])),
    decorate(new QuadraticBezier({ x: -30, y: 0 }, { x: 0, y: -40 }, { x: 30, y: 0 })),
    decorate(new CubicBezier({ x: -50, y: 0 }, { x: -25, y: -40 }, { x: 25, y: 40 }, { x: 50, y: 0 })),
    decorate(new PathBezier([{ x: -50, y: 0 }, { x: -10, y: -30 }, { x: 25, y: 15 }, { x: 60, y: -10 }])),
  ];

  it.each(shapes)("restores %s from JSON", (shape) => {
    const restored = shapeFromJSON(shape.toJSON());

    expect(restored.type).toBe(shape.type);
    expect(restored.id).toBe(shape.id);
    expect(restored.name).toBe(shape.name);
    expect(restored.transform).toEqual(shape.transform);
    expect(restored.fillStyle).toBe(shape.fillStyle);
    expect(restored.fillOpacity).toBe(shape.fillOpacity);
    expect(restored.strokeStyle).toBe(shape.strokeStyle);
    expect(restored.strokeWidth).toBe(shape.strokeWidth);
    expect(restored.strokeOpacity).toBe(shape.strokeOpacity);
    expect(restored.toJSON()).toEqual(shape.toJSON());
  });

  it("throws for unknown shape type", () => {
    expect(() => shapeFromJSON({ type: "bad-type" } as any)).toThrow("Unknown shape type");
  });

  it("clone creates a separate object with the same JSON", () => {
    const rect = decorate(new Rect(90, 40));
    const clone = rect.clone();

    expect(clone).not.toBe(rect);
    expect(clone.toJSON()).toEqual(rect.toJSON());

    clone.transform.x += 100;
    expect(clone.transform.x).not.toBe(rect.transform.x);
  });
});
