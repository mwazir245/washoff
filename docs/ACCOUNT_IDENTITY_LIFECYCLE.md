# WashOff Account Identity Lifecycle

## What Phase 13B Adds

Phase 13B turns onboarding approval into a real account-based access flow.

WashOff still preserves the same product behavior:
- hotels do not choose providers manually
- providers join operational participation only after admin approval
- hotels gain operational access only after admin approval
- matching, assignment, reassignment, and worker rules are unchanged

## Identity Model

New account concepts:
- `AccountRole`
  - `hotel`
  - `provider`
  - `admin`
- `AccountStatus`
  - `pending_activation`
  - `active`
  - `suspended`
- `LinkedEntityType`
  - `hotel`
  - `provider`
  - `admin`
- `AccountActivationState`
  - `awaiting_approval`
  - `ready`
  - `activated`

Each account may link to:
- one approved hotel
- one approved provider
- or the admin control surface

## Lifecycle

### Hotel registration

1. Public registration creates:
   - a hotel onboarding record
   - a linked hotel account scaffold in `pending_activation`
2. The linked account starts in:
   - `status = pending_activation`
   - `activation.state = awaiting_approval`
3. Admin approval changes the hotel to approved and issues an activation path for the linked account.
4. The user completes `/activate-account?token=...`
5. The account becomes:
   - `status = active`
   - `activation.state = activated`
6. The active hotel account can access hotel dashboard and hotel order operations.

### Provider registration

1. Public registration creates:
   - a provider onboarding record
   - a linked provider account scaffold in `pending_activation`
2. Admin approval changes the provider to approved and issues an activation path for the linked account.
3. The user completes activation.
4. The active provider account can access provider dashboard and provider actions.

### Admin accounts

Admin uses a linked admin account. Seed/dev bootstrap still exists for local environments.

## Current Routes

Frontend:
- `/login`
- `/activate-account`
- `/register/hotel`
- `/register/provider`
- `/admin/onboarding`

API:
- `POST /api/platform/auth/login`
- `POST /api/platform/auth/activate`
- `GET /api/platform/auth/session`
- `POST /api/platform/auth/logout`
- `GET /api/platform/admin/accounts`

## Access Enforcement

Operational access now depends on all of the following:
- authenticated account
- correct account role
- linked entity ownership
- active account status
- approved linked hotel/provider

Examples:
- hotel dashboard requires:
  - active hotel account
  - linked hotel id
  - approved hotel
- provider dashboard requires:
  - active provider account
  - linked provider id
  - approved provider
- admin dashboard and onboarding require:
  - active admin account

## Matching Integration

Provider approval still gates eligibility directly.

If a provider is not approved:
- the provider is excluded before scoring
- the provider receives `ProviderNotApproved`
- the provider cannot be auto-assigned

## Current Auth Shape

The preferred auth path is now session-based:
- login returns session token + account + session profile
- the client stores the token locally
- API requests send `Authorization: Bearer <token>`
- the API resolves account identity from stored session data

Dev fallback still exists when enabled:
- header auth can still be used in development
- this remains scaffolding, not the primary user path

## Production-Shaped Vs Temporary

Production-shaped now:
- real account model
- account-to-entity linkage
- activation lifecycle
- session-aware API auth path
- role and linked-entity enforcement

Still temporary:
- password reset and suspension maturity now live in `docs/AUTH_MATURITY.md`
- no email delivery for activation links yet
- no enterprise IAM / SSO / OIDC
- no MFA
- activation link delivery is admin-mediated in the current implementation
- dev header auth fallback can still be enabled for local work

## Recommended Next Step

Phase 13C is now implemented. The next step is Phase 13D:
- email/invitation delivery for activation and reset links
- stronger admin actor attribution
- account recovery operations
- optional MFA / external identity provider planning
