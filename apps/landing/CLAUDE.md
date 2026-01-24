# CLAUDE.md

**Moa Landing**: Static landing page (Astro + React)

## Core Rules

1. **bun only** - Do not use `npm`/`pnpm`
2. **Korean responses** - Always respond in Korean
3. **Astro v5 only** - Never use v4 docs/patterns
4. **SSG only** - No server-side features

## Tech Stack

| Layer     | Technology            | Version            |
| --------- | --------------------- | ------------------ |
| Framework | Astro                 | v5.x               |
| UI        | React                 | v19.x              |
| Styling   | Tailwind CSS          | v4.x (Vite plugin) |
| Build     | Vite (Astro built-in) | -                  |

## Quick Reference

```bash
bun dev        # Dev server (localhost:4321)
bun build      # Static build (dist/)
bun preview    # Preview build output
```

## File Structure

```
apps/landing/
├── astro.config.mjs         # Astro config (GitHub Pages, Tailwind)
├── src/
│   ├── pages/
│   │   └── index.astro      # Main page (Astro component)
│   ├── features/
│   │   ├── app.tsx          # React components (Hero, Download, Footer)
│   │   └── app-version.ts   # Version utility, download URL generation
│   └── global.css           # Global styles (@moa/shared theme import)
└── public/                  # Static assets (favicon, etc.)
```

## Code Patterns

### Astro + React Integration

```astro
---
import { App } from "~/features/app";
import "../global.css";
---

<body>
  <App client:load />  <!-- Immediate hydration -->
</body>
```

**Client Directives**:

- `client:load`: Immediate hydration (full page interaction)
- `client:visible`: Hydrate on viewport entry (lazy load)
- `client:idle`: Hydrate on main thread idle

### Styling

Uses shared design system:

```css
/* global.css */
@import '@moa/shared/theme.css';
```

**Color token examples**:

- Background: `bg-bg-primary`, `bg-gray-80`
- Text: `text-text-high`, `text-text-medium`, `text-text-low`
- Accent: `text-green-40`, `hover:text-green-40`

### Version Management

```typescript
// Injected via Vite define in astro.config.mjs
declare const __APP_VERSION__: string;
export const APP_VERSION = __APP_VERSION__;

// Auto-generates GitHub Releases URL
export function getDownloadUrl(platform: Platform) {
  return `https://github.com/nexters/moa/releases/download/v${APP_VERSION}/...`;
}
```

Version is read from `apps/app/package.json`.

## Deployment Notes

| Item         | Value                         |
| ------------ | ----------------------------- |
| Site         | `https://nexters.github.io`   |
| Base path    | `/moa`                        |
| Build output | `dist/`                       |
| Deploy       | GitHub Actions (on main push) |

**Static asset paths**: Must include base path

```html
<!-- Correct -->
<link rel="icon" href="/moa/favicon.svg" />

<!-- Incorrect -->
<link rel="icon" href="/favicon.svg" />
```

## Parent Rules Reference

Common rules from root CLAUDE.md apply:

- bun only
- Korean responses
- Quality check after changes
