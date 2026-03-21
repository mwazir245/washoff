# WashOff Backend Foundation

## Purpose
This phase introduces backend-ready boundaries without replacing the current preview flow.

For the first thin executable backend/API slice built on top of these boundaries, see `docs/BACKEND_API_SLICE.md`.

The app still runs on the in-memory preview repository today, but the frontend now talks to an application service boundary that can later be backed by:

- a real HTTP API
- a server-side application service
- a database-backed repository

## Proposed structure

### Domain
Existing domain models stay in `src/features/orders/model`.

### Application
New application layer lives in `src/features/orders/application`:

- `contracts/`
  request/response DTOs and dashboard payload contracts
- `ports/`
  repository interfaces for query/command boundaries
- `services/`
  application services and use-case orchestration
- `index.ts`
  composition root for the active repository/service

### Infrastructure
New infrastructure layer lives in `src/features/orders/infrastructure`:

- `adapters/preview-platform-repository.ts`
  adapter from the current preview store to the repository interface
- `persistence/persistence-records.ts`
  database-oriented record shapes
- `persistence/persistence-mappers.ts`
  domain-to-record mapping helpers

## Current repository abstraction strategy

Today:

- hooks call `getWashoffPlatformService()`
- the application service uses `WashoffPlatformRepository`
- the active repository is `createPreviewWashoffPlatformRepository()`

Later:

- create an API-backed repository implementation
- call `configureWashoffPlatformRepository(...)`
- keep hooks and pages unchanged

This gives us a safe migration path from:

- preview/in-memory repository

to:

- real backend/API/data source

without rewriting dashboard or workflow hooks.

## Persistence approach

The persistence layer is intentionally relational-first with JSON fields where that reduces complexity.

Recommended storage split:

- normalized tables for:
  hotels, providers, provider capabilities, provider capacity, provider performance, orders, order items, assignments, assignment history, reassignment events, SLA history, settlements, settlement line items, notifications
- JSON/JSONB columns for:
  snapshots, SLA window payloads, score breakdowns, eligibility results

This keeps matching and assignment details auditable without prematurely over-normalizing scoring structures.

Note:

- the current preview domain keeps the active assignment in full detail
- previous attempts are represented reliably in `assignmentHistory`
- full historical `assignments` rows should become first-class persisted records once backend command handlers are introduced

## Timeout and worker processing

Preview mode still expires assignments lazily through the in-memory repository.

For a real backend, timeout expiry should move to:

- a scheduled worker
- or a queue-based delayed job

Recommended future responsibilities:

- detect overdue pending assignments
- mark attempts expired
- trigger auto reassignment
- record KPI-impacting events
- emit notifications

## What remains before real execution

- real API handlers and auth
- persistent database connection and migrations
- transaction-safe command handlers
- background worker for expiry/reassignment
- notification delivery integrations
- real telemetry for matching duration instead of preview heuristics

## Product direction guardrails

- hotels still do not choose providers manually
- assignment remains system-driven
- matching/reassignment logic stays reusable at the domain/application layer
