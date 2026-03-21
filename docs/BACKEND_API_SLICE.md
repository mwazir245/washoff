# WashOff Phase 9 Backend/API Slice

## What is now truly backend/API-backed

Phase 9 adds a thin same-origin API at `/api/platform` during `vite dev`.

For the PostgreSQL-ready persistence path added in Phase 10, see `docs/POSTGRES_BACKEND.md`.

That API is backed by:

- a file-persisted repository at `server/washoff/file-platform-repository.ts`
- a Vite middleware runtime at `server/washoff/vite-api-plugin.ts`
- the existing application service boundary in `src/features/orders/application/services/washoff-platform-service.ts`

The API persists its state to:

- `data/washoff-platform.json`

When the file does not exist yet, the backend seeds it from the current preview data once, then continues from disk-backed state.

## Adapter choice and why

Chosen adapter/runtime:

- client-side API repository adapter
- Vite-served dev API
- file-persisted JSON backend store

Why this choice:

- the current stack is Vite + React, without an existing standalone backend server framework
- this gives us a real backend/API path immediately
- it preserves the current application service boundary
- it avoids overcommitting to a production server framework too early
- it lets the UI talk to HTTP while still reusing current domain logic safely

## What the real API slice currently covers

- create hotel order
- run matching on the backend during order creation
- persist assignment result
- persist matching logs
- persist reassignment events through reject/expire/reassign paths
- fetch orders/providers/hotel/provider views from persisted backend state
- expose admin dashboard data through persistence-backed reads

Available backend routes include:

- `GET /api/platform/hotel-profile`
- `GET /api/platform/hotels`
- `GET /api/platform/provider-profile`
- `GET /api/platform/providers`
- `GET /api/platform/service-catalog`
- `GET /api/platform/orders`
- `POST /api/platform/orders`
- `POST /api/platform/orders/:orderId/accept`
- `POST /api/platform/orders/:orderId/reject`
- `POST /api/platform/orders/:orderId/expire`
- `POST /api/platform/orders/:orderId/reassign`
- `POST /api/platform/assignment-expiry-sweep`
- `POST /api/platform/matching/run`
- `GET /api/platform/admin/dashboard`

## What is still preview-only

- static build/runtime still defaults to the preview adapter unless an API is wired separately
- timeout expiry still relies on the current preview orchestration logic and lazy sweep behavior
- persistence is JSON-file based, not yet a relational database
- background workers, queues, and transactional command handling do not exist yet
- notifications are still not delivered through real infrastructure

## Switching between preview and API mode

Runtime mode is selected in `src/features/orders/application/index.ts`.

Current behavior:

- development defaults to `api`
- non-development defaults to `preview`

Optional overrides:

- `VITE_WASHOFF_DATA_SOURCE=api`
- `VITE_WASHOFF_DATA_SOURCE=preview`
- `VITE_WASHOFF_API_BASE_URL=<custom-base-url>`

This keeps preview mode available while allowing the app to run through the real HTTP path during development.

## Persistence model in this phase

The file-backed backend writes the Phase 8 persistence snapshot shape:

- hotels
- services
- providers
- provider capabilities
- provider capacity
- provider performance
- orders
- order items
- assignments
- assignment history
- matching logs
- reassignment events
- SLA history
- settlements
- notifications

The storage is persistence-oriented already, even though the runtime still uses the current domain orchestration from the preview repository internally.

## What remains for full backend execution

- database-backed repository implementation
- real API server process outside Vite middleware
- auth and role-aware API protection
- transaction-safe command handlers
- worker-based timeout expiry and reassignment
- KPI snapshotting and operational telemetry
- notification delivery integrations

## Recommended Phase 10

Phase 10 should replace the JSON file store with a real database-backed repository for the core order and assignment tables, while keeping the current API routes and application service boundary intact.
