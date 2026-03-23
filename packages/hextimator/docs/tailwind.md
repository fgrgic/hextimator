# Tailwind CSS v4

hextimator ships a ready-made CSS file that registers all built-in color tokens with Tailwind v4. This gives you utility classes like `bg-accent`, `text-base-foreground`, `border-negative`, etc.

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

That's it. All 20 built-in tokens (accent, base, positive, negative, warning × DEFAULT/strong/weak/foreground) are available as Tailwind utilities.

## How it works

`hextimator/tailwind.css` contains a `@theme inline` block that maps Tailwind's `--color-*` namespace to bare CSS variables:

```css
@theme inline {
  --color-accent: var(--accent);
  --color-accent-strong: var(--accent-strong);
  /* ...all 20 tokens */
}
```

At runtime, you set the bare variables (`--accent`, `--base`, etc.) on any element — via JavaScript, inline styles, or the React hook — and Tailwind utilities resolve them automatically.

The `inline` keyword means values are resolved where the class is applied, not at `:root`. This enables scoped theming — different parts of the page can have different brand colors.

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
