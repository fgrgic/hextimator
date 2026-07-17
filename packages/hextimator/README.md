# hextimator

<p align="center">
    <img src="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/assets/gh-cover.webp?raw=true" alt="hextimator" width="100%">
</p>
<p>
  <a href="https://www.npmjs.com/package/hextimator"><img src="https://img.shields.io/npm/v/hextimator" alt="npm version"></a>
  <a href="https://github.com/fgrgic/hextimator/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/fgrgic/hextimator/test.yml?branch=main" alt="CI status"></a>
  <a href="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/LICENSE.md"><img src="https://img.shields.io/npm/l/hextimator" alt="license"></a>
  <a href="https://bundlejs.com/?q=hextimator&treeshake=[{hextimate}]"><img src="https://img.shields.io/bundlejs/size/hextimator" alt="bundle size"></a>
</p>

Runtime theming for multi-tenant apps.

Your customers pick a brand color. Your app looks good every time. No per-customer design reviews. No manual tuning. Yellow does not break your UI.

Each call takes under a millisecond (~0.4ms [^perf]). Same color and options always produce the same tokens. Run it on the request path. Cache it if you want.

~12 kB min+gzip. Zero dependencies.

Try it: **[hextimator.com](https://hextimator.com)**

## Why `hextimator` exists

<p align="center">
  <video src="https://github.com/user-attachments/assets/245f0728-38e3-425a-8d0c-87bff6f48b0f" width="100%" controls playsinline></video>
</p>

You ship a B2B, B2B2C, or white-label app. Every tenant brings a brand color. Your choices today:

- **Let them pick any hex.** Legal-pad yellow buttons become unreadable. Cheeto tangerine toasts look like your warning state.
- **Curate a palette.** You tell a paying customer their brand color is not allowed.

hextimator is the third option. **One color in, whole theme out.** Light and dark. Semantic roles and surfaces. Foregrounds meet WCAG contrast by default (AAA unless you opt down). Even yellow.

## How it compares

hextimator is not the first palette generator. It targets one job the others skip: arbitrary brand colors at runtime.

- **[Adobe Leonardo](https://leonardocolor.io)** Runtime contrast scales from arbitrary hex (`Theme` → `contrastColors`, target ratios). A construction kit: you wire roles, surfaces, and dark mode yourself. hextimator is one call with those built in.
- **[Material dynamic color](https://github.com/material-foundation/material-color-utilities)** Full theming from one seed color. Battle-tested on Android. Output follows Material's token scheme. Hard to use outside Material-shaped UIs.
- **[Radix Colors](https://www.radix-ui.com/colors)** Hand-tuned scales with strong semantics. Fixed curated set. Does not generate themes from arbitrary input.
- **[tints.dev](https://tints.dev) / [uicolors.app](https://uicolors.app)** Quick Tailwind shade scales from one color. Build-time only. No semantic roles, contrast guarantees, dark theme, or library API.
- **[culori](https://culorijs.org) / [chroma.js](https://gka.github.io/chroma.js/)** Color math and conversions. You build a generator with these. They are not generators.

Hand-crafting one brand's design system? Several of these beat hextimator. Color comes from user input (tenants, white-label customers, CMS authors)? That is hextimator's job.

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

`hextimate` turns one color into a theme. You choose how to ship it: inline `<style>`, a `.css` file, a template partial, an edge cache, or something else. For tokens instead of a stylesheet, use `format({ as: 'object' })`.

No DOM. Pure computation. Works with SSR.

### React (SSR-safe)

```tsx
import { HextimatorStyle } from "hextimator/react";

<HextimatorStyle color={"#0FF1CE"} />;
```

Put it in your layout `<head>`. Server render writes a `<style>` node. No `useEffect`. No FOUC when you pair it with static HTML. API and dark mode: [React](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md).

### CLI (and AI agents)

Same engine as the library. Flags for presets and format.

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

Plus **`brand-exact`** (your input color, unchanged) and **`brand-exact-foreground`**.

## Customization and reference

- [Customization](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/customization.md): style and format options
- [Extending the palette](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/extending-the-palette.md): `addRole`, `addVariant`, `addToken`
- [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md): shadcn/ui configs and custom presets
- [Multiple themes](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/multiple-themes.md): dynamic theming and `.fork()`
- [React](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md): hook, `HextimatorStyle`, provider, scoped themes, dark mode
- [Tailwind CSS v4](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/tailwind.md): setup and usage

### Also

- [Color vision deficiency](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/color-vision-deficiency.md)
- [Examples](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/examples.md)
- [Migration](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md)

## Contrast methodology

WCAG 2.x contrast ratios. AAA by default. Opt down with `minContrastRatio`. Audits and compliance tooling still measure this way.

APCA is the perceptual model in draft WCAG 3. Better for a lot of UI. Not what pass/fail checks ask for yet. Optional support is planned when WCAG 3 settles.

## Stability

The API follows strict semver. Builder methods, options, formats, CLI flags, and token names only break in majors, with notes in migration.md.

Generated color values are a separate contract. Output is fully deterministic: same version, same color, same options, same tokens. The algorithm itself may improve in minors (wider hue ranges, better anchors), which changes the exact values a theme produces. Every such change is flagged in the changelog with how to opt back into the old behavior.

In practice:

- Pin an exact version if you cache or snapshot generated output.
- Patches only change generated values to fix bugs.
- Contrast guarantees hold across all releases. Whatever changes, foregrounds meet your configured minimum against their backgrounds.

## Contributing

Open issues and PRs at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).

[^perf]: Measured on Apple Silicon M2 Max with Bun. Ballpark only. Your hardware and runtime will differ.
