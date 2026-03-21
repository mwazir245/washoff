# WashOff Auth Maturity (Phase 13C)

## What Is Now Production-Shaped

Phase 13C hardens the existing account/session architecture without changing the WashOff product model:

- onboarding approval still gates activation eligibility
- activation still gates account activation
- active linked account still gates dashboard and operational access
- hotels still do not choose providers manually
- provider approval still gates matching eligibility

## Activation Lifecycle

Activation flow now behaves as a proper one-time token lifecycle:

1. Admin approves the hotel or provider.
2. The linked account moves to:
   - `status = pending_activation`
   - `activation.state = ready`
3. A hashed activation token is stored in the database.
4. The raw activation token is only exposed through the activation path.
5. The token is:
   - expiring
   - one-time use
   - validated before activation form submission
6. After successful activation:
   - `activation.state = activated`
   - `status = active`
   - `activation_token_used_at` is written
   - the same token is treated as already used afterward

Validation states now handled explicitly:
- invalid
- expired
- used
- ready

## Password Reset Lifecycle

Password reset now follows this flow:

1. User requests reset from `/forgot-password`.
2. System always returns a neutral success message.
3. If the account is active and already activated:
   - a hashed reset token is stored
   - reset timestamps are stored
   - a reset path is generated for the current dev/local lifecycle
4. `/reset-password` validates token state before showing the form.
5. Successful reset:
   - updates password hash
   - marks token used/completed
   - revokes older sessions
   - issues a fresh authenticated session

Validation states now handled explicitly:
- invalid
- expired
- used
- ready

## Suspension / Reactivation

Admin can now suspend and reactivate accounts.

Suspension behavior:
- suspended accounts cannot log in
- suspended accounts cannot keep using existing sessions
- active sessions are revoked immediately when suspension happens

Reactivation behavior:
- if the account was already activated before suspension, it returns to `active`
- if activation was never completed, it returns to `pending_activation`

## Session Lifecycle

Current session model:
- bearer token session
- stored hashed token in `account_sessions`
- fixed session expiry window
- explicit logout support
- revocation metadata stored on session rows

Sessions are revoked when:
- user logs out
- a newer session is issued for the same account
- password reset completes
- account is suspended
- the linked hotel/provider is no longer operationally approved
- account is no longer active

## Identity Audit Trail

Identity/security events are now persisted in `identity_audit_events`.

Tracked events:
- `account_created`
- `activation_issued`
- `account_activated`
- `login_succeeded`
- `login_failed`
- `password_reset_requested`
- `password_reset_completed`
- `account_suspended`
- `account_reactivated`
- `logout`
- `session_revoked`

The audit trail is queryable from the admin identity view and backend repository layer.

## Development Scaffolding Vs Production

Production-shaped now:
- hashed activation tokens
- hashed password reset tokens
- one-time token usage
- token expiry handling
- session revocation
- account suspension/reactivation
- persisted identity audit trail
- role + linked-entity enforcement remains intact

Still temporary:
- local delivery still uses a development-safe outbox or console mail adapter
- no SMTP/provider-backed sending yet
- no MFA
- no external IAM / OIDC / SSO
- no per-device/session management UI
- admin actor attribution for some backend-side account controls is still service-scaffolded

## Recommended Next Step

Phase 13E should focus on production delivery operations:

- real provider-backed email sending
- retry and failure policy for identity messages
- delivery telemetry / webhook handling
- stronger admin actor attribution end-to-end
- optional MFA / enterprise identity integration planning
