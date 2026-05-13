# Migration guide

Breaking changes by release. Each section is a checklist; see the [CHANGELOG](../CHANGELOG.md) for release notes and PR links.

## 0.6.x → 0.7.0

0.7.0 renames `ThemeAdjustments.lightness` to **`baseLightness`** to disambiguate it from the *relative* `lightness` offset used by `addToken({ from, lightness })` and other derived-token APIs. Same word was doing two different jobs:

- `style({ light: { lightness: 0.7 } })` — **absolute** OKLCH lightness for the theme's accent.
- `addToken('x', { from: 'accent', lightness: -0.2 })` — **relative** offset from the source.

After this release:

- `style({ light: { baseLightness: 0.7 } })` — absolute, theme-level anchor.
- `addToken('x', { from: 'accent', lightness: -0.2 })` — unchanged. `lightness` always means "relative offset" now.

### Style options

| Before (0.6) | After (0.7) |
|---|---|
| `style({ light: { lightness: 0.7 } })` | `style({ light: { baseLightness: 0.7 } })` |
| `style({ dark: { lightness: 0.6 } })` | `style({ dark: { baseLightness: 0.6 } })` |

```ts
hextimate("#ff8d80").style({
  surfaceHueShift: 200,
  light: { baseLightness: 0.7, surfaceMaxChroma: 0.02 },
  dark:  { baseLightness: 0.7, surfaceMaxChroma: 0.02 },
});
```

The old `lightness` field still works in 0.7 — it forwards to `baseLightness` and emits a one-time `console.warn`. It will be removed in a future release.

### Search and replace checklist

Whole-word search inside any `style({ ... })`, `light: { ... }`, `dark: { ... }`, or preset `style: { ... }` blocks:

- `lightness:` (inside `light` / `dark` only) → `baseLightness:`

Do **not** rename `lightness:` inside `addToken`, `addRole`, `addVariant`, or any `{ from: ... }` derived-token object — those stay as relative offsets.

### CLI

CLI flags are unchanged. `--light-lightness` and `--dark-lightness` continue to work and now set `baseLightness` internally.

### React

