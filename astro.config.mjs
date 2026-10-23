import { defineConfig } from 'astro/config';

// Static output: the page is plain HTML/CSS with a little vanilla JS,
// so it deploys unchanged to Netlify or Cloudflare Pages.
export default defineConfig({
  site: 'https://wedding-venue-website.netlify.app',
});
