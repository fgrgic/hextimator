# Hextimator Product Opportunities

---

## What sets hextimator apart

The underlying techniques (OKLCH, lightness manipulation, contrast checking) are well-known. What's different is the design language — the opinionated decisions about how a theme should work as a system:

**Semantic colors inferred from color harmony, not hardcoded.** When you input a brand color, positive/negative/warning colors are derived by testing complementary and split-complementary hues against semantic ranges. The result is a set of semantic colors that are harmonically related to the brand, not just fixed green/red/yellow. When the brand color itself is red or green, the system avoids collision gracefully. No other tool does this — Material Design's error slot is just fixed red.

**Strong/weak describes a perceptual relationship, not a hierarchy.** Most systems use primary/secondary/tertiary — arbitrary ranks with no defined visual relationship to each other. Hextimator's strong/weak variants are defined by lightness deltas in OKLCH, meaning they describe the actual contrast between a color and what sits on top of it. "Use strong when the element should pop, weak when it should recede" — that's a functional instruction, not a naming convention.

**Foreground colors are contrast-aware, not just black or white.** Each color role's foreground is tested against WCAG contrast thresholds (≥7:1) with both light and dark candidates, picking whichever works. Foregrounds carry a hint of chroma (capped at 0.05) so they feel integrated with the palette rather than pasted on.

**Neutral base colors are deliberately decoupled from the brand.** Tinting backgrounds toward the brand color is a common approach that creates readability problems at scale. Hextimator keeps base colors near-neutral (max chroma 0.02) while remaining user-overridable — a practical choice for real product UIs.

The pitch isn't "we use OKLCH." It's "we generate themes that actually make sense as a system."

---

Three product directions built on top of the open-source hextimator core.

---

## 1. Theme API

**One-liner:** A hosted API that turns a brand color into a complete, validated design token set.

### Value proposition

Multi-tenant SaaS platforms need to generate branded themes at runtime. Today they either hardcode a handful of tenant colors or build bespoke palette logic that produces inconsistent results across hues. The Theme API gives them a single endpoint that returns a production-ready token set — perceptually uniform, contrast-validated, with light and dark modes.

### Target customers

- **White-label SaaS** (Shopify app builders, embedded analytics, client portals)
- **Internal tool platforms** (Retool-style builders that let end-users pick brand colors)
- **CMS and website builders** (any product with a "pick your brand color" step)
- **Agencies** building multi-brand sites from a single codebase

### Core features

| Feature | Description |
|---------|-------------|
| **Single-color input** | `POST /theme` with one hex/rgb/hsl/oklch color, get a full palette back |
| **Multiple output formats** | CSS custom properties, Tailwind config, SCSS vars, JSON tokens, Style Dictionary compatible |
| **Light + dark mode** | Both modes returned by default, with proper foreground/background contrast |
| **WCAG contrast validation** | Every foreground/background pair checked against AA/AAA thresholds; failures flagged with suggested fixes |
| **Token versioning** | Pin a theme to a specific API version so updates don't break existing deployments |
| **CDN-hosted CSS** | Optional: get a URL to a hosted stylesheet instead of raw tokens (useful for no-build environments) |
| **Batch generation** | Generate themes for multiple brand colors in one request (multi-tenant bulk setup) |

### Pricing model

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | 500 requests/month, all formats, no SLA |
| **Pro** | $29/month | 50,000 requests/month, CDN hosting, batch API, priority support |
| **Enterprise** | Custom | Unlimited requests, SLA, dedicated subdomain, custom token schemas, on-prem option |

Revenue scales with usage. Multi-tenant platforms with thousands of tenants would land in Pro or Enterprise naturally.

### Technical scope

- **API layer:** Lightweight HTTP service (Hono or Elysia on Bun) wrapping hextimator
- **Contrast validation:** Add WCAG 2.1 relative luminance calculations on top of existing OKLCH logic
- **CDN layer:** Generate CSS files on demand, cache at edge (Cloudflare Workers or similar)
- **Auth:** API keys, rate limiting per key
- **Infra:** Stateless compute — easy to scale horizontally. The only state is API keys and usage counters

### Build estimate

- **MVP (free tier + Pro):** 1-2 weeks
  - API wrapper, key management, rate limiting, docs site
- **CDN hosting + batch:** +1 week
- **Contrast validation:** +2-3 days (the OKLCH math is already there; need relative luminance and reporting)

### Risks and mitigations

| Risk | Mitigation |
|------|------------|
| "I can just use the npm package" | True for simple cases. The API sells convenience (no build step, hosted CSS, validation, versioning) and the contrast reporting that the raw package doesn't do |
| Low request volume per customer | Themes are generated infrequently (tenant onboarding, settings change). Pricing needs to reflect value, not volume — consider per-seat or flat tiers alongside usage |
| Competitors (Radix Colors API, etc.) | Differentiate on OKLCH perceptual uniformity and the contrast guarantee. Most competitors use HSL or fixed scales |

