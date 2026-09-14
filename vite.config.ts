import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "/hettarkhala/",

  tanstackStart: {
    server: { entry: "server" },

    spa: {
      enabled: true,
    },
  },
});
