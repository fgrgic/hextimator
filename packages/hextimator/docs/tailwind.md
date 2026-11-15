# Tailwind CSS v4

hextimator ships a CSS file that registers property-aware utilities for built-in colors with Tailwind v4. This gives you utility classes like `bg-accent`, `text-surface-foreground`, `border-negative`, etc.

## Setup

1. Install Tailwind v4 with the Vite plugin:

```bash
npm install tailwindcss @tailwindcss/vite
```

2. Add the plugin to your `vite.config.ts`:

```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

3. Import Tailwind and hextimator's theme in your CSS:

```css
@import "tailwindcss";
@import "hextimator/tailwind.css";
```

Built-in colors are available as Tailwind utilities. Semantic text and icons use ink colors; backgrounds and borders use fill colors.

## How it works

`hextimator/tailwind.css` registers semantic utilities with `@utility` and surface/foreground utilities with `@theme inline`. Each utility reads bare CSS variables on the element, so React providers and scoped themes resolve their own values.

```css
@utility text-negative {
  color: var(--negative-ink);
}

@utility bg-negative {
  background-color: var(--negative);
}
```

At runtime, set the bare variables via generated CSS, JavaScript, or the React hook.

## Custom roles and variants

If you extend the palette with `addRole()` or `addVariant()`, add the extra tokens to your CSS:

```css
@import "tailwindcss";
@import "hextimator/tailwind.css";

@theme inline {
  --color-cta: var(--cta);
  --color-cta-strong: var(--cta-strong);
  --color-cta-weak: var(--cta-weak);
  --color-cta-foreground: var(--cta-foreground);
}
```

## Property-aware semantic colors

For accent, positive, negative, and caution, the CSS property selects the color:

| Utility | Variable | Contrast contract |
| --- | --- | --- |
| `bg-negative` | `--negative` | Paired with `--negative-foreground` |
| `text-negative` | `--negative-ink` | All three surface backgrounds |
| `fill-negative`, `stroke-negative` | `--negative-ink` | Same as text |
| `caret-negative`, `decoration-negative` | `--negative-ink` | Same as text |
| `placeholder-negative` | `--negative-placeholder` | All three surface backgrounds |
| `border-negative` | `--negative` | Existing value, no text contrast target |

The same mapping applies to `-weak` and `-strong`. Ink weak meets the contrast target first. Regular and strong ink increase emphasis from that boundary. Placeholder utilities set `opacity: 1` so browser defaults do not dilute the color. Background, border, outline, ring, and shadow colors retain their existing values.

Surface utilities keep their existing values. `bg-surface-foreground text-surface` remains an explicit inverted pairing. Semantic inks support only `surface`, `surface-weak`, and `surface-strong` from the same theme. They do not adapt to semantic fills, inverted backgrounds, images, or arbitrary backgrounds. Use `bg-negative text-negative-foreground` for text on a negative fill.

```ts
hextimate('#ff6600').style({
  minContrastRatio: 'AAA',         // ink: 7:1 by default
  placeholderContrastRatio: 'AA', // placeholders: 4.5:1 by default
});
```

Set `placeholderContrastRatio: 'AAA'` to require 7:1, or supply a numeric target. This is a minimum, not a preference. Each target also accepts per-theme overrides under `light` and `dark`. When the surfaces cannot reach a target, hextimator uses the strongest available contrast. Explicit surface overrides remain final.

Inks are generated at output time against the final surface values. Direct ink overrides remain final too:

```ts
hextimate('#ff6600')
  .addToken('surface.weak', { light: '#eeeeee', dark: '#333333' })
  .addToken('negative.ink', '#b42318')
  .format({ as: 'object' });
```

Raw outputs expose `negative-ink`, `negative-ink-weak`, and `negative-ink-strong`, plus the equivalent placeholder tokens. Existing `negative`, `negative-weak`, and `negative-strong` remain fills. Custom roles and custom variants retain the existing shared-color behavior. For renamed built-in roles, generate `tailwind-css` output to register the mapped utilities.

## Opacity and arbitrary colors

Property-aware semantic utilities are static. `text-negative/50`, `bg-negative/50`, and other opacity modifiers on these utilities emit no CSS and no error. Apply weak/strong variants for emphasis. Surface and foreground utilities retain Tailwind's normal modifier behavior; modified colors have no contrast guarantee.

For an explicit escape hatch, use raw variables in arbitrary values:

```html
<div class="bg-[color-mix(in_oklab,var(--negative)_50%,transparent)]"></div>
```

Opacity, gradients, arbitrary values, and direct token overrides own their contrast risk. Semantic gradient stops can use arbitrary values such as `from-[var(--negative)]`.

## Legacy mode

To retain the old shared-color behavior, import the legacy utilities:

```css
@import "tailwindcss";
@import "hextimator/tailwind-legacy.css";
/* Optional, when generating inverted variants: */
@import "hextimator/tailwind-legacy-inverted.css";
```

Set `.style({ propertyAware: false })` to omit the extra tokens. Generated `tailwind-css` output then uses the old `--color-*` namespace too. CLI equivalents: `--legacy-colors` and `--placeholder-contrast AAA`.

Use one utility integration at a time. Do not combine the default stylesheet, the legacy stylesheet, or generated Tailwind stylesheets. Legacy mode preserves opacity modifiers and the original shared values, including their text contrast limitations.
