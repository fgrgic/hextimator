# Tailwind CSS v4

Import hextimator's stylesheet after Tailwind:

```css
@import "tailwindcss";
@import "hextimator/tailwind.css";
```

Now every token in the default theme is a Tailwind color:

```html
<button class="bg-accent text-accent-foreground">Save</button>
<button class="bg-negative text-negative-foreground">Delete</button>
<p class="text-surface-foreground-negative">Payment failed</p>
```

The classes point at CSS variables, such as `--accent`. hextimator fills those variables with your brand color. Change the color at runtime and every class follows.

For colored text on the page, use `text-surface-foreground-*`. `text-negative` is the fill color and may be hard to read on the surface.

## Custom themes

The stylesheet only knows the default names. If your theme adds or renames tokens, Tailwind needs to know them too.

### Added a few tokens

Keep the stylesheet and add the new names:

```css
@import "tailwindcss";
@import "hextimator/tailwind.css";

@theme inline {
  --color-cta: var(--cta);
  --color-cta-foreground: var(--cta-foreground);
}
```

### Replaced the theme

Generate the stylesheet from your theme before Tailwind builds:

```ts
// scripts/tailwind-theme.ts
import { writeFileSync } from "node:fs";
import { tailwindAliases } from "hextimator";
import { theme } from "../src/theme";

writeFileSync("src/hextimator-theme.css", tailwindAliases(theme));
```

Run it before `dev` and `build`, then import the file instead of `hextimator/tailwind.css`:

```css
@import "tailwindcss";
@import "./hextimator-theme.css";
```

Rerun it when the theme's tokens change. Accent changes need no rebuild.

## Inverted tokens

For sections in the opposite mode, format with `invertedVariants: true` and add the companion stylesheet:

```css
@import "hextimator/tailwind-inverted.css";
```

For a custom theme, use `tailwindAliases(theme, { inverted: true })`. See [Inverted variants](customization.md#inverted-variants).
