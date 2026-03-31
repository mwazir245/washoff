import { spawn } from "node:child_process";
import path from "node:path";
import { loadWashoffEnvironment, selectDatabaseUrlForEnvironment, type WashoffEnvironment } from "./environment.ts";

const resolveNpxInvocation = () => ({
  command: process.execPath,
  args: [path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")],
});
const buildChildProcessEnv = (overrides: Record<string, string>) =>
  Object.fromEntries(
    Object.entries({
      ...process.env,
      ...overrides,
    }).filter(([, value]) => value !== undefined),
  ) as NodeJS.ProcessEnv;

const environmentArg = (process.argv[2] ?? "dev").toLowerCase();
const environment: WashoffEnvironment =
  environmentArg === "qa" ? "qa" : environmentArg === "production" ? "production" : "dev";
const prismaArgs = process.argv.slice(3);

loadWashoffEnvironment({ environment });

const databaseUrl = selectDatabaseUrlForEnvironment(environment);

if (!databaseUrl) {
  throw new Error(`No database URL resolved for WashOff environment "${environment}".`);
}

const child = spawn(resolveNpxInvocation().command, [...resolveNpxInvocation().args, "prisma", ...prismaArgs], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: buildChildProcessEnv({
    WASHOFF_ENV: environment,
    DATABASE_URL: databaseUrl,
  }),
});

child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});

child.on("error", (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Failed to spawn Prisma."}\n`);
  process.exitCode = 1;
});
