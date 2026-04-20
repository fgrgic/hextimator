# Migrating from 0.4.x to 0.5.0

0.5.0 changes what `.format({ as: "css" })` and `.format({ as: "tailwind-css" })` return. Everything else -- palette math, builder methods, presets, React API -- is untouched.

## `as: "css"` and `as: "tailwind-css"` return a string

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

## New `darkMode` and `selector` options

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

## CLI

Two new flags mirror the API:

| Flag | Description | Default |
|---|---|---|
| `--dark-mode` | `media`, `class`, `data-attribute`, `false` (stylesheet outputs only) | `media` |
| `--selector` | Root selector for `--format css` | `:root` |

`--theme` is now ignored for `css` and `tailwind-css` (both themes always combine into one string); it still applies to `object`, `tailwind`, `scss`, and `json`.

## React

No change.

## Further reading

- [Multiple themes](multiple-themes.md)
- [Tailwind](tailwind.md)
- [React](react.md)
