import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/k8s-visual-ops-lab/",
  plugins: [react()],
});