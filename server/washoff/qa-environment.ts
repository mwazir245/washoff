import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  AccountActivationState,
  AccountRole,
  AccountStatus,
  LinkedEntityType,
  PasswordResetState,
} from "../../src/features/auth/model";
import { createPasswordDigest } from "../../src/features/auth/lib/credentials";
import {
  OnboardingStatus,
  ProviderCapacityStatus,
  ServiceBillingUnit,
  ServiceCategory,
} from "../../src/features/orders/model";
import {
  getDatabaseIsolationFingerprint,
  loadWashoffEnvironment,
  resolveWashoffEnvironment,
  selectDatabaseUrlForEnvironment,
} from "./environment";

const resolveNpxInvocation = () => ({
  command: process.execPath,
  args: [path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")],
});

const buildChildProcessEnv = (overrides: Record<string, string>) => {
  return Object.fromEntries(
    Object.entries({
      ...process.env,
      ...overrides,
    }).filter(([, value]) => value !== undefined),
  ) as NodeJS.ProcessEnv;
};

export const QA_CREDENTIALS = {
  admin: {
    email: "qa-admin@washoff.local",
    password: "WashoffQA123!",
    fullName: "مدير QA لمنصة WashOff",
  },
  hotel: {
    email: "qa-hotel@washoff.local",
    password: "WashoffQA123!",
    fullName: "مشرف فندق QA",
  },
  provider: {
    email: "qa-provider@washoff.local",
    password: "WashoffQA123!",
    fullName: "مشرف مزود QA",
  },
} as const;

const QA_IDS = {
  adminAccount: "account-admin-qa-1",
  hotelAccount: "account-hotel-qa-1",
  providerAccount: "account-provider-qa-1",
  hotel: "hotel-qa-1",
  provider: "provider-qa-1",
} as const;

const qaSeedServices = [
  {
    id: "wash_fold",
    code: "wash_fold",
    nameAr: "غسيل وطي",
    descriptionAr: "خدمة غسيل وطي مخصصة لبيئة QA.",
    category: ServiceCategory.Laundry,
    billingUnit: ServiceBillingUnit.Kilogram,
    defaultUnitPriceSar: 14,
    defaultTurnaroundHours: 24,
    supportsRush: true,
  },
  {
    id: "iron",
    code: "iron",
    nameAr: "كي",
    descriptionAr: "خدمة كي مخصصة لبيئة QA.",
    category: ServiceCategory.Laundry,
    billingUnit: ServiceBillingUnit.Kilogram,
    defaultUnitPriceSar: 8,
    defaultTurnaroundHours: 12,
    supportsRush: false,
  },
] as const;

const createPasswordFields = async (password: string) => {
  const digest = await createPasswordDigest(password);

  return {
    passwordSalt: digest.salt,
    passwordHash: digest.hash,
  };
};

const getQaContext = () => {
  const environment = loadWashoffEnvironment({ environment: resolveWashoffEnvironment({ env: { ...process.env, WASHOFF_ENV: "qa" } }) });
  const qaDatabaseUrl = selectDatabaseUrlForEnvironment("qa");
  const devDatabaseUrl = selectDatabaseUrlForEnvironment("dev");

  if (!qaDatabaseUrl) {
    throw new Error("لم يتم العثور على DATABASE_URL_QA أو DATABASE_URL خاص ببيئة QA.");
  }

  if (
    devDatabaseUrl &&
    getDatabaseIsolationFingerprint(qaDatabaseUrl) === getDatabaseIsolationFingerprint(devDatabaseUrl)
  ) {
    throw new Error("قاعدة QA تشير إلى نفس هدف قاعدة التطوير. أوقف العملية وعدّل DATABASE_URL_QA أولًا.");
  }

  return {
    environment,
    qaDatabaseUrl,
    devDatabaseUrl,
  };
};

export const createQaPrismaClient = () => {
  const { qaDatabaseUrl } = getQaContext();

  return new PrismaClient({
    datasources: {
      db: {
        url: qaDatabaseUrl,
      },
    },
  });
};

export const ensureQaDatabaseExists = () => {
  const { qaDatabaseUrl, devDatabaseUrl } = getQaContext();
  const parsedQaUrl = new URL(qaDatabaseUrl);
  const qaDatabaseName = parsedQaUrl.pathname.replace(/^\//u, "");
  const qaSchema = parsedQaUrl.searchParams.get("schema") || "public";

  if (!qaDatabaseName) {
    throw new Error("تعذر تحديد اسم قاعدة بيانات QA من DATABASE_URL_QA.");
  }

  const parsedAdminUrl = new URL(qaDatabaseUrl);
  parsedAdminUrl.pathname = "/postgres";
  parsedAdminUrl.searchParams.delete("schema");

  const sql =
    devDatabaseUrl && new URL(devDatabaseUrl).pathname.replace(/^\//u, "") === qaDatabaseName
      ? `CREATE SCHEMA IF NOT EXISTS "${qaSchema}";`
      : `CREATE DATABASE "${qaDatabaseName}";`;

  const result = spawnSync(
    resolveNpxInvocation().command,
    [...resolveNpxInvocation().args, "prisma", "db", "execute", "--stdin", "--url", parsedAdminUrl.toString()],
    {
      cwd: process.cwd(),
      env: buildChildProcessEnv({
        WASHOFF_ENV: "qa",
      }),
      input: sql,
      encoding: "utf8",
    },
  );

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (result.status !== 0 && !/already exists|already exists|duplicate/i.test(output)) {
    throw new Error(output.trim() || `تعذر إنشاء قاعدة/مخطط QA عبر SQL: ${sql}`);
  }

  return {
    qaDatabaseUrl,
    qaDatabaseName,
    qaSchema,
  };
};

export const runPrismaForQa = (prismaArgs: string[]) => {
  const { qaDatabaseUrl } = getQaContext();
  const result = spawnSync(resolveNpxInvocation().command, [...resolveNpxInvocation().args, "prisma", ...prismaArgs], {
    cwd: process.cwd(),
    env: buildChildProcessEnv({
      WASHOFF_ENV: "qa",
      DATABASE_URL: qaDatabaseUrl,
    }),
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`فشل تنفيذ Prisma لبيئة QA: prisma ${prismaArgs.join(" ")}`);
  }
};

const appTableNames = [
  "notifications",
  "settlement_line_items",
  "settlements",
  "sla_history",
  "reassignment_events",
  "matching_logs",
  "assignment_history",
  "assignments",
  "order_items",
  "orders",
  "provider_performance_stats",
  "provider_capacity",
  "provider_capabilities",
  "providers",
  "services",
  "hotels",
  "identity_audit_events",
  "account_sessions",
  "accounts",
] as const;

export const resetQaDatabase = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${appTableNames.map((tableName) => `"${tableName}"`).join(", ")} RESTART IDENTITY CASCADE;`,
  );
};

export const seedQaDatabase = async (prisma: PrismaClient) => {
  const timestamp = new Date().toISOString();
  const today = timestamp.slice(0, 10);
  const adminPassword = await createPasswordFields(QA_CREDENTIALS.admin.password);
  const hotelPassword = await createPasswordFields(QA_CREDENTIALS.hotel.password);
  const providerPassword = await createPasswordFields(QA_CREDENTIALS.provider.password);

  await prisma.$transaction(async (tx) => {
    for (const service of qaSeedServices) {
      await tx.service.upsert({
        where: {
          id: service.id,
        },
        create: {
          id: service.id,
          code: service.code,
          nameAr: service.nameAr,
          descriptionAr: service.descriptionAr,
          category: service.category,
          billingUnit: service.billingUnit,
          defaultUnitPriceSar: service.defaultUnitPriceSar,
          defaultTurnaroundHours: service.defaultTurnaroundHours,
          supportsRush: service.supportsRush,
          active: true,
        },
        update: {
          code: service.code,
          nameAr: service.nameAr,
          descriptionAr: service.descriptionAr,
          category: service.category,
          billingUnit: service.billingUnit,
          defaultUnitPriceSar: service.defaultUnitPriceSar,
          defaultTurnaroundHours: service.defaultTurnaroundHours,
          supportsRush: service.supportsRush,
          active: true,
        },
      });
    }

    await tx.hotel.upsert({
      where: { id: QA_IDS.hotel },
      create: {
        id: QA_IDS.hotel,
        code: "HTL-QA-001",
        displayNameAr: "فندق WashOff QA",
        countryCode: "SA",
        city: "الرياض",
        timezone: "Asia/Riyadh",
        contactName: "منسق اختبار الفندق",
        contactPhone: "0501112222",
        contactEmail: QA_CREDENTIALS.hotel.email,
        contractedServiceIdsJson: ["wash_fold", "iron"],
        active: true,
        notesAr: "فندق مخصص لاختبارات QA اليدوية.",
        onboardingStatus: OnboardingStatus.Approved,
        submittedAt: new Date(timestamp),
        reviewedAt: new Date(timestamp),
        reviewedByRole: "admin",
        reviewedById: QA_IDS.adminAccount,
        reviewNotesAr: "تم اعتماد كيان QA مسبقًا.",
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
      },
      update: {
        displayNameAr: "فندق WashOff QA",
        city: "الرياض",
        timezone: "Asia/Riyadh",
        contactName: "منسق اختبار الفندق",
        contactPhone: "0501112222",
        contactEmail: QA_CREDENTIALS.hotel.email,
        contractedServiceIdsJson: ["wash_fold", "iron"],
        active: true,
        notesAr: "فندق مخصص لاختبارات QA اليدوية.",
        onboardingStatus: OnboardingStatus.Approved,
        submittedAt: new Date(timestamp),
        reviewedAt: new Date(timestamp),
        reviewedByRole: "admin",
        reviewedById: QA_IDS.adminAccount,
        reviewNotesAr: "تم اعتماد كيان QA مسبقًا.",
        updatedAt: new Date(timestamp),
      },
    });

    await tx.provider.upsert({
      where: { id: QA_IDS.provider },
      create: {
        id: QA_IDS.provider,
        code: "PRV-QA-001",
        legalNameAr: "مغسلة WashOff QA",
        displayNameAr: "مزود WashOff QA",
        countryCode: "SA",
        city: "الرياض",
        timezone: "Asia/Riyadh",
        contactName: "منسق اختبار المزود",
        contactPhone: "0551112222",
        contactEmail: QA_CREDENTIALS.provider.email,
        serviceAreaCitiesJson: ["الرياض"],
        active: true,
        notesAr: "مزود مخصص لاختبارات QA اليدوية.",
        onboardingStatus: OnboardingStatus.Approved,
        submittedAt: new Date(timestamp),
        reviewedAt: new Date(timestamp),
        reviewedByRole: "admin",
        reviewedById: QA_IDS.adminAccount,
        reviewNotesAr: "تم اعتماد كيان QA مسبقًا.",
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
      },
      update: {
        legalNameAr: "مغسلة WashOff QA",
        displayNameAr: "مزود WashOff QA",
        city: "الرياض",
        timezone: "Asia/Riyadh",
        contactName: "منسق اختبار المزود",
        contactPhone: "0551112222",
        contactEmail: QA_CREDENTIALS.provider.email,
        serviceAreaCitiesJson: ["الرياض"],
        active: true,
        notesAr: "مزود مخصص لاختبارات QA اليدوية.",
        onboardingStatus: OnboardingStatus.Approved,
        submittedAt: new Date(timestamp),
        reviewedAt: new Date(timestamp),
        reviewedByRole: "admin",
        reviewedById: QA_IDS.adminAccount,
        reviewNotesAr: "تم اعتماد كيان QA مسبقًا.",
        updatedAt: new Date(timestamp),
      },
    });

    for (const service of qaSeedServices) {
      await tx.providerCapability.upsert({
        where: {
          providerId_serviceId: {
            providerId: QA_IDS.provider,
            serviceId: service.id,
          },
        },
        create: {
          providerId: QA_IDS.provider,
          serviceId: service.id,
          serviceNameAr: service.nameAr,
          active: true,
          unitPriceSar: service.defaultUnitPriceSar,
          maxDailyKg: 250,
          maxSingleOrderKg: 120,
          rushSupported: service.supportsRush,
          supportedCityCodesJson: ["الرياض"],
          defaultTurnaroundHours: service.defaultTurnaroundHours,
          minimumPickupLeadHours: 2,
          pickupWindowStartHour: 8,
          pickupWindowEndHour: 22,
        },
        update: {
          serviceNameAr: service.nameAr,
          active: true,
          unitPriceSar: service.defaultUnitPriceSar,
          maxDailyKg: 250,
          maxSingleOrderKg: 120,
          rushSupported: service.supportsRush,
          supportedCityCodesJson: ["الرياض"],
          defaultTurnaroundHours: service.defaultTurnaroundHours,
          minimumPickupLeadHours: 2,
          pickupWindowStartHour: 8,
          pickupWindowEndHour: 22,
        },
      });
    }

    await tx.providerCapacity.upsert({
      where: {
        providerId_capacityDate: {
          providerId: QA_IDS.provider,
          capacityDate: today,
        },
      },
      create: {
        providerId: QA_IDS.provider,
        capacityDate: today,
        totalKg: 250,
        committedKg: 0,
        reservedKg: 0,
        availableKg: 250,
        utilizationRatio: 0,
        status: ProviderCapacityStatus.Available,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
      },
      update: {
        totalKg: 250,
        committedKg: 0,
        reservedKg: 0,
        availableKg: 250,
        utilizationRatio: 0,
        status: ProviderCapacityStatus.Available,
        updatedAt: new Date(timestamp),
      },
    });

    await tx.providerPerformanceStats.upsert({
      where: { providerId: QA_IDS.provider },
      create: {
        providerId: QA_IDS.provider,
        rating: 4.8,
        acceptanceRate: 0.96,
        onTimePickupRate: 0.97,
        onTimeDeliveryRate: 0.98,
        qualityScore: 94,
        disputeRate: 0.01,
        reassignmentRate: 0.03,
        completedOrders: 0,
        cancelledOrders: 0,
        lastEvaluatedAt: new Date(timestamp),
      },
      update: {
        rating: 4.8,
        acceptanceRate: 0.96,
        onTimePickupRate: 0.97,
        onTimeDeliveryRate: 0.98,
        qualityScore: 94,
        disputeRate: 0.01,
        reassignmentRate: 0.03,
        lastEvaluatedAt: new Date(timestamp),
      },
    });

    await tx.account.upsert({
      where: { id: QA_IDS.adminAccount },
      create: {
        id: QA_IDS.adminAccount,
        fullName: QA_CREDENTIALS.admin.fullName,
        email: QA_CREDENTIALS.admin.email,
        role: AccountRole.Admin,
        status: AccountStatus.Active,
        linkedEntityType: LinkedEntityType.Admin,
        activationState: AccountActivationState.Activated,
        activatedAt: new Date(timestamp),
        passwordResetState: PasswordResetState.Idle,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
        ...adminPassword,
      },
      update: {
        fullName: QA_CREDENTIALS.admin.fullName,
        email: QA_CREDENTIALS.admin.email,
        role: AccountRole.Admin,
        status: AccountStatus.Active,
        linkedEntityType: LinkedEntityType.Admin,
        linkedHotelId: null,
        linkedProviderId: null,
        activationState: AccountActivationState.Activated,
        activatedAt: new Date(timestamp),
        passwordResetState: PasswordResetState.Idle,
        updatedAt: new Date(timestamp),
        ...adminPassword,
      },
    });

    await tx.account.upsert({
      where: { id: QA_IDS.hotelAccount },
      create: {
        id: QA_IDS.hotelAccount,
        fullName: QA_CREDENTIALS.hotel.fullName,
        email: QA_CREDENTIALS.hotel.email,
        phone: "0501112222",
        role: AccountRole.Hotel,
        status: AccountStatus.Active,
        linkedEntityType: LinkedEntityType.Hotel,
        linkedHotelId: QA_IDS.hotel,
        activationState: AccountActivationState.Activated,
        activationEligibleAt: new Date(timestamp),
        activatedAt: new Date(timestamp),
        passwordResetState: PasswordResetState.Idle,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
        ...hotelPassword,
      },
      update: {
        fullName: QA_CREDENTIALS.hotel.fullName,
        email: QA_CREDENTIALS.hotel.email,
        phone: "0501112222",
        role: AccountRole.Hotel,
        status: AccountStatus.Active,
        linkedEntityType: LinkedEntityType.Hotel,
        linkedHotelId: QA_IDS.hotel,
        linkedProviderId: null,
        activationState: AccountActivationState.Activated,
        activationEligibleAt: new Date(timestamp),
        activatedAt: new Date(timestamp),
        passwordResetState: PasswordResetState.Idle,
        updatedAt: new Date(timestamp),
        ...hotelPassword,
      },
    });

    await tx.account.upsert({
      where: { id: QA_IDS.providerAccount },
      create: {
        id: QA_IDS.providerAccount,
        fullName: QA_CREDENTIALS.provider.fullName,
        email: QA_CREDENTIALS.provider.email,
        phone: "0551112222",
        role: AccountRole.Provider,
        status: AccountStatus.Active,
        linkedEntityType: LinkedEntityType.Provider,
        linkedProviderId: QA_IDS.provider,
        activationState: AccountActivationState.Activated,
        activationEligibleAt: new Date(timestamp),
        activatedAt: new Date(timestamp),
        passwordResetState: PasswordResetState.Idle,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
        ...providerPassword,
      },
      update: {
        fullName: QA_CREDENTIALS.provider.fullName,
        email: QA_CREDENTIALS.provider.email,
        phone: "0551112222",
        role: AccountRole.Provider,
        status: AccountStatus.Active,
        linkedEntityType: LinkedEntityType.Provider,
        linkedHotelId: null,
        linkedProviderId: QA_IDS.provider,
        activationState: AccountActivationState.Activated,
        activationEligibleAt: new Date(timestamp),
        activatedAt: new Date(timestamp),
        passwordResetState: PasswordResetState.Idle,
        updatedAt: new Date(timestamp),
        ...providerPassword,
      },
    });
  });

  return {
    credentials: QA_CREDENTIALS,
  };
};

export const printQaCredentials = () => {
  process.stdout.write(
    [
      "WashOff QA credentials",
      `ADMIN_EMAIL=${QA_CREDENTIALS.admin.email}`,
      `ADMIN_PASSWORD=${QA_CREDENTIALS.admin.password}`,
      `HOTEL_EMAIL=${QA_CREDENTIALS.hotel.email}`,
      `HOTEL_PASSWORD=${QA_CREDENTIALS.hotel.password}`,
      `PROVIDER_EMAIL=${QA_CREDENTIALS.provider.email}`,
      `PROVIDER_PASSWORD=${QA_CREDENTIALS.provider.password}`,
    ].join("\n") + "\n",
  );
};
