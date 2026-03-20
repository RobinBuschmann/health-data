import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  envDir: __dirname,
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 3001,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/testSetup.ts"],
    isolate: false,
    maxWorkers: 1,
    server: {
      deps: {
        inline: [
          "react-dom",
          "@mui/material",
          "@mui/x-charts",
          "@emotion/react",
          "@emotion/styled",
        ],
      },
    },
  },
});
