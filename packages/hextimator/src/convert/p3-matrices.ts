/**
 * Precomputed matrices for converting between linear sRGB and linear Display P3.
 *
 * Derived from the CSS Color Level 4 specification:
 *   LINEAR_SRGB_TO_P3 = inv(P3_to_XYZ) × sRGB_to_XYZ
 *   LINEAR_P3_TO_SRGB = inv(sRGB_to_XYZ) × P3_to_XYZ
 */

/** Linear sRGB → Linear Display P3 */
export const LINEAR_SRGB_TO_P3 = [
	[0.8224619688, 0.1775380313, 0.0],
	[0.0331941989, 0.9668058012, 0.0],
	[0.0170826307, 0.0723974407, 0.9105199286],
] as const;

/** Linear Display P3 → Linear sRGB */
export const LINEAR_P3_TO_SRGB = [
	[1.2249401762, -0.2249401763, 0.0],
	[-0.0420569547, 1.0420569547, 0.0],
	[-0.0196375546, -0.0786360456, 1.0982736002],
] as const;
