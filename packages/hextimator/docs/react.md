# React

hextimator’s React entry (`hextimator/react`) turns a brand color into light/dark CSS variables.

There are two ways to wire it up:

- **`HextimatorProvider`** — React context for the brand color (single or per-mode), dark-mode preference, and builder configuration. Injects the stylesheet into `document.head` (or a `target` ref). Child components use **`useHextimatorTheme()`** to read or update that state.

- **`useHextimator`** or **`HextimatorStyle`** — no context. They only compute the palette and emit CSS: the hook uses `useEffect` plus `document.head` or a `target` ref; the component renders a `<style>` node. There is no `useHextimatorTheme()`; you pass **`color`** and an optional options object (`style`, `darkMode`, `format`, …). That mirrors the core builder API: **`hextimate(color)`** only takes the color, and palette tuning uses **`.style()`** on the builder (here exposed as the hook/component **`style`** prop).

**`HextimatorScope`** themes a subtree and inherits palette shape from the parent via **`fork()`** (see below).

Pair with `hextimator/tailwind.css` for Tailwind utilities that read those variables.

```bash
npm install hextimator react
```

## `HextimatorProvider`

```typescript
import { HextimatorProvider } from "hextimator/react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <HextimatorProvider defaultColor="#6A5ACD">
    <App />
  </HextimatorProvider>,
);
```

