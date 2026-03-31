import { createWashoffApiRuntime } from "./runtime.ts";

const referenceTime =
  process.argv.slice(2).find((argument) => !argument.startsWith("--")) || new Date().toISOString();

const run = async () => {
  const runtime = await createWashoffApiRuntime();
  const result = await runtime.expiryWorker.runOnce(referenceTime);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

run().catch((error) => {
  const message =
    error instanceof Error ? error.stack ?? error.message : "Unknown WashOff worker failure";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
