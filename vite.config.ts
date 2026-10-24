import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    // Preserve the existing production target without emulating Workers in dev.
    ...(command === "build"
      ? [
          nitro({
            preset: "cloudflare-module",
            compatibilityDate: "2026-10-23",
            cloudflare: {
              wrangler: {
                name: "kubernetes-academy",
              },
            },
          }),
        ]
      : []),
    react(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
  server: { host: "127.0.0.1", port: 8080 },
}));
