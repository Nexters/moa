# Moa Landing

Static landing page (Astro + React)

## Core Rules

1. **Astro v5 only** - Never use v4 docs/patterns
2. **SSG only** - No server-side features (no SSR, no API routes)

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

## Styling

Uses shared design system:

```css
@import '@moa/shared/theme.css';
```

Color tokens:

- Background: `bg-bg-primary`, `bg-bg-secondary`
- Container: `bg-container-primary`, `bg-container-secondary`
- Text: `text-text-high`, `text-text-medium`, `text-text-low`
- Interactive: `hover:bg-interactive-hover`
- Accent (no semantic token): `text-green-40`, `hover:text-green-40`

Full token reference: `packages/shared/src/styles/theme.css`

## Version Management

```typescript
// Injected via Vite define in astro.config.mjs
declare const __APP_VERSION__: string;
export const APP_VERSION = __APP_VERSION__;

// Auto-generates GitHub Releases URL (version from apps/app/package.json)
export function getDownloadUrl(platform: Platform) {
  return `https://github.com/nexters/moa/releases/download/v${APP_VERSION}/...`;
}
```

## Deployment

| Item         | Value                         |
| ------------ | ----------------------------- |
| Site         | `https://nexters.github.io`   |
| Base path    | `/moa`                        |
| Build output | `dist/`                       |
| Deploy       | GitHub Actions (on main push) |

Static asset paths must include base path:

```html
<!-- Correct -->
<link rel="icon" href="/moa/favicon.svg" />

<!-- Incorrect -->
<link rel="icon" href="/favicon.svg" />
```
