# hextimator

<p align="center">
    <picture>
        <img src="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/assets/gh-cover.webp?raw=true" alt="hextimator" width="500">
    </picture>
</p>

Per-tenant themes from a single one brand color: Runtime theming for B2B2C and white-label apps.

Your customers pick a brand color. Your app looks good. Every time. No per-customer design reviews, no manual tuning, no edge cases where "that shade of yellow" breaks your UI.

Ship multi-tenant apps without the design overhead:

- **Every color just works**. Perceptually uniform colors with OKLCH means that electric blue looks as balanced as muted olive.
- **Accessible by default**. Every foreground meets AAA contrast against its background, light and dark mode included.

Try it in the playground: **[hextimator.com](https://hextimator.com)**

## Why `hextimator` exists

You're building a B2B, a B2B2C, or a white-label app. Every tenant wants their own brand color in the app. The options today are:

1. **Let customers pick any hex.** It works until a partner's _legal-pad yellow_ renders your buttons unreadable, and their _cheeto dust tangerine_ toast makes it indistinguishable from a warning.
2. **Constrain them to a curated palette.** Now you need to tell a paying customer that their brand color isn't allowed. Or spend hours adjusting all the other colors by hand to make the theme somewhat work.

Hextimator is option 3. One color in, whole theme out. You get accent, semantic roles, light/dark palette, every foreground guaranteed to meet WCAG contrast against its background. Every time. Even for that yellow.

```ts
import { hextimate } from "hextimator";

const tenantTheme = hextimate(tenant.brandColor).format({ as: "css" });

document.getElementById("tenant-theme").textContent = tenantTheme;
```

That's the integration. Swap the color, the theme regenerates at runtime, and the UI stays readable.

## Quick start

```bash
npm install hextimator
```

### One-off theme

```typescript
import { hextimate } from "hextimator";

const theme = hextimate("#6A5ACD").format();
// theme.light / theme.dark each contain your full theme tokens
```

### Multi-tenant app with React

```jsx
<HextimatorProvider defaultColor={tenant.brandColor}>
  <App />
</HextimatorProvider>
```

See full React integration guide [here](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md).

## Documentation

Full API docs, options reference, React hook, Tailwind v4 setup, and examples live in the [package README](./packages/hextimator/README.md)

## Monorepo structure

| Workspace    | Path                   | Description                                             |
| ------------ | ---------------------- | ------------------------------------------------------- |
| `hextimator` | `packages/hextimator/` | The publishable npm package                             |
| `playground` | `apps/playground/`     | React app for local testing                             |
| `website`    | `apps/website/`        | Landing page ([hextimator.com](https://hextimator.com)) |

## Dev workflow

```bash
bun install          # install all workspaces
```

Run the playground and the package in watch mode:

```bash
bun run dev:playground
```

Run the website and the package in watch mode:

```bash
bun run dev:website
```

> The playground imports from `dist/`, so keep the package's `bun run dev` running to auto-rebuild on changes.

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).
