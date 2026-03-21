import { createQaPrismaClient, printQaCredentials, seedQaDatabase } from "./qa-environment";

const run = async () => {
  const prisma = createQaPrismaClient();

  try {
    await seedQaDatabase(prisma);
    process.stdout.write("WashOff QA seed completed successfully.\n");
    printQaCredentials();
  } finally {
    await prisma.$disconnect();
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : "QA seed failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

