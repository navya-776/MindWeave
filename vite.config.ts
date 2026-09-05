import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    allowedHosts: [
      "mindweave-myba.onrender.com",
      ".onrender.com",
      ".vercel.app",
      "localhost",
    ],
  },
  preview: {
    allowedHosts: [
      "mindweave-myba.onrender.com",
      ".onrender.com",
      ".vercel.app",
      "localhost",
    ],
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
