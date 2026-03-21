# WashOff QA Environment

This document describes the isolated QA environment for WashOff and how to run it safely without touching development data.

## Purpose

The QA environment is a dedicated manual-testing environment with:

- its own database target
- its own runtime ports
- its own optional file/mail outbox paths
- a controlled QA seed

Development remains on the existing `washoff` database. QA uses `washoff_qa`.

## Environment Files

Base development example:

- [D:\Codex\WashOff\.env.example](/D:/Codex/WashOff/.env.example)

QA example:

- [D:\Codex\WashOff\.env.qa.example](/D:/Codex/WashOff/.env.qa.example)

Local QA file used by this workspace:

- [D:\Codex\WashOff\.env.qa](/D:/Codex/WashOff/.env.qa)

Key QA settings:

- `WASHOFF_ENV=qa`
- `DATABASE_URL_QA=postgresql://postgres:postgres@localhost:5432/washoff_qa?schema=public`
- `WASHOFF_SERVER_PERSISTENCE_MODE=db`
- `WASHOFF_WEB_PORT=8081`
- `WASHOFF_SERVER_PORT=8788`
- `WASHOFF_MAIL_OUTBOX_PATH=data/mail-outbox-qa`
- `WASHOFF_FILE_DATA_PATH=data/washoff-platform.qa.json`

## Isolation Rules

QA isolation is enforced in several places:

- QA resolves its database URL from `DATABASE_URL_QA`
- Prisma client instances are cached by environment/database target, so QA does not reuse the dev connection
- QA scripts abort if the QA database target matches the dev database target
- QA uses separate file/mail outbox paths
- standalone QA server uses its own API port

Current database targets:

- Dev: `postgresql://localhost:5432/washoff?schema=public`
- QA: `postgresql://localhost:5432/washoff_qa?schema=public`

## Commands

Prepare QA database from scratch:

```powershell
npm run qa:prepare
```

This runs:

```powershell
npm run qa:db:create
npm run qa:migrate
npm run qa:seed
```

Reset QA data safely:

```powershell
npm run qa:reset
```

This truncates QA application tables and reseeds only the controlled QA records.

Run QA frontend dev environment:

```powershell
npm run dev:qa
```

Expected web URL:

- [http://localhost:8081](http://localhost:8081)

Run QA standalone API server:

```powershell
npm run server:qa
```

Expected API/health URL:

- [http://localhost:8788/health](http://localhost:8788/health)

Optional direct flag-based switching:

```powershell
npm run server:start -- --washoff-env=qa
tsx server/washoff/run-assignment-expiry-worker.ts --washoff-env=qa
```

## QA Seed Data

The QA seed is intentionally minimal and controlled:

- 1 active admin account
- 1 approved and active QA hotel account linked to 1 QA hotel
- 1 approved and active QA provider account linked to 1 QA provider
- 2 active services
- provider capability/capacity/performance rows needed for order testing

No random demo bulk data is seeded.

## QA Credentials

Current seeded credentials:

- Admin: `qa-admin@washoff.local` / `WashoffQA123!`
- Hotel: `qa-hotel@washoff.local` / `WashoffQA123!`
- Provider: `qa-provider@washoff.local` / `WashoffQA123!`

## Reset Behavior

`npm run qa:reset` clears QA operational data only. It truncates QA app tables, including:

- accounts and sessions
- identity audit events
- hotels and providers
- services and provider capabilities
- provider capacity and performance
- orders, assignments, matching logs, reassignment events
- SLA, settlements, notifications

It does not drop the schema and it does not touch the dev database.

## Startup Logging

QA startup logs now clearly print:

- environment
- persistence mode
- database target
- mail mode
- worker mode

Example values:

- `environment: qa`
- `persistenceMode: db`
- `databaseTarget: postgresql://localhost:5432/washoff_qa?schema=public`
- `mailMode: outbox`
- `workerMode: disabled`

## Verification Performed

The following were executed successfully after QA setup:

- `npm run qa:db:create`
- `npm run qa:migrate`
- `npm run qa:seed`
- `npm run qa:reset`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

QA health check was also validated through the standalone server at `/health`.

## Current Readiness

QA can now be used safely for manual testing without sharing development data, as long as QA is started with the QA scripts or `--washoff-env=qa`.
