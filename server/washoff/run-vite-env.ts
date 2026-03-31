import { spawn } from "node:child_process";
import path from "node:path";
import type { WashoffEnvironment } from "./environment.ts";

const resolveNpxInvocation = () => ({
  command: process.execPath,
  args: [path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")],
});

const environmentArg = (process.argv[2] ?? "dev").toLowerCase();
const environment: WashoffEnvironment =
  environmentArg === "qa" ? "qa" : environmentArg === "production" ? "production" : "dev";

const child = spawn(
  resolveNpxInvocation().command,
  [...resolveNpxInvocation().args, "vite", ...(environment === "qa" ? ["--mode", "qa"] : [])],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      WASHOFF_ENV: environment,
    },
  },
);

child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});

child.on("error", (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Failed to spawn Vite."}\n`);
  process.exitCode = 1;
});
