import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://nexters.github.io',
  base: '/moa',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});