If you read `style.light.lightness` / `style.dark.lightness` directly (e.g. inside a custom theme-preferences UI), rename to `baseLightness`. The deprecated alias is still readable on `style` objects you set yourself, but new code (and the React provider's defaults) emit `baseLightness`.

## 0.5.x → 0.6.0

0.6.0 renames the neutral/background role from **`base`** to **`surface`**. This avoids a class-name collision with Tailwind's built-in `text-base` font-size utility and makes the token name match its semantic purpose (the surface behind your content).

### Role and token names

| Before (0.5) | After (0.6) |
|---|---|
| `--base`, `--base-strong`, `--base-weak`, `--base-foreground` | `--surface`, `--surface-strong`, `--surface-weak`, `--surface-foreground` |
| `bg-base`, `text-base`, `text-base-foreground`, `border-base-weak`, … | `bg-surface`, `text-surface`, `text-surface-foreground`, `border-surface-weak`, … |
| `"base"`, `"base.weak"`, `"base.foreground"` (in `addToken` / `addVariant` / preset tokens) | `"surface"`, `"surface.weak"`, `"surface.foreground"` |

### Style options

| Before (0.5) | After (0.6) |
|---|---|
| `baseColor` | `surfaceColor` |
| `baseHueShift` | `surfaceHueShift` |
| `baseMaxChroma` (top-level and inside `light` / `dark`) | `surfaceMaxChroma` |
| `invertDarkModeBaseAccent` | `invertDarkModeSurfaceAccent` |

```ts
// Before
hextimate("#6A5ACD").style({
  baseColor: "#f7f7f8",
  baseHueShift: 180,
  baseMaxChroma: 0.02,
  invertDarkModeBaseAccent: true,
});

// After
hextimate("#6A5ACD").style({
  surfaceColor: "#f7f7f8",
  surfaceHueShift: 180,
  surfaceMaxChroma: 0.02,
  invertDarkModeSurfaceAccent: true,
});
```

### CLI flags

| Before (0.5) | After (0.6) |
|---|---|
| `--base-color` | `--surface-color` |
| `--base-hue-shift` | `--surface-hue-shift` |
| `--base-max-chroma` | `--surface-max-chroma` |
| `--invert-dark-mode-base-accent` | `--invert-dark-mode-surface-accent` |

### `roleNames` remapping

If you were remapping `base` to another name in `format({ roleNames })`, update the source key:

```ts
// Before
.format({ roleNames: { base: "background" } });

// After
.format({ roleNames: { surface: "background" } });
```

### Search and replace checklist

Grep your codebase for (whole-word matches):

- `--base-`, `--base "`, `--base;`, `--base)` → rename to `--surface*`
- `bg-base`, `text-base-`, `border-base`, `ring-base`, `fill-base`, `stroke-base` (Tailwind utilities only) → rename to `*-surface*`
- `baseColor`, `baseHueShift`, `baseMaxChroma`, `invertDarkModeBaseAccent`
- `"base"`, `"base.`, `'base'`, `'base.` (builder strings and `roleNames` keys)

> **Careful**: `text-base` is _also_ a Tailwind font-size utility (`font-size: 1rem`). If your codebase uses it for text sizing (not for hextimator's base color), leave it alone. That collision is the reason for this rename.

### React

No API shape changes — only the role name. Inside `configure` callbacks and `addToken` calls, rename any `"base"` / `"base.weak"` / `"base.foreground"` references to `"surface.*"`.

## 0.4.x → 0.5.0

0.5.0 changes what `.format({ as: "css" })` and `.format({ as: "tailwind-css" })` return. Everything else — palette math, builder methods, presets, React API — is untouched.

### `as: "css"` and `as: "tailwind-css"` return a string

Stylesheet outputs are no longer a `{ light, dark }` map of CSS variable objects. They now return a ready-to-paste string that combines both themes with a dark-mode wrapper.

| Before (0.4) | After (0.5) |
|---|---|
| `{ light: { "--accent": "#..." }, dark: { "--accent": "#..." } }` | `":root { --accent: #...; }\n@media (prefers-color-scheme: dark) { :root { --accent: #...; } }"` |
| `{ light: { "--color-accent": "#..." }, dark: { ... } }` (tailwind-css) | `"@theme { --color-accent: #...; }\n@media (prefers-color-scheme: dark) { :root { --color-accent: #...; } }"` |

If you were hand-building a stylesheet from the returned map, delete that code and use the string directly:

```ts
// Before
const { light, dark } = hextimate(color).format({ as: "css" });
const css = `:root {\n${Object.entries(light).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n@media (prefers-color-scheme: dark) {\n  :root {\n${Object.entries(dark).map(([k, v]) => `    ${k}: ${v};`).join("\n")}\n  }\n}`;

// After
const css = hextimate(color).format({ as: "css" });
```

If you were reading the map directly (e.g. to inject CSS variables imperatively), switch to `as: "object"` and prepend `--` yourself:

```ts
// Before
const { light } = hextimate(color).format({ as: "css" });
for (const [key, value] of Object.entries(light)) element.style.setProperty(key, value);

// After
const { light } = hextimate(color).format({ as: "object" });
for (const [key, value] of Object.entries(light)) element.style.setProperty(`--${key}`, value);
```

### New `darkMode` and `selector` options

Stylesheet outputs take two new options:

| Option | Values | Default |
|---|---|---|
| `darkMode` | `"media"`, `"class"`, `"data-attribute"`, `false` | `"media"` |
| `selector` | any CSS selector (only for `as: "css"`) | `":root"` |

```ts
// Class-toggle dark mode under a custom root
hextimate(color).format({
  as: "css",
  darkMode: "class",
  selector: "[data-theme]",
});
```

`as: "tailwind-css"` always wraps light tokens in `@theme`, but `darkMode` still controls how the dark override is emitted.

### CLI

Two new flags mirror the API:

| Flag | Description | Default |
|---|---|---|
| `--dark-mode` | `media`, `class`, `data-attribute`, `false` (stylesheet outputs only) | `media` |
| `--selector` | Root selector for `--format css` | `:root` |

`--theme` is now ignored for `css` and `tailwind-css` (both themes always combine into one string); it still applies to `object`, `tailwind`, `scss`, and `json`.

## 0.2.x → 0.3.0

0.3.0 moved palette tuning to `.style()` on the builder.

### Core builder

| Before (0.2) | After (0.3) |
|---|---|
| `hextimate(color, options)` | `hextimate(color).style(options)` (or split into several `.style()` calls) |
| `base.fork(otherColor, options)` | `base.fork(otherColor).style(options)` |
| `base.fork(options)` (same color) | `base.fork().style(options)` |
| Preset field `generation` | Preset field `style` |
| Type `HextimateGenerationOptions` | `HextimateStyleOptions` |
| `themeLightness` (and similar) on a flat options object | Use `light` / `dark` on `ThemeAdjustments` inside `.style()` — see [Customization](customization.md) |

Search your codebase for `hextimate(`, `.fork(`, `generation:`, and `HextimateGenerationOptions`.

### React

| Before (0.2) | After (0.3) |
|---|---|
| `generation` / `setGeneration` on provider, hook, or `useHextimator` options | `style` / `setStyle` |
| `HextimatorScope` prop `style` for inline styles on the wrapper | `wrapperStyle` (the name `style` is reserved for palette options) |

`useHextimator(color, { darkMode, format, … })` is unchanged in shape: only the **`generation`** key became **`style`**.

## Further reading

- [Customization](customization.md) — style and format options reference
- [Multiple themes](multiple-themes.md) — `.fork()` + `.style()`
- [Presets](presets.md) — preset `style`, chaining, `.style()` after `.preset()`
- [React](react.md) — provider, hook, scope props