Use **`useHextimatorTheme()`** under the provider for `color`, `setColor`, `palette`, `mode`, `setMode`, and the rest. More options (`style`, `format`, `configure`, `darkMode`, …) are [below](#provider-options-and-usehextimatortheme).

### Per-mode colors

Pass an object to `defaultColor` to use a different brand color for light and dark modes. The provider builds both palettes and stitches them so the dark CSS block always derives from `dark`, even when the user is currently in light mode (so `@media (prefers-color-scheme: dark)` and OS-driven flips serve the right palette).

```tsx
<HextimatorProvider defaultColor={{ light: "#FF6600", dark: "#0088FF" }}>
  <App />
</HextimatorProvider>
```

When `light === dark` (the default for a string `defaultColor`), only one palette is built — no extra cost for the common case.

`useHextimatorTheme()` exposes `lightColor` / `setLightColor` and `darkColor` / `setDarkColor` for granular control. `setColor` always sets both at once.

### Persistence

`onColorChange` and `onModePreferenceChange` fire on every user-driven update. Wire them to your storage of choice; restore by reading once on mount and passing the result to `defaultColor` / `defaultMode`.

```tsx
import { useMemo } from "react";

function load() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem("hextimator") ?? "null");
  } catch {
    return null;
  }
}

function save(next: object) {
  window.localStorage.setItem(
    "hextimator",
    JSON.stringify({ ...load(), ...next }),
  );
}

function App() {
  // useMemo (not useState) so a single read seeds both defaults; mode and color
  // are independently tracked inside the provider after mount.
  const initial = useMemo(() => load() ?? {}, []);

  return (
    <HextimatorProvider
      defaultColor={initial.color ?? "#6A5ACD"}
      defaultMode={initial.mode ?? "system"}
      onColorChange={(color) => save({ color })}
      onModePreferenceChange={(mode) => save({ mode })}
    >
      <Routes />
    </HextimatorProvider>
  );
}
```

For a forced override (URL-driven theme, server push), remount with `key={color}`:

```tsx
<HextimatorProvider key={urlColor} defaultColor={urlColor}>
```

### Avoiding flash on first paint (FOUC)

The provider injects its `<style>` tag in `useEffect`, which runs after the first paint. On a fresh page load this means there is a brief moment where the user sees the _default_ theme before their persisted color takes effect. How visible this is depends on your setup:

**SPA (Vite, CRA)**: in practice the gap is one frame, because your `<App>` doesn't render anything meaningful until JS loads anyway. To avoid the flash entirely:

1. Read storage _synchronously_ in a lazy initializer (the `useMemo(() => load(), [])` pattern above) so `defaultColor` is already the persisted value on the very first render.
2. Optionally include `hextimator/fallback.css` in your bundle so `--accent`, `--surface`, etc. have neutral fallback values before any `<style>` is injected — prevents _invisible_ (white-on-white) UI in the gap.

**SSR (Next.js, Remix)**: localStorage is unavailable on the server. Persist the color in a **cookie** instead, read it in your server layout, and render a server-side `<HextimatorStyle>` so the HTML response already includes the correct palette:

```tsx
// Next.js app/layout.tsx
import { cookies } from "next/headers";
import { HextimatorStyle, HextimatorProvider } from "hextimator/react";

export default async function RootLayout({ children }) {
  const stored = (await cookies()).get("hextimator")?.value;
  const initial = stored ? JSON.parse(stored) : {};
  const color = initial.color ?? "#6A5ACD";

  return (
    <html lang='en'>
      <head>
        {/* Server-rendered: present in the initial HTML, no flash. */}
        <HextimatorStyle color={color} darkMode={{ type: "class" }} />
      </head>
      <body>
        <HextimatorProvider
          defaultColor={color}
          defaultMode={initial.mode ?? "system"}
          darkMode={{ type: "class" }}
          onColorChange={(c) => writeCookie({ ...initial, color: c })}
          onModePreferenceChange={(m) => writeCookie({ ...initial, mode: m })}
        >
          {children}
        </HextimatorProvider>
      </body>
    </html>
  );
}
```

The provider still mounts client-side and takes over once hydrated, but the initial paint is already correct.

**Mode flicker is a separate concern**: when `defaultMode` is `"system"`, the resolved mode depends on `window.matchMedia` which only exists client-side. If you store the user's _resolved_ mode in a cookie too, you can server-render the right `class="dark"` on `<html>` and avoid a light → dark flash. This is the standard `next-themes` approach.

## `useHextimator` without a provider

On the client, after mount the hook either appends a `<style>` tag to **`document.head`** or writes custom properties onto **`target`** when you pass a ref.

```typescript
import { useHextimator } from "hextimator/react";

function App() {
  useHextimator("#6A5ACD");

  return <div className="bg-accent text-accent-foreground">Themed!</div>;
}
```

By default, both light and dark themes are injected and toggled via `prefers-color-scheme`. The hook returns the formatted **`palette`** object if you need the same values in JS.

## `HextimatorStyle` (declarative, SSR-friendly)

For **SPAs**, `hextimator/fallback.css` (see package README) can load with your bundle CSS so variables exist before any JS runs; `HextimatorStyle` / the hook still supply the real theme once the app loads.

`HextimatorStyle` builds the same palette as `useHextimator` but renders a `<style>` element as part of your React output. There is no `useEffect` and no `document.head` injection, so the initial HTML can include theme CSS (for example in a Next.js layout). It does not use a provider.

```tsx
import { HextimatorStyle } from "hextimator/react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <HextimatorStyle color='#6A5ACD' darkMode={{ type: "class" }} />
        {children}
      </body>
    </html>
  );
}
```

It accepts the same levers as the hook: `style`, `format`, `configure`, `darkMode`, and `cssPrefix`.

### Scoping with `selector`

By default, variables apply to `:root` (global). Pass `selector` to limit them to a subtree via normal CSS cascade:

```tsx
<div className='card-a'>
  <HextimatorStyle
    color='#EE2244'
    selector='.card-a'
    darkMode={{ type: "class" }}
  />
  <p className='text-accent'>Uses the red palette.</p>
</div>
```

For a ready-made wrapper that generates a stable scope attribute and nested theme context, use **`HextimatorScope`** (below).

## Dark mode strategies

These apply to both `useHextimator` and `HextimatorStyle` (and should match between root and scoped subtrees when you use class or data strategies).

```typescript
// System preference (default)
useHextimator("#6A5ACD", { darkMode: { type: "media" } });

// Class-based (Tailwind's `dark` class, Next.js, etc.)
useHextimator("#6A5ACD", { darkMode: { type: "class" } });
// → .dark { --accent: ...; }

// Custom class name
useHextimator("#6A5ACD", {
  darkMode: { type: "class", className: "theme-dark" },
});

// Data attribute
useHextimator("#6A5ACD", { darkMode: { type: "data" } });
// → [data-theme="dark"] { --accent: ...; }

// Custom attribute
useHextimator("#6A5ACD", {
  darkMode: { type: "data", attribute: "data-mode" },
});

// Light only, no dark theme
useHextimator("#6A5ACD", { darkMode: false });
```

### Light-only apps

For a light-mode-only UI, pass **`darkMode: false`**. Only the light palette is written to `:root` (no `prefers-color-scheme` block, no `.dark` / `[data-theme="dark"]` overrides). The hook still returns `palette.light` and `palette.dark` if you read them in JS; CSS injection is light tokens only.

With the provider:

```typescript
<HextimatorProvider defaultColor="#6A5ACD" darkMode={false}>
  <App />
</HextimatorProvider>
```

You can also skip React integration and call `hextimate()` from the main package, then use only `palette.light` from `.format(...)`.

## CSS prefix

Namespace CSS variables to avoid collisions with other libraries:

```typescript
useHextimator("#6A5ACD", { cssPrefix: "ht-" });
// → --ht-accent, --ht-surface, etc.
```

## Scoping themes

### `target` (hook only)

Apply theme variables to a **single** element by ref instead of injecting a global `<style>` tag:

```typescript
function BrandedSection({ brandColor }: { brandColor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useHextimator(brandColor, { target: ref });

  return (
    <div ref={ref} className="bg-accent text-accent-foreground">
      This section has its own brand colors.
    </div>
  );
}
```

### `HextimatorScope` (subtree + context)

`HextimatorScope` wraps children in a `div` with a stable `data-hextimator-scope` attribute (via `useId()`), injects a scoped `<style>` for that subtree, and provides a **nested** `HextimatorContext`. `useHextimatorTheme()` from inside the scope returns the **scope’s** `color`, `palette`, and `builder`, not the root’s.

When the scope sits under `HextimatorProvider` (or another scope), it **inherits** custom roles, variants, tokens, and presets: internally it does `parent.builder.fork(scopeColor)`, then merges the scope’s `style` prop with `.style()` when present, and applies the scope’s own `configure`. You typically only pass **`defaultColor`**; you do not need to repeat the root `configure` unless you want extra tokens in that subtree.

```tsx
import {
  HextimatorProvider,
  HextimatorScope,
  useHextimatorTheme,
} from "hextimator/react";

function App() {
  return (
    <HextimatorProvider
      defaultColor='#6A5ACD'
      darkMode={{ type: "class" }}
      configure={(b) => b.addRole("cta", "#EE2244")}
    >
      <main>
        <Card />
        <HextimatorScope defaultColor='#0D9488' darkMode={{ type: "class" }}>
          <Card /> {/* same roles/variants as root, different brand color */}
        </HextimatorScope>
      </main>
    </HextimatorProvider>
  );
}
```

**Mode** (`light` / `dark` / `system`) is **inherited** from the nearest parent provider: toggling dark mode at the root still applies to scoped CSS, as long as the scope uses a compatible `darkMode` strategy (same class/data/media behavior).

**Format options:** the provider’s `format` prop is applied when the root palette is built; it is not stored on the builder. If you rely on non-default `format` options at the root, pass the same `format` on each `HextimatorScope` (or standalone `HextimatorStyle`) so serialized tokens stay consistent.

## With style and format options

```typescript
useHextimator("#6A5ACD", {
  style: { minContrastRatio: "AA" },
  format: { colors: "oklch" },
});
```

## With custom roles and variants

```typescript
useHextimator("#6A5ACD", {
  format: { colors: "oklch" },
  configure: (builder) => {
    builder
      .addRole("cta", "#EE2244")
      .addVariant("hover", { from: "strong" })
      .addToken("border", { from: "surface.weak", lightness: -0.05 });
  },
});
```

## Dynamic theming

The hook re-generates the palette whenever the color changes:

```typescript
function App() {
  const [color, setColor] = useState("#6A5ACD");
  useHextimator(color);

  return (
    <div className="bg-surface text-surface-foreground">
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      {/* Everything re-themes instantly */}
    </div>
  );
}
```

## Hook options reference

| Option      | Type                                                   | Default             | Description                                                   |
| ----------- | ------------------------------------------------------ | ------------------- | ------------------------------------------------------------- |
| `darkMode`  | `{ type: "media" \| "class" \| "data", ... } \| false` | `{ type: "media" }` | Dark mode strategy                                            |
| `cssPrefix` | `string`                                               | `""`                | Prefix for CSS variable names                                 |
| `target`    | `RefObject<HTMLElement>`                               | —                   | Scope vars to an element instead of injecting a `<style>` tag |
| `style`     | `HextimateStyleOptions`                                | —                   | Palette style options                                         |
| `format`    | `Omit<HextimateFormatOptions, "as">`                   | —                   | Color serialization options                                   |
| `configure` | `(builder) => void`                                    | —                   | Access the builder to add roles, variants, or tokens          |

## `HextimatorStyle` props

| Prop        | Type                                 | Default             | Description                         |
| ----------- | ------------------------------------ | ------------------- | ----------------------------------- |
| `color`     | `string`                             | (required)          | Brand color                         |
| `darkMode`  | same as hook                         | `{ type: "media" }` | Dark mode strategy                  |
| `cssPrefix` | `string`                             | `""`                | Variable prefix                     |
| `selector`  | `string`                             | `":root"`           | CSS selector for the variable block |
| `style`     | `HextimateStyleOptions`              | —                   | Style options                       |
| `format`    | `Omit<HextimateFormatOptions, "as">` | —                   | Format options                      |
| `configure` | `(builder) => void`                  | —                   | Builder callback                    |

## `HextimatorScope` props

| Prop           | Type                                 | Default             | Description                                                |
| -------------- | ------------------------------------ | ------------------- | ---------------------------------------------------------- |
| `defaultColor` | `string \| { light, dark }`          | (required)          | Brand color for this subtree (string sets both modes equal) |
| `darkMode`     | same as hook                         | `{ type: "media" }` | Should match root strategy for class/data                  |
| `cssPrefix`    | `string`                             | `""`                | Variable prefix                                            |
| `style`        | `HextimateStyleOptions`              | —                   | Merged with `.style()` after `fork()`                      |
| `format`       | `Omit<HextimateFormatOptions, "as">` | —                   | Format for this subtree’s palette                          |
| `configure`    | `(builder) => void`                  | —                   | Applied after fork (extra tokens, etc.)                    |
| `className`    | `string`                             | —                   | On the wrapper `div`                                       |
| `wrapperStyle` | `CSSProperties`                      | —                   | Inline styles on the wrapper `div`                         |

## Provider options and `useHextimatorTheme`

The provider accepts the same options as `useHextimator` — `darkMode`, `cssPrefix`, `target`, `style`, `format`, and `configure`:

```typescript
<HextimatorProvider
  defaultColor="#6A5ACD"
  style={{ minContrastRatio: "AA" }}
  format={{ colors: "oklch", roleNames: { accent: "brand" } }}
  darkMode={{ type: "class" }}
  cssPrefix="ht-"
  configure={(builder) => builder.addRole("cta", "#EE2244")}
>
  <App />
</HextimatorProvider>
```

Child components access and update the theme via `useHextimatorTheme()`. From inside a **`HextimatorScope`**, the hook returns that scope’s palette and color state; `mode` / `setMode` still follow the enclosing provider when one exists.

```typescript
import { useHextimatorTheme } from "hextimator/react";

function ThemePicker() {
  const { color, setColor, palette, builder, setConfigure } = useHextimatorTheme();

  return (
    <div>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <button onClick={() => setConfigure((b) => b.adaptFor("deuteranopia"))}>
        Deuteranopia mode
      </button>
    </div>
  );
}
```

| Field                          | Description                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `color`                        | Color active for the resolved mode (`lightColor` in light, `darkColor` in dark) |
| `setColor(color)`              | Sets both `lightColor` and `darkColor` — palette regenerates                    |
| `lightColor` / `setLightColor` | Color used to generate the light-mode palette                                   |
| `darkColor` / `setDarkColor`   | Color used to generate the dark-mode palette                                    |
| `mode`                         | Resolved mode (`'light'` or `'dark'`)                                           |
| `modePreference`               | Raw preference (`'light'`, `'dark'`, or `'system'`)                             |
| `setMode(pref)`                | Update the mode preference                                                      |
| `style` / `setStyle`           | Style options                                                                   |
| `presets` / `setPresets`       | Active presets array                                                            |
| `configure` / `setConfigure`   | Builder configure function (e.g. toggle CVD adaptation)                         |
| `palette`                      | The current formatted palette result                                            |
| `builder`                      | Current `HextimatePaletteBuilder` (forked by nested scopes)                     |

### Provider props

| Prop                                                             | Type                                                   | Default             | Description                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------ | ------------------- | ------------------------------------------------- |
| `defaultColor`                                                   | `string \| { light, dark }`                            | (required)          | Initial color. String sets both modes equal.      |
| `defaultMode`                                                    | `'light' \| 'dark' \| 'system'`                        | `'system'`          | Initial mode preference                           |
| `onColorChange`                                                  | `(next: { light, dark }) => void`                      | —                   | Fires on every color change. Use for persistence. |
| `onModePreferenceChange`                                         | `(mode) => void`                                       | —                   | Fires on every mode change. Use for persistence.  |
| `darkMode`                                                       | `{ type: 'media' \| 'class' \| 'data', ... } \| false` | `{ type: 'media' }` | Dark mode strategy                                |
| `style`, `presets`, `format`, `configure`, `cssPrefix`, `target` | (same as hook)                                         | —                   | See hook options                                  |
