# WashOff Email Delivery And Identity Operations (Phase 13D)

## What This Phase Adds

Phase 13D extends the existing account lifecycle with a real delivery boundary for identity messages:

- activation emails are now sent through a dedicated mail adapter
- password reset emails are now sent through the same delivery boundary
- delivery outcomes are recorded as identity audit events
- admin can resend activation emails from the onboarding and identity screen
- development environments can use a safe outbox instead of a live email provider

This phase does not change WashOff business logic:

- hotels still do not choose providers manually
- provider approval still gates matching eligibility
- hotel approval still gates operational use
- matching, assignment, reassignment, and worker logic remain unchanged

## Delivery Architecture

The delivery boundary lives in:

- `server/washoff/identity-mailer.ts`
- `server/washoff/identity-mail-templates.ts`

Application services call the mail boundary through `WashoffIdentityMailDelivery`, not by sending mail directly inside repository or domain code.

Current delivery modes:

- `outbox`
  - writes rendered emails into `data/mail-outbox/...`
  - safest default for local development
- `console`
  - writes the message body to the server log
- `smtp`
  - sends identity messages through configured SMTP credentials
  - uses bounded retry before final failure
- `disabled`
  - intentionally records delivery failure without attempting to send

This structure is designed so a real provider adapter can replace the current dev adapters later without changing the application service boundary.

## Template Location

Arabic-first templates are rendered from:

- `server/washoff/identity-mail-templates.ts`

Templates included:

- activation email
- password reset email

Each template includes:

- Arabic greeting and explanation
- the main action link
- a plain-text fallback link
- expiry guidance when available

## Activation Email Flow

1. Admin approves a hotel or provider.
2. Approval keeps the entity business flow unchanged, but now also issues an activation token as before.
3. The application service sends an activation email through the mail boundary.
4. Delivery result is stored as an identity audit event:
   - `activation_email_sent`
   - `activation_email_failed`
5. Admin can later resend the activation email from the admin onboarding page.

The raw activation token is still never persisted in plain text. Only the action path uses the raw token at send time.

## Password Reset Email Flow

1. User submits `/forgot-password`.
2. The public response remains neutral to avoid leaking account existence.
3. If the account is active and eligible:
   - a one-time hashed reset token is issued
   - the application service sends a reset email through the mail boundary
   - delivery result is recorded in the identity audit trail
4. If the account is not eligible:
   - the user still gets the same neutral response
   - no operational data is leaked

The reset page never needs the reset path from the public response anymore.

## Admin Visibility

Admin identity operations now show:

- activation delivery status
- password reset delivery status
- last identity operation timestamp
- resend activation action
- normal suspend / reactivate controls

The detailed audit trail remains available through the identity event list.

## Configuration

Relevant environment variables:

- `WASHOFF_PUBLIC_APP_URL`
- `WASHOFF_MAIL_MODE`
- `WASHOFF_MAIL_OUTBOX_PATH`
- `WASHOFF_MAIL_FROM_EMAIL`
- `WASHOFF_MAIL_FROM_NAME_AR`
- `WASHOFF_MAIL_RETRY_MAX_ATTEMPTS`
- `WASHOFF_MAIL_RETRY_BASE_DELAY_MS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`

Recommended local setup:

- `WASHOFF_MAIL_MODE=outbox`

Then inspect delivered messages under:

- `data/mail-outbox`

## Development-Safe Vs Production-Ready

Development-safe now:

- outbox-based delivery
- console delivery fallback
- audit-backed delivery visibility
- resend activation from admin UI

Production-shaped now:

- clean mail abstraction
- Arabic templates
- service-level orchestration outside business logic
- delivery outcome tracking via audit trail

Still not full production maturity:

- no queue-backed mail worker yet
- no bounce/webhook processing
- no delivery analytics dashboard
- no branded sender-domain verification workflow

## Recommended Next Step

Phase 13E should focus on **real email provider integration and delivery operations**:

- add SMTP or provider-backed adapter
- add retry/failure policy
- add queue-backed delivery if needed
- add provider webhook handling later for delivery telemetry