---

## 2. Figma Plugin

**One-liner:** Generate a perceptually uniform color scale from a single brand color, directly inside Figma.

### Value proposition

Designers spend hours manually building color scales — picking shades, checking contrast, adjusting for dark mode. Existing tools (Realtime Colors, Coolors) are external to the design workflow. A Figma plugin that lives where designers already work, generates a scale based on real color science (not HSL guessing), and outputs it as Figma styles or variables is an immediate time-saver.

### Target customers

- **Product designers** building or maintaining design systems
- **Freelancers and agencies** who spin up branded projects frequently
- **Design system teams** at mid-to-large companies

### Core features

| Feature | Description |
|---------|-------------|
| **One-click palette** | Select a color (or pick from canvas), generate a full scale with light/dark variants |
| **Live preview** | See the palette applied to a sample UI (card, button, form) inside the plugin panel |
| **Figma Variables output** | Create or update Figma color variables with proper naming (accent/default, accent/strong, etc.) |
| **Figma Styles output** | Alternatively, generate legacy color styles for teams not yet on variables |
| **Contrast badges** | Show AA/AAA pass/fail for each foreground-on-background pair |
| **Export to code** | Copy tokens as CSS vars, Tailwind config, or JSON from within the plugin |
| **Semantic colors** | Auto-detect or let the user assign positive/negative/warning roles; generate those scales too |

### Pricing model

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Generate palettes, preview, copy hex values |
| **Pro** | $8/year or $1.50/month | Figma Variables/Styles output, contrast checking, code export, batch generation |

Figma plugin marketplace handles payments. Low price point, high volume play. Conversion happens when designers want to push the palette into their actual Figma file (free tier only lets them look at it and copy manually).

### Technical scope

