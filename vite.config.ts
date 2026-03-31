import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { pathToFileURL } from "node:url";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isQaMode = mode === "qa";
  const configuredPort = Number(env.WASHOFF_WEB_PORT);
  const plugins = [react(), mode === "development" && componentTagger()].filter(Boolean);

  if (command === "serve") {
    const pluginModuleUrl = pathToFileURL(
      path.resolve(__dirname, "./server/washoff/vite-api-plugin.ts"),
    ).href;
    const { createWashoffApiVitePlugin } = await import(pluginModuleUrl);

    plugins.splice(
      1,
      0,
      createWashoffApiVitePlugin({
        environment: isQaMode ? "qa" : "dev",
      }),
    );
  }

  return {
    server: {
      host: "::",
      port: Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : isQaMode ? 8081 : 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      ...plugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
