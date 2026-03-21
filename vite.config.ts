import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createWashoffApiVitePlugin } from "./server/washoff/vite-api-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isQaMode = mode === "qa";
  const configuredPort = Number(env.WASHOFF_WEB_PORT);

  return {
    server: {
      host: "::",
      port: Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : isQaMode ? 8081 : 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      createWashoffApiVitePlugin({
        environment: isQaMode ? "qa" : "dev",
      }),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
