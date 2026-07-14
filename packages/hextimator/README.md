# hextimator

<p align="center">
    <picture>
        <img src="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/assets/gh-cover.webp?raw=true" alt="hextimator" width="500">
    </picture>
</p>

Per-tenant themes from a single brand color: Runtime theming for B2B2C and white-label apps.

Your customers pick a brand color. Your app looks good. Every time. No per-customer design reviews, no manual tuning, no edge cases where "that shade of yellow" breaks your UI.

Each call adds well under a millisecond (~0.4ms [^perf]) and is fully deterministic: the same color and options always produce identical tokens. Therefore, it is safe to run on the request path and trivial to cache.

Try it in the playground: **[hextimator.com](https://hextimator.com)**

## Why `hextimator` exists

You are shipping a B2B, B2B2C, or white-label app. Every tenant brings their own brand color. The options today are:

- **Let them pick any hex**. Now legal-pad yellow buttons become unreadable; cheeto tangerine toasts look identical to your warning state.
- **Curate a palette**. Now you are telling a paying customer their brand color is not allowed.

hextimator is option three. **One color in, whole theme out.** Light and dark. Semantic roles and surfaces. Foregrounds tuned against their backgrounds for WCAG contrast by default (AAA targets unless you opt down). Even for yellow.

## Installation

```bash
npm i hextimator
```

**Tailwind v4:** import `hextimator/tailwind.css` in your CSS entry (see [Tailwind](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/tailwind.md)).

## 30-second integration

```ts
import { hextimate } from "hextimator";

const css = hextimate("#C0FFEE").format({ as: "css" });
```

`hextimate` turns one color into theme output. After that you decide how it ships: inline `<style>`, a `.css` file, a template partial, an edge cache, or something else. Prefer tokens over a stylesheet: `format({ as: 'object' })`

Pure computation; no DOM. SSR-friendly by default.

### React (SSR-safe)

```tsx
import { HextimatorStyle } from "hextimator/react";

<HextimatorStyle color={"#0FF1CE"} />;
```

Place it in your layout `<head>`. It renders a `<style>` node during server render (no `useEffect`, no FOUC from missing variables when paired with static HTML). Full API and dark-mode strategies: [React](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md).

### CLI (and AI agents)

Stable entry point for tooling: same engine as the library, flags for presets and format.

```bash
npx hextimator '#BADA55' --preset shadcn    # framework-shaped tokens
npx hextimator '#BADA55' --preset muted       # style preset
npx hextimator '#BADA55' --preset vibrant
npx hextimator '#BADA55' --preset bold
```

## What is in every theme

| Role     | Variants                          |
| -------- | --------------------------------- |
| surface  | DEFAULT, strong, weak, foreground |
| accent   | DEFAULT, strong, weak, foreground |
| positive | DEFAULT, strong, weak, foreground |
| negative | DEFAULT, strong, weak, foreground |
| caution  | DEFAULT, strong, weak, foreground |

Plus **`brand-exact`** (your input color, unmodified) and **`brand-exact-foreground`**.

## Customization and reference

- [Customization](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/customization.md): style and format options reference
- [Extending the palette](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/extending-the-palette.md): `addRole`, `addVariant`, `addToken`
- [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md): drop-in configs for shadcn/ui, or create your own
- [Multiple themes](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/multiple-themes.md): dynamic theming and `.fork()`
- [React](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md): hook, `HextimatorStyle`, provider, scoped themes, dark mode
- [Tailwind CSS v4](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/tailwind.md): setup and usage with Tailwind

### Also

- [Color vision deficiency](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/color-vision-deficiency.md)
- [Examples](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/examples.md)
- [Migration](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md)

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).

[^perf]: Measured on a MacBook with Apple Silicon (M2 Max) under Bun. Treat it as a ballpark; your hardware and runtime will vary.
