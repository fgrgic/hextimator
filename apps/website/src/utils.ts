/**
 * Generates a random hex color string (without the # prefix).
 *
 * @param previousColor optionally ensure that the next generated color is not too similar to the previous
 * @returns a random hex color string (without the # prefix)
 */
export const generateRandomColor = (previousColor?: string) => {
  const letters = '0123456789abcdef';
  let color = '';

  // Ensure the new color is different ENOUGH from the previous one
  do {
    color = '';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
  } while (color === previousColor || isTooSimilar(color, previousColor));

  return color;
};

/** Checks if two colors are too similar.
 *
 * The colors are too similar if have the same dominant color (e.g. both are mostly red)
 */
function isTooSimilar(color1: string, color2?: string) {
  if (!color2) return false;

  const r1 = parseInt(color1.slice(0, 2), 16);
  const g1 = parseInt(color1.slice(2, 4), 16);
  const b1 = parseInt(color1.slice(4, 6), 16);

  const r2 = parseInt(color2?.slice(0, 2), 16);
  const g2 = parseInt(color2?.slice(2, 4), 16);
  const b2 = parseInt(color2?.slice(4, 6), 16);

  const max1 = Math.max(r1, g1, b1);
  const max2 = Math.max(r2, g2, b2);

  if (max1 === r1 && max2 === r2) return true;
  if (max1 === g1 && max2 === g2) return true;
  if (max1 === b1 && max2 === b2) return true;

  return false;
}
