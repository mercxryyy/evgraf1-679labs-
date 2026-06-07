import { describe, expect, it } from "vitest";
import {
  composeTransform,
  degToRad,
  identity,
  inverse,
  multiply,
  radToDeg,
  rotation,
  scaling,
  transformPoint,
  translation,
} from "./mat3";

function expectPointCloseTo(actual: { x: number; y: number }, expected: { x: number; y: number }, digits = 6) {
  expect(actual.x).toBeCloseTo(expected.x, digits);
  expect(actual.y).toBeCloseTo(expected.y, digits);
}

describe("Mat3", () => {
  it("identity does not change point", () => {
    expectPointCloseTo(transformPoint(identity(), 12, -5), { x: 12, y: -5 });
  });

  it("translation moves point by tx and ty", () => {
    expectPointCloseTo(transformPoint(translation(10, -4), 2, 3), { x: 12, y: -1 });
  });

  it("scaling scales point independently by axes", () => {
    expectPointCloseTo(transformPoint(scaling(2, 3), 4, -5), { x: 8, y: -15 });
  });

  it("rotation by 90 degrees rotates point around local origin", () => {
    expectPointCloseTo(transformPoint(rotation(Math.PI / 2), 10, 0), { x: 0, y: 10 });
  });

  it("multiply applies transforms in the correct order", () => {
    const m = multiply(translation(10, 20), scaling(2, 3));
    expectPointCloseTo(transformPoint(m, 4, 5), { x: 18, y: 35 });
  });

  it("composeTransform applies scale, rotation, then translation", () => {
    const m = composeTransform(10, -4, Math.PI / 2, 2, 3);
    expectPointCloseTo(transformPoint(m, 1, 2), { x: 4, y: -2 });
  });

  it("inverse returns matrix that restores transformed point", () => {
    const m = composeTransform(25, -11, Math.PI / 6, 2.5, 0.75);
    const inv = inverse(m);
    const device = transformPoint(m, 9, -7);
    const local = transformPoint(inv, device.x, device.y);
    expectPointCloseTo(local, { x: 9, y: -7 });
  });

  it("degToRad and radToDeg are consistent", () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });
});
