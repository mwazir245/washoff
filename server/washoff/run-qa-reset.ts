import { createQaPrismaClient, printQaCredentials, resetQaDatabase, seedQaDatabase } from "./qa-environment";

const run = async () => {
  const prisma = createQaPrismaClient();

  try {
    await resetQaDatabase(prisma);
    await seedQaDatabase(prisma);
    process.stdout.write("WashOff QA reset completed successfully.\n");
    printQaCredentials();
  } finally {
    await prisma.$disconnect();
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : "QA reset failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
