# WashOff Worker and Auth Boundary

## What Phase 12 adds

Phase 12 moves WashOff closer to production readiness by adding:

- a dedicated background expiry/reassignment worker path
- a role-aware API protection layer
- clearer separation between request handling, background processing, and business rules

## Background expiry processing

New worker modules:

- `server/washoff/assignment-expiry-worker.ts`
- `server/washoff/run-assignment-expiry-worker.ts`

### How it works

The worker:

1. reads current persisted orders
2. identifies orders whose active assignment is:
   - `assigned`
   - `pending_acceptance`
   - past `responseDueAt`
3. invokes the existing application/repository expiry sweep path
4. returns a summary of:
   - scanned orders
   - expired candidates
   - reassigned orders
   - unresolved orders

### Development usage

One-off worker run:

```powershell
npm run worker:expiry:once
```

Optional explicit reference time:

```powershell
npm run worker:expiry:once -- 2026-03-19T12:00:00.000Z
```

Optional dev auto-loop in the Vite API runtime:

- `WASHOFF_ENABLE_WORKER=true`
- `WASHOFF_WORKER_POLL_INTERVAL_MS=30000`

When enabled, the dev API server starts a single-process interval loop that triggers the expiry worker in the background.

### Production direction

In production, this worker should run as:

- a scheduled job
- a dedicated worker process
- or a queue/cron consumer

Request-time reads should not be the primary expiry trigger in production.

## Auth and role boundary

New auth module:

- `server/washoff/auth.ts`

### Current approach

This phase introduces a development-friendly auth scaffold at the API boundary.

Current caller identification uses request headers:

- `x-washoff-role: hotel | provider | admin`
- `x-washoff-entity-id: <hotel-id | provider-id>`

Internal worker/admin automation can also use:

- `x-washoff-internal-key`

Current auth mode:

- `WASHOFF_AUTH_MODE=dev-header`

This is not final production authentication. It is intentional scaffolding that establishes:

- caller resolution
- route authorization
- entity scoping rules

without pushing auth concerns into domain/application logic.

### Role protection rules

- hotel routes require `hotel` or `admin`
- provider action routes require `provider` or `admin`
- admin dashboard and broad platform reads require `admin`
- worker/admin operational routes require `worker` or `admin`

Scoped access rules:

- hotel callers cannot request another hotel's data
- provider callers cannot act as another provider
- admin can access all scoped routes

## Request-time sweep behavior

For DB mode:

- request-time expiry sweep is now disabled by default
- enable it only with `WASHOFF_ENABLE_REQUEST_TIME_SWEEP=true`

This keeps the worker path as the preferred real backend mechanism.

For preview/file mode:

- legacy compatibility remains available

## Current operational safety

Today the system has:

- repository-level in-process command serialization
- transaction boundaries around row-level DB commands
- worker in-process overlap protection (`runOnce` skips if a previous run is still active)

## What is still not fully production-ready

- no distributed locking yet for multi-instance worker execution
- no queue-backed retry model yet
- no production auth provider / session / JWT integration yet
- no secrets rotation or full identity lifecycle yet
- no background notification delivery worker yet

## Recommended Phase 13

Phase 13 should focus on production hardening:

- distributed job locking / queue-backed worker model
- real auth provider integration
- role-aware session/token lifecycle
- observability for worker executions and assignment failures
- notification delivery pipeline
