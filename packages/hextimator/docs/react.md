# React

hextimator provides a React hook that generates both light and dark palettes and injects them as CSS variables via a `<style>` tag. Combined with `hextimator/tailwind.css`, this gives you live-updating Tailwind utilities with dark mode support and zero glue code.

```bash
npm install hextimator react
```

## Basic usage

```typescript
import { useHextimator } from "hextimator/react";

function App() {
  useHextimator("#6A5ACD");

  return <div className="bg-accent text-accent-foreground">Themed!</div>;
}
```

By default, both light and dark themes are injected and toggled via `prefers-color-scheme`.

## Dark mode strategies

```typescript
// System preference (default)
useHextimator("#6A5ACD", { darkMode: { type: "media" } });

// Class-based (Tailwind's `dark` class, Next.js, etc.)
useHextimator("#6A5ACD", { darkMode: { type: "class" } });
// → .dark { --accent: ...; }

// Custom class name
useHextimator("#6A5ACD", { darkMode: { type: "class", className: "theme-dark" } });

// Data attribute
useHextimator("#6A5ACD", { darkMode: { type: "data" } });
// → [data-theme="dark"] { --accent: ...; }

// Custom attribute
useHextimator("#6A5ACD", { darkMode: { type: "data", attribute: "data-mode" } });

// Light only, no dark theme
useHextimator("#6A5ACD", { darkMode: false });
```

## CSS prefix

Namespace CSS variables to avoid collisions with other libraries:

```typescript
useHextimator("#6A5ACD", { cssPrefix: "ht-" });
// → --ht-accent, --ht-base, etc.
```

## Scoped theming with `target`

Apply theme variables to a specific element instead of globally:

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

| Option | Type | Default | Description |
|---|---|---|---|
| `darkMode` | `{ type: "media" \| "class" \| "data", ... } \| false` | `{ type: "media" }` | Dark mode strategy |
| `cssPrefix` | `string` | `""` | Prefix for CSS variable names |
| `target` | `RefObject<HTMLElement>` | — | Scope vars to an element instead of injecting a `<style>` tag |
| `generation` | `HextimateGenerationOptions` | — | Palette generation options |
| `format` | `Omit<HextimateFormatOptions, "as">` | — | Color serialization options |
| `configure` | `(builder) => void` | — | Access the builder to add roles, variants, or tokens |

## Provider

For apps where multiple components need access to the theme (or where users can change the color at runtime), wrap your app in `HextimatorProvider` instead of calling the hook directly.

```typescript
import { HextimatorProvider } from "hextimator/react";

createRoot(root).render(
  <HextimatorProvider defaultColor="#6A5ACD">
    <App />
  </HextimatorProvider>
);
```

The provider accepts all the same options as `useHextimator` — `darkMode`, `cssPrefix`, `target`, `generation`, `format`, and `configure`:

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

Child components access and update the theme via `useHextimatorTheme()`:

```typescript
import { useHextimatorTheme } from "hextimator/react";

function ThemePicker() {
  const { color, setColor, palette, setConfigure } = useHextimatorTheme();

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

| Method | Description |
|---|---|
| `color` | Current input color |
| `setColor(color)` | Update the input color — palette regenerates automatically |
| `generation` | Current generation options |
| `setGeneration(opts)` | Update generation options at runtime |
| `configure` | Current builder configure function |
| `setConfigure(fn)` | Update the builder configure function (e.g. to toggle CVD adaptation) |
| `palette` | The current formatted palette result |
