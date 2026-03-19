import type { OKLab, OKLCH } from '../types';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

/** OKLab → OKLCH (cartesian → polar). */
export function oklabToOklch(color: OKLab): OKLCH {
	const c = Math.sqrt(color.a * color.a + color.b * color.b);
	let h = Math.atan2(color.b, color.a) * RAD_TO_DEG;
	if (h < 0) h += 360;

	return { space: 'oklch', l: color.l, c, h, alpha: color.alpha };
}

/** OKLCH → OKLab (polar → cartesian). */
export function oklchToOklab(color: OKLCH): OKLab {
	const hRad = color.h * DEG_TO_RAD;
	return {
		space: 'oklab',
		l: color.l,
		a: color.c * Math.cos(hRad),
		b: color.c * Math.sin(hRad),
		alpha: color.alpha,
	};
}
