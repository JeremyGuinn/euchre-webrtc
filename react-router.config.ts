import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Set to false for SPA mode on GitHub Pages
  ssr: false,
  // Enable prerendering for better SEO and performance
  prerender: ["/"],
  basename: process.env.PUBLIC_URL || "/",
} satisfies Config;
