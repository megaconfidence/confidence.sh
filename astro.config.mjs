// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import { rehypeStaticTweets } from './src/lib/rehype-static-tweets.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://confidence.sh',
  redirects: {
    '/blog/index.xml': '/rss.xml',
    '/index.xml': '/rss.xml',
  },
  integrations: [mdx(), sitemap()],
  session: {
    driver: 'cloudflare-kv-binding',
    options: {
      binding: 'SESSION',
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: 'cloudflare',
  }),
  markdown: {
    rehypePlugins: [rehypeStaticTweets],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
