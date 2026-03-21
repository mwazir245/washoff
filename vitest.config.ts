import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          globals: true,
          name: "client",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          globals: true,
          name: "server",
          environment: "node",
          include: ["server/**/*.{test,spec}.ts"],
        },
      },
    ],
  },
});
