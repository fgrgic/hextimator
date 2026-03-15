import type { LinearRGB, OKLab } from "../types";
import { M1, M2, M1_INV, M2_INV, multiplyMatrix3 } from "./matrices";

/** Linear sRGB → OKLab via LMS. */
export function linearRgbToOklab(color: LinearRGB): OKLab {
  const lms = multiplyMatrix3(M1, [color.r, color.g, color.b]);

  // Cube root (perceptual non-linearity)
  const lms_ = lms.map((v) => Math.cbrt(v)) as [number, number, number];

  const [l, a, b] = multiplyMatrix3(M2, lms_);

  return { space: "oklab", l, a, b, alpha: color.alpha };
}

/** OKLab → Linear sRGB via LMS. */
export function oklabToLinearRgb(color: OKLab): LinearRGB {
  const lms_ = multiplyMatrix3(M2_INV, [color.l, color.a, color.b]);

  // Cube (reverse the cube root)
  const lms = lms_.map((v) => v * v * v) as [number, number, number];

  const [r, g, b] = multiplyMatrix3(M1_INV, lms);

  return { space: "linear-rgb", r, g, b, alpha: color.alpha };
}
