# React

hextimator’s React entry (`hextimator/react`) turns a brand color into light/dark CSS variables.

There are two ways to wire it up:

- **`HextimatorProvider`** — React context for the base color, dark-mode preference, and builder configuration. It injects the stylesheet (via `useHextimator` internally). Child components use **`useHextimatorTheme()`** to read or update that state.

- **`useHextimator`** or **`HextimatorStyle`** — no context. They only compute the palette and emit CSS: the hook uses `useEffect` plus `document.head` or a `target` ref; the component renders a `<style>` node. There is no `useHextimatorTheme()`; you supply color and options yourself (fixed or from your own state).

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

Use **`useHextimatorTheme()`** under the provider for `color`, `setColor`, `palette`, `mode`, `setMode`, and the rest. More options (generation, `format`, `configure`, `darkMode`, …) are [below](#provider-options-and-usehextimatortheme).

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

It accepts the same levers as the hook: `generation`, `format`, `configure`, `darkMode`, and `cssPrefix`.

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

## CSS prefix

Namespace CSS variables to avoid collisions with other libraries:

```typescript
useHextimator("#6A5ACD", { cssPrefix: "ht-" });
// → --ht-accent, --ht-base, etc.
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

When the scope sits under `HextimatorProvider` (or another scope), it **inherits** custom roles, variants, tokens, and presets: internally it does `parent.builder.fork(scopeColor, scopeGeneration)` and then applies the scope’s own `configure`. You typically only pass **`defaultColor`**; you do not need to repeat the root `configure` unless you want extra tokens in that subtree.

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
          <Card /> {/* same roles/variants as root, different base color */}
        </HextimatorScope>
      </main>
    </HextimatorProvider>
  );
}
```

**Mode** (`light` / `dark` / `system`) is **inherited** from the nearest parent provider: toggling dark mode at the root still applies to scoped CSS, as long as the scope uses a compatible `darkMode` strategy (same class/data/media behavior).

**Format options:** the provider’s `format` prop is applied when the root palette is built; it is not stored on the builder. If you rely on non-default `format` options at the root, pass the same `format` on each `HextimatorScope` (or standalone `HextimatorStyle`) so serialized tokens stay consistent.

## With generation and format options

```typescript
useHextimator("#6A5ACD", {
  generation: { minContrastRatio: "AA" },
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
      .addToken("border", { from: "base.weak", lightness: -0.05 });
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
    <div className="bg-base text-base-foreground">
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      {/* Everything re-themes instantly */}
    </div>
  );
}
```

## Hook options reference

| Option       | Type                                                   | Default             | Description                                                   |
| ------------ | ------------------------------------------------------ | ------------------- | ------------------------------------------------------------- |
| `darkMode`   | `{ type: "media" \| "class" \| "data", ... } \| false` | `{ type: "media" }` | Dark mode strategy                                            |
| `cssPrefix`  | `string`                                               | `""`                | Prefix for CSS variable names                                 |
| `target`     | `RefObject<HTMLElement>`                               | —                   | Scope vars to an element instead of injecting a `<style>` tag |
| `generation` | `HextimateGenerationOptions`                           | —                   | Palette generation options                                    |
| `format`     | `Omit<HextimateFormatOptions, "as">`                   | —                   | Color serialization options                                   |
| `configure`  | `(builder) => void`                                    | —                   | Access the builder to add roles, variants, or tokens          |

## `HextimatorStyle` props

| Prop         | Type                                 | Default             | Description                         |
| ------------ | ------------------------------------ | ------------------- | ----------------------------------- |
| `color`      | `string`                             | (required)          | Base color                          |
| `darkMode`   | same as hook                         | `{ type: "media" }` | Dark mode strategy                  |
| `cssPrefix`  | `string`                             | `""`                | Variable prefix                     |
| `selector`   | `string`                             | `":root"`           | CSS selector for the variable block |
| `generation` | `HextimateGenerationOptions`         | —                   | Generation options                  |
| `format`     | `Omit<HextimateFormatOptions, "as">` | —                   | Format options                      |
| `configure`  | `(builder) => void`                  | —                   | Builder callback                    |

## `HextimatorScope` props

| Prop           | Type                                 | Default             | Description                               |
| -------------- | ------------------------------------ | ------------------- | ----------------------------------------- |
| `defaultColor` | `string`                             | (required)          | Base color for this subtree               |
| `darkMode`     | same as hook                         | `{ type: "media" }` | Should match root strategy for class/data |
| `cssPrefix`    | `string`                             | `""`                | Variable prefix                           |
| `generation`   | `HextimateGenerationOptions`         | —                   | Overrides merged into `fork()`            |
| `format`       | `Omit<HextimateFormatOptions, "as">` | —                   | Format for this subtree’s palette         |
| `configure`    | `(builder) => void`                  | —                   | Applied after fork (extra tokens, etc.)   |
| `className`    | `string`                             | —                   | On the wrapper `div`                      |
| `style`        | `CSSProperties`                      | —                   | On the wrapper `div`                      |

## Provider options and `useHextimatorTheme`

The provider accepts the same options as `useHextimator` — `darkMode`, `cssPrefix`, `target`, `generation`, `format`, and `configure`:

```typescript
<HextimatorProvider
  defaultColor="#6A5ACD"
  generation={{ minContrastRatio: "AA" }}
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

| Field                 | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `color`               | Current input color                                                   |
| `setColor(color)`     | Update the input color — palette regenerates automatically            |
| `generation`          | Current generation options                                            |
| `setGeneration(opts)` | Update generation options at runtime                                  |
| `configure`           | Current builder configure function                                    |
| `setConfigure(fn)`    | Update the builder configure function (e.g. to toggle CVD adaptation) |
| `palette`             | The current formatted palette result                                  |
| `builder`             | Current `HextimatePaletteBuilder` (forked by nested scopes)           |
