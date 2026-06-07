import type { Point2D } from "./point";

export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

export const Mat3Identity: Mat3 = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];

export function identity(): Mat3 {
  return [...Mat3Identity] as Mat3;
}

export function translation(tx: number, ty: number): Mat3 {
  return [
    1, 0, tx,
    0, 1, ty,
    0, 0, 1,
  ];
}

export function scaling(sx: number, sy: number): Mat3 {
  return [
    sx, 0, 0,
    0, sy, 0,
    0, 0, 1,
  ];
}

export function rotation(angleRad: number): Mat3 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return [
    c, -s, 0,
    s, c, 0,
    0, 0, 1,
  ];
}

export function multiply(a: Mat3, b: Mat3): Mat3 {
  const out = new Array(9).fill(0) as Mat3;
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      out[r * 3 + c] =
        a[r * 3 + 0] * b[0 * 3 + c] +
        a[r * 3 + 1] * b[1 * 3 + c] +
        a[r * 3 + 2] * b[2 * 3 + c];
    }
  }
  return out;
}

export function composeTransform(x: number, y: number, rotationRad: number, scaleX: number, scaleY: number): Mat3 {
  return multiply(translation(x, y), multiply(rotation(rotationRad), scaling(scaleX, scaleY)));
}

export function transformPoint(m: Mat3, x: number, y: number): Point2D {
  return {
    x: m[0] * x + m[1] * y + m[2],
    y: m[3] * x + m[4] * y + m[5],
  };
}

export function inverse(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;
  const det = a * A + b * B + c * C;

  if (Math.abs(det) < 1e-10) {
    return identity();
  }

  const invDet = 1 / det;
  return [
    A * invDet, D * invDet, G * invDet,
    B * invDet, E * invDet, H * invDet,
    C * invDet, F * invDet, I * invDet,
  ];
}

export function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

export function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}
