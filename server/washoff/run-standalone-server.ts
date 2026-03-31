import { startWashoffStandaloneServer } from "./standalone-server.ts";
import { resolveWashoffEnvironment } from "./environment.ts";

const run = async () => {
  const instance = await startWashoffStandaloneServer({
    environmentOverride: resolveWashoffEnvironment(),
  });

  const stop = async () => {
    await instance.stop();
    process.exitCode = 0;
  };

  process.on("SIGINT", () => {
    void stop();
  });

  process.on("SIGTERM", () => {
    void stop();
  });
};

run().catch((error) => {
  const message =
    error instanceof Error ? error.stack ?? error.message : "Unknown WashOff standalone server failure";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