- **Plugin UI:** Preact or vanilla JS in an iframe (Figma plugin sandbox)
- **Core logic:** Bundle hextimator directly into the plugin (it's zero-dep, small enough)
- **Figma API:** Use `figma.variables` and `figma.createPaintStyle` APIs to write color variables/styles
- **Preview:** Render a small sample UI (card component) with the generated colors inside the plugin panel

### Build estimate

- **MVP (generate + preview + copy):** 1 day
  - This is the timeboxed version. Use Figma's plugin boilerplate, wire up hextimator, render swatches
- **Pro features (variables, contrast, export):** +2-3 days
- **Polish (sample UI preview, batch, onboarding):** +2 days

### Day-one timebox plan

The goal for the first day: a working plugin that you can open in Figma, pick a color, and see the generated palette with hex values you can copy.

1. **Hour 1-2:** Scaffold the plugin (Figma plugin template), get the dev loop working
2. **Hour 3-4:** Integrate hextimator, wire color input to palette output, render swatches in the plugin UI
3. **Hour 5-6:** Add a color picker (or read selected frame's fill color), copy-to-clipboard for individual values
4. **Hour 7-8:** Light/dark mode toggle, basic styling, test with a few colors, publish as private plugin for testing

### Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Crowded plugin space | Most palette plugins use HSL or are just Coolors wrappers. OKLCH perceptual uniformity is a genuine differentiator — lean into it in marketing ("your blue and yellow scales will actually look equally balanced") |
| Low willingness to pay for plugins | Keep the free tier useful enough to spread. Gate the Figma integration (variables/styles) — that's the part designers can't easily replicate |
| Figma Variables API is relatively new | It's stable as of 2024 and the direction Figma is pushing. Early plugins that support it well have an advantage |

---

## 3. Accessibility Theme Auditor

**One-liner:** Paste your existing theme tokens, get a full accessibility audit with auto-fixed alternatives that stay on-brand.

### Value proposition

WCAG compliance is a legal requirement in many jurisdictions (ADA, EAA in the EU from June 2025). Most teams discover contrast failures late — during QA or after an accessibility audit. Fixing them manually is tedious: adjust one color, break another pairing, lose brand consistency. The auditor automates this: it takes an existing set of theme tokens, identifies every contrast failure, and proposes OKLCH-corrected alternatives that preserve the original hue and brand feel.

### Target customers

- **Product teams** preparing for accessibility audits or compliance deadlines
- **Design system maintainers** who need to ensure their token sets meet contrast requirements
- **Agencies and consultants** doing accessibility remediation for clients
- **Enterprise compliance teams** (legal/procurement require WCAG AA or AAA)

### Core features

| Feature | Description |
|---------|-------------|
| **Token import** | Paste CSS vars, Tailwind config, SCSS vars, JSON tokens, or a raw color list |
| **Pair detection** | Automatically infer foreground/background pairings from naming conventions (or let user define them) |
| **WCAG audit** | Check every pair against AA (4.5:1 normal text, 3:1 large text) and AAA (7:1 / 4.5:1) |
| **Auto-fix** | For each failing pair, suggest a corrected color that meets the target ratio while minimizing perceptual distance from the original (using OKLCH lightness adjustment) |
| **Brand drift score** | Quantify how far each fix moves from the original color (Delta E in OKLab) so teams can make informed trade-offs |
| **Before/after preview** | Show the original and fixed palette side by side, applied to sample UI components |
| **Export** | Download the fixed token set in any format, or get a diff showing only what changed |
| **Report generation** | PDF/HTML audit report listing all pairs, their contrast ratios, pass/fail status, and applied fixes — useful for compliance documentation |

### Monetization options

This is the tricky one. The tool is genuinely useful but the audience expects accessibility tools to be free (or at least have strong free tiers). Here are viable approaches:

#### Option A: Freemium web app

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Audit up to 20 color pairs, see failures, get fix suggestions |
| **Pro** | $12/month | Unlimited pairs, auto-fix export, PDF reports, CI integration, team sharing |
| **Enterprise** | $49/month | SSO, audit history, compliance dashboard, API access |

The **PDF report** is the monetization lever. Compliance teams need documentation. The audit itself can be free; the exportable proof-of-compliance is what's worth paying for.

#### Option B: CI/CD integration (developer tooling angle)

Sell it as a GitHub Action or CLI tool that runs on every PR:

- Free: open-source CLI that flags contrast failures in CI
- Paid: hosted dashboard that tracks compliance over time, alerts on regressions, integrates with Jira/Linear for auto-creating tickets

This is the "Snyk for accessibility" model. Recurring revenue from teams that need ongoing compliance monitoring, not one-off audits.

Pricing: $19/month per repo (Pro), $99/month per org (Team).

#### Option C: Embed in the Theme API

Don't sell it separately. Make contrast validation and auto-fix a premium feature of the Theme API (product #1). Every theme generated by the API is guaranteed WCAG AA compliant. The auditor becomes a separate endpoint: `POST /audit` with existing tokens, get back a report + fixes.

This is the simplest path — no separate product to market, just a feature that increases the API's value.

**Recommended approach:** Start with **Option C** (bundle with Theme API) for immediate value, then spin out **Option A** (standalone web app) if there's organic demand. The web app doubles as marketing for the API.

### Technical scope

- **Contrast math:** WCAG 2.1 relative luminance from sRGB values — straightforward formula, not in hextimator today but easy to add
- **Auto-fix algorithm:** Given a failing pair, adjust the foreground's OKLCH lightness (binary search) until the contrast ratio meets the target, while keeping hue and chroma constant. Fall back to chroma reduction if lightness alone can't solve it. This builds directly on hextimator's existing gamut mapping
- **Pair inference:** Parse token names for patterns like `background`/`foreground`, `bg`/`text`, `surface`/`on-surface`, `*`/`*-foreground`. Let users override
- **Report generation:** HTML template rendered to PDF (Puppeteer or a lightweight lib like pdf-lib)
- **CI integration:** GitHub Action that runs the CLI, posts a PR comment with results

### Build estimate

- **Core audit engine (contrast check + auto-fix):** 3-4 days
- **Web app (import, preview, export):** 1 week
- **PDF reports:** 2-3 days
- **CI integration (GitHub Action):** 2-3 days
- **Full product (web app + CI + API endpoint):** 3-4 weeks

### Risks and mitigations

| Risk | Mitigation |
|------|------------|
| "I can check contrast in Chrome DevTools" | DevTools checks one pair at a time. The auditor checks your entire token set at once and fixes everything in bulk. The value is speed and completeness |
| Expectation that accessibility tools should be free | Keep the audit free. Monetize the output (reports, CI, export, history). Accessibility advocates will appreciate a free tool; compliance buyers will pay for the paper trail |
| Auto-fix changes look wrong to designers | Always show Delta E (perceptual distance) and let users set a max drift threshold. Offer multiple fix strategies (adjust foreground only, adjust background only, meet in the middle) |
| WCAG 3.0 / APCA may change contrast requirements | APCA is not yet a W3C recommendation. Build the engine to be algorithm-agnostic (pluggable contrast function). Support APCA as a toggle when it stabilizes — this becomes a feature, not a risk |

---

## Priority and sequencing

| Order | Product | Why this order |
|-------|---------|----------------|
| 1 | **Theme API** | Fastest to ship, clearest revenue model, validates demand for the core technology |
| 2 | **Figma Plugin** | Day-one MVP possible, different audience (designers vs. developers), builds brand awareness |
| 3 | **Accessibility Auditor** | Highest potential impact, but needs the most product work. Bundle MVP with Theme API first, spin out later if demand warrants |

All three products share the same core: hextimator's OKLCH palette engine. Keeping that open source feeds adoption into all three paid products.
