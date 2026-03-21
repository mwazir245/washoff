# WashOff Onboarding And Approval

## What Phase 13A Adds

WashOff now supports controlled onboarding for new hotels and new laundry providers.

The platform behavior remains unchanged:
- hotels do not manually choose providers
- providers do not join the matching pool automatically
- admin approval is the gatekeeper before operational access

## Public Registration Flows

Public registration pages:
- `/register/hotel`
- `/register/provider`

Public API endpoints:
- `POST /api/platform/register/hotel`
- `POST /api/platform/register/provider`
- `GET /api/platform/service-catalog`

## Approval Lifecycle

Entities now carry onboarding review state with these statuses:
- `pending_approval`
- `approved`
- `rejected`
- `suspended`

Default behavior:
- newly registered hotels start as `pending_approval`
- newly registered providers start as `pending_approval`
- only `approved` entities are operationally active

Stored metadata includes:
- `submitted_at`
- `reviewed_at`
- `reviewed_by_role`
- `reviewed_by_id`
- `review_notes_ar`

## Admin Workflow

Admin onboarding management page:
- `/admin/onboarding`

Admin API endpoints:
- `GET /api/platform/admin/onboarding/hotels`
- `GET /api/platform/admin/onboarding/providers`
- `POST /api/platform/admin/onboarding/hotels/:id/approve`
- `POST /api/platform/admin/onboarding/hotels/:id/reject`
- `POST /api/platform/admin/onboarding/providers/:id/approve`
- `POST /api/platform/admin/onboarding/providers/:id/reject`

Only admin callers can use these management endpoints.

## Enforcement Rules

### Hotels

Pending or rejected hotels cannot use the hotel operational flow.

This is enforced in the current stack by:
- service-level dashboard access checks
- repository-level order creation protection
- repository-level hotel order listing protection

### Providers

Pending or rejected providers cannot:
- access the provider operational flow
- accept or reject assignments
- participate in matching eligibility

Provider matching exclusion uses the explicit reason code:
- `ProviderNotApproved`

## Persistence

Phase 13A extends persistence for:
- `hotels`
- `providers`

with onboarding status and review metadata.

Prisma migration added:
- `202603190002_onboarding_approval`

## Runtime Compatibility

The onboarding flow works with:
- preview mode
- file mode
- db mode

The preferred real backend path remains DB mode.

## Temporary / Not Yet Production-Complete

Still scaffolding:
- no full identity/account lifecycle yet
- no real credential ownership or invitation flow yet
- no email verification or password reset
- no admin audit feed for onboarding decisions beyond stored review metadata
- no account-to-entity linkage beyond the current Phase 12 auth scaffolding

## Recommended Next Step

Phase 13B should focus on account linkage and operational identity:
- real user/account records
- linking hotel users to approved hotels
- linking provider users to approved providers
- invitation / activation flow after approval
- replacing dev-header auth with real identity tokens or sessions
