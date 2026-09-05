import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
