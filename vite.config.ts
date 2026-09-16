import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Only set when building for GitHub Pages (see .github/workflows/deploy.yml).
// Lovable's own preview/publish keep the site at the root path.
const pagesBase = process.env["GITHUB_PAGES_BASE"];

export default defineConfig({
  vite: pagesBase ? { base: pagesBase } : {},
  tanstackStart: {
    server: { entry: "server" },

    spa: {
      enabled: true,
    },
  },
});
