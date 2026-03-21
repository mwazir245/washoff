import fs from "node:fs";
import path from "node:path";

export type WashoffEnvironment = "dev" | "qa" | "production";

const initialProcessEnvSnapshot = new Map(Object.entries(process.env));

const stripWrappingQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const parseEnvFile = (filePath: string) => {
  const content = fs.readFileSync(filePath, "utf8");
  const entries = new Map<string, string>();

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());

    entries.set(key, value);
  }

  return entries;
};

const findCliFlagValue = (argv: string[], flagName: string) => {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === flagName) {
      return argv[index + 1];
    }

    if (argument.startsWith(`${flagName}=`)) {
      return argument.slice(flagName.length + 1);
    }
  }

  return undefined;
};

export const resolveWashoffEnvironment = ({
  argv = process.argv,
  env = process.env,
}: {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
} = {}): WashoffEnvironment => {
  const cliValue = findCliFlagValue(argv, "--washoff-env") ?? findCliFlagValue(argv, "--env");
  const rawValue = (cliValue ?? env.WASHOFF_ENV ?? "dev").trim().toLowerCase();

  if (rawValue === "qa") {
    return "qa";
  }

  if (rawValue === "production" || rawValue === "prod") {
    return "production";
  }

  return "dev";
};

export const loadWashoffEnvironment = ({
  environment = resolveWashoffEnvironment(),
  cwd = process.cwd(),
}: {
  environment?: WashoffEnvironment;
  cwd?: string;
} = {}) => {
  const candidatePaths = [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, ".env.local"),
    path.resolve(cwd, `.env.${environment}`),
    path.resolve(cwd, `.env.${environment}.local`),
  ];

  const mergedValues = new Map<string, string>();

  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) {
      continue;
    }

    for (const [key, value] of parseEnvFile(candidatePath).entries()) {
      mergedValues.set(key, value);
    }
  }

  for (const [key, value] of mergedValues.entries()) {
    process.env[key] = value;
  }

  for (const [key, value] of initialProcessEnvSnapshot.entries()) {
    process.env[key] = value;
  }

  process.env.WASHOFF_ENV = environment;

  return environment;
};

export const selectDatabaseUrlForEnvironment = (
  environment: WashoffEnvironment,
  env: NodeJS.ProcessEnv = process.env,
) => {
  if (environment === "qa") {
    return env.DATABASE_URL_QA?.trim() || env.DATABASE_URL?.trim();
  }

  return env.DATABASE_URL?.trim();
};

export const resolveDefaultDataFilePath = (
  environment: WashoffEnvironment,
  cwd = process.cwd(),
) => {
  const fileName =
    environment === "qa" ? "washoff-platform.qa.json" : "washoff-platform.json";

  return path.resolve(cwd, "data", fileName);
};

export const describeDatabaseTarget = (databaseUrl?: string) => {
  if (!databaseUrl) {
    return "not-configured";
  }

  try {
    const parsed = new URL(databaseUrl);
    const databaseName = parsed.pathname.replace(/^\//u, "") || "unknown";
    const schema = parsed.searchParams.get("schema");

    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || "5432"}/${databaseName}${
      schema ? `?schema=${schema}` : ""
    }`;
  } catch {
    return "unparseable-database-url";
  }
};

export const getDatabaseIsolationFingerprint = (databaseUrl?: string) => {
  if (!databaseUrl) {
    return "missing";
  }

  try {
    const parsed = new URL(databaseUrl);
    const databaseName = parsed.pathname.replace(/^\//u, "") || "";
    const schema = parsed.searchParams.get("schema") || "public";
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || "5432"}/${databaseName}?schema=${schema}`;
  } catch {
    return databaseUrl;
  }
};

