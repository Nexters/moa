import fs from 'node:fs';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Read app version from monorepo
const appPackageJson = JSON.parse(
  fs.readFileSync('../app/package.json', 'utf-8'),
);
const APP_VERSION = appPackageJson.version;

// https://astro.build/config
export default defineConfig({
  site: 'https://nexters.github.io',
  base: '/moa',
  vite: {
    plugins: [tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION),
    },
  },
  integrations: [react()],
});
