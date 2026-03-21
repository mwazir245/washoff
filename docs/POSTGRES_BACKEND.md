# WashOff PostgreSQL Backend

## Chosen approach

Phase 11 keeps:

- PostgreSQL-ready persistence
- Prisma schema + Prisma Client
- existing `/api/platform` routes
- existing application service boundary

The key change in this phase is that the core orchestration path no longer depends on full snapshot replacement persistence.

## Setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL`
3. Install dependencies
4. Generate Prisma Client
5. Run migrations
6. Start the app in API mode

PowerShell example:

```powershell
npm install
npm run prisma:generate
npm run prisma:migrate:dev
$env:VITE_WASHOFF_DATA_SOURCE='api'
$env:WASHOFF_SERVER_PERSISTENCE_MODE='db'
npm run dev
```

## Active repository mode

Client/runtime split:

- client `preview` vs `api` is selected in `src/features/orders/application/index.ts`
- server persistence `file` vs `db` is selected in `server/washoff/config.ts`

Relevant env vars:

- `VITE_WASHOFF_DATA_SOURCE=api|preview`
- `VITE_WASHOFF_API_BASE_URL=...`
- `WASHOFF_SERVER_PERSISTENCE_MODE=db|file`
- `DATABASE_URL=postgresql://...`
- `WASHOFF_FILE_DATA_PATH=...`

Default behavior:

- development client defaults to `api`
- non-development client defaults to `preview`
- server defaults to `db` if `DATABASE_URL` exists, otherwise `file`

## What is database-backed now

When `WASHOFF_SERVER_PERSISTENCE_MODE=db`:

- hotels
- services
- providers
- provider capabilities
- provider capacity
- provider performance stats
- orders
- order items
- assignments
- assignment history
- matching logs
- reassignment events
- SLA history
- settlements
- notifications schema structure

## What is row-level now

The following operations now use direct row-level Prisma reads/writes:

- `createHotelOrder`
  - inserts `orders`
  - inserts `order_items`
  - inserts `matching_logs`
  - inserts the initial `assignments` row when a provider is found
  - inserts `assignment_history`
  - updates `provider_capacity`
  - updates `orders` to `assigned` or `pending_capacity`
- `acceptIncomingOrder`
  - updates the active `assignments` row
  - inserts `assignment_history`
  - updates `provider_capacity`
  - updates `orders` to `accepted`
- `rejectIncomingOrder`
  - updates the previous `assignments` row
  - inserts `assignment_history`
  - inserts retry `matching_logs`
  - inserts `reassignment_events`
  - inserts a new `assignments` row when fallback succeeds
  - updates `provider_capacity`
  - updates `provider_performance_stats`
  - updates `orders` to `assigned` again or `pending_capacity`
- `expirePendingAssignment`
  - same row-level path as rejection, but with timeout reason and timeout penalty
- `autoReassignOrder`
  - same row-level path as rejection/expiry when triggered explicitly
- dashboard/query reads
  - read hotels, providers, capacities, orders, assignments, histories, matching logs, reassignment events, SLA rows, and settlements directly from persisted rows

## Migration files

- Prisma schema: `prisma/schema.prisma`
- Initial migration: `prisma/migrations/202603190001_init/migration.sql`

No new migration was required for Phase 11 because the Phase 10 schema already covered the row-level entities needed for the core orchestration path.

## What is still transitional

Some infrastructure remains intentionally transitional:

- initial seeding of an empty database still uses the snapshot bootstrap path once
- preview mode remains available
- file mode remains available
- notifications are still schema-ready but not part of a real delivery pipeline
- settlement and SLA writes are not yet part of the new direct command flow because the core orchestration path does not mutate them yet
- timeout processing still runs on request-time sweep logic rather than a dedicated worker

## Current implementation shape

Core orchestration is now row-level and transaction-based.

Business rules still stay outside the persistence layer:

- matching uses the existing matching engine
- reassignment still reuses stored ranked matching results
- the repository stores and retrieves rows directly instead of replacing the full platform snapshot

## What still remains before full production readiness

- dedicated worker/cron process for timeout expiry and reassignment
- auth and role-aware API protection
- stronger observability/telemetry
- notification delivery integrations
- finer-grained locking/concurrency strategy for multi-instance deployment
- row-level writes for secondary workflows such as notifications and richer settlement lifecycle changes

## Recommended Phase 12

Phase 12 should add background processing and security boundaries:

- move expiry/reassignment from request-time sweep logic into a worker/cron path
- add auth and role-aware API protection
- add stronger concurrency/locking strategy for multi-instance operation
- expand row-level persistence to secondary workflows such as notifications and fuller settlement updates
