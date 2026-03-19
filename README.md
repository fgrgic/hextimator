# hextimator

Generate perceptually uniform color palettes from any input color. Throw in a hex code (or RGB, HSL, OKLCH…) and get a full theme — accent scales, base tones, and semantic colors (positive/negative/warning) — all with consistent perceived contrast across hues.

Built for runtime use: output CSS custom properties, Tailwind tokens, SCSS variables, or plain objects. Ideal for products where each account/tenant needs its own branded theme generated on the fly.

## Installation

```bash
npm install hextimator
```

## Quick start

```typescript
import { hextimate } from "hextimator";

// Pass any color — hex string, RGB tuple, CSS function, numeric hex…
const palette = hextimate("#6A5ACD");

// palette.light / palette.dark each contain your full theme tokens
console.log(palette.light);
// { "accent": "#6A5ACD", "accent-strong": "...", "base": "...", ... }
```

### Output formats

```typescript
// CSS custom properties
hextimate("#6A5ACD", { format: "css" });
// → { "--accent": "#6A5ACD", "--accent-strong": "...", ... }

// Tailwind nested tokens
hextimate("#6A5ACD", { format: "tailwind" });
// → { accent: { DEFAULT: "#6A5ACD", strong: "...", ... }, ... }

// SCSS variables
hextimate("#6A5ACD", { format: "scss" });

// Choose color value format
hextimate("#6A5ACD", { format: "css", colorFormat: "oklch" });
// → { "--accent": "oklch(0.54 0.18 276)", ... }
```

### Flexible input

```typescript
hextimate("#FF6666");           // hex string
hextimate("rgb(255, 102, 102)"); // CSS function
hextimate([255, 102, 102]);     // RGB tuple
hextimate(0xFF6666);            // numeric hex
```

### Customization

```typescript
hextimate("#6A5ACD", {
  // Override base surface colors (background)
  preferredBaseColors: { dark: "#111111", light: "#FEFEFE" },
  // Rename token roles
  roleNames: { accent: "brand", base: "surface" },
  // Custom semantic overrides
  semanticColors: { positive: "#22C55E" },
  // Adjust perceived lightness (0–1)
  themeLightness: 0.65,
});
```

## How it works

1. **Parse** any color input into a normalized `Color` object.
2. **Convert** to OKLCH (perceptual color space) so lightness and chroma adjustments look uniform across hues.
3. **Generate** accent, base, and semantic color scales — each with DEFAULT, strong, weak, and foreground variants.
4. **Gamut-map** back to sRGB via binary-search chroma reduction (preserves lightness and hue).
5. **Format** into your chosen output (CSS vars, Tailwind, SCSS, JSON, or plain object).

## Dev workflow

In one terminal, watch-build the package:

```bash
cd packages/hextimator && bun run dev
```

In another, start the playground:

```bash
cd apps/playground && bun run dev
```

> The playground imports from `dist/`, so keep the package's `bun run dev` running to auto-rebuild on changes.

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).

## License

ISC © [fgrgic](https://github.com/fgrgic)
