# Phase 16: Order Execution Lifecycle

This phase extends WashOff from successful onboarding, matching, assignment, acceptance, and reassignment into a full operational execution lifecycle through completion.

## Supported lifecycle

The execution lifecycle now supports the following order statuses after provider acceptance:

- `Accepted`
- `PickupScheduled`
- `PickedUp`
- `InProcessing`
- `QualityCheck`
- `OutForDelivery`
- `Delivered`
- `Completed`

Existing non-execution statuses remain intact:

- `Submitted`
- `AutoMatching`
- `PendingCapacity`
- `Assigned`
- `Cancelled`
- `Reassigned`
- `Disputed`

## Valid transitions

The application now enforces the following execution transitions:

1. `Accepted` -> `PickupScheduled`
2. `PickupScheduled` -> `PickedUp`
3. `PickedUp` -> `InProcessing`
4. `InProcessing` -> `QualityCheck`
5. `QualityCheck` -> `OutForDelivery`
6. `OutForDelivery` -> `Delivered`
7. `Delivered` -> `Completed`

Invalid transitions are rejected at the application/repository boundary.

## Provider responsibilities

After accepting an order, only the active assigned provider can progress the order through the execution steps.

Provider operational actions now map to:

- `Accepted` -> `جدولة الاستلام`
- `PickupScheduled` -> `تم الاستلام`
- `PickedUp` -> `جارٍ المعالجة`
- `InProcessing` -> `فحص الجودة`
- `QualityCheck` -> `خرج للتسليم`
- `OutForDelivery` -> `تم التسليم`

Rules:

- the provider must be the currently assigned active provider
- the provider account must be active and linked to an approved provider
- the order must already be accepted

## Hotel completion confirmation

The hotel can now confirm final completion after the provider marks the order as delivered.

Rules:

- only the correct linked hotel account can confirm completion
- completion is rejected unless the order is already in `Delivered`
- confirmation moves the order to `Completed`

## API endpoints

The current `/api/platform` boundary is preserved.

New execution endpoints:

- `POST /api/platform/orders/:id/execution-status`
- `POST /api/platform/orders/:id/complete`

These reuse the current auth and role boundary:

- provider/admin for execution updates
- hotel/admin for completion confirmation

## Persistence and status history

Execution lifecycle persistence now writes directly in all supported modes:

- preview mode
- file mode
- DB mode

Persisted fields include:

- `orders.status`
- `orders.updated_at`
- `orders.status_updated_at`
- `orders.progress_percent`
- `orders.status_history_json`

`status_history_json` stores ordered status change entries with:

- from status
- to status
- changed timestamp
- actor role
- optional Arabic notes

This gives hotel, provider, and admin views a timeline-friendly source of truth without changing the core orchestration model.

## UI support

### Provider dashboard

The provider dashboard now:

- shows execution timeline after acceptance
- shows the next operational action clearly
- allows progressing the order step-by-step until `Delivered`
- keeps reassignment visibility intact

### Hotel dashboard

The hotel dashboard now:

- shows execution timeline for active orders
- tracks later execution stages after acceptance
- exposes completion confirmation only when the order reaches `Delivered`

### Admin dashboard

The admin dashboard now:

- surfaces execution-visible orders after acceptance
- shows current later-stage status rather than going blind after assignment
- continues to use recent activity and matching transparency for operational context

## Test coverage added

Phase 16 validation now covers:

- valid lifecycle progression after acceptance
- invalid transition rejection
- wrong provider blocked from updating another provider's order
- hotel completion blocked before delivery
- full execution lifecycle through completion
- persistence of execution history and completion effects

## What is now fully operational end-to-end

WashOff now supports this full operational path:

1. hotel onboarding and approval
2. provider onboarding and approval
3. hotel order creation
4. automatic provider matching and assignment
5. provider accept/reject
6. reassignment when needed
7. execution progression after acceptance
8. hotel confirmation at delivery
9. final completion persistence

## Remaining limitations

This phase does not change:

- matching weights or selection logic
- assignment/reassignment rules
- onboarding or identity model
- worker architecture
- settlement automation beyond existing lifecycle fields

Later pilot/production work may still add:

- richer operational SLAs and breach alerts during execution
- notifications for execution-stage changes
- deeper admin analytics around stuck execution stages
