// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://cloudedpanther.github.io/snowballab',
  integrations: [react(), sitemap()],

  base: import.meta.env.PROD ? '/snowballlab/' : '/',
  trailingSlash: 'always',

  vite: {
    plugins: [tailwindcss()]
  }
});
