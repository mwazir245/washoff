import { ensureQaDatabaseExists } from "./qa-environment";

try {
  const result = ensureQaDatabaseExists();
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        environment: "qa",
        databaseName: result.qaDatabaseName,
        schema: result.qaSchema,
        databaseUrl: result.qaDatabaseUrl,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : "Failed to create QA database.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

