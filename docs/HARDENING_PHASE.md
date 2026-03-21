# WashOff Platform Hardening (Phase 14)

## What Changed

Phase 14 hardens WashOff operationally without changing product behavior, matching logic, assignment logic, or reassignment rules.

This phase adds:

- a clean engineering baseline for test, typecheck, lint, and build
- a standalone backend server entry in addition to the existing Vite middleware mode
- structured logging and in-memory metrics counters
- rate limiting for sensitive identity endpoints
- a hardened in-process worker with queue, locking, and retries
- SMTP-capable identity email delivery with retry and delivery status tracking

## Stable Commands

Use these commands as the CI-ready baseline:

- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run build`
- `npm run check`

Runtime commands:

- `npm run dev`
  - frontend + Vite middleware API for development
- `npm run server:start`
  - standalone API server for production-shaped backend execution
- `npm run worker:expiry:once`
  - runs one explicit expiry sweep

## Dev Vs Production-Shaped Runtime

### Development mode

Use:

- `npm run dev`

Behavior:

- frontend is served by Vite
- `/api/platform` is handled through the shared API handler inside the Vite plugin
- `/health` is also available in dev mode
- optional worker loop can still run if `WASHOFF_ENABLE_WORKER=true`

### Standalone backend mode

Use:

- `npm run server:start`

Behavior:

- starts a standalone Node HTTP server
- exposes the same `/api/platform` endpoints
- exposes `/health`
- can run the assignment expiry loop automatically when enabled

Important:

- the standalone backend currently serves API + health only
- frontend hosting remains separate

## Health Check

Endpoint:

- `GET /health`

Response includes:

- platform status
- current persistence mode
- worker enabled state

## Email Delivery

Mail boundary remains in:

- `server/washoff/identity-mailer.ts`
- `server/washoff/identity-mail-templates.ts`

Supported modes:

- `outbox`
  - writes email artifacts to `data/mail-outbox`
- `console`
  - writes email previews to structured logs
- `smtp`
  - sends through configured SMTP transport
- `disabled`
  - returns a safe failed delivery result

Required SMTP environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`

Additional delivery configuration:

- `WASHOFF_MAIL_RETRY_MAX_ATTEMPTS`
- `WASHOFF_MAIL_RETRY_BASE_DELAY_MS`
- `WASHOFF_MAIL_FROM_EMAIL`
- `WASHOFF_MAIL_FROM_NAME_AR`
- `WASHOFF_PUBLIC_APP_URL`

Delivery behavior:

- activation and password reset emails use the same mail abstraction
- retries use exponential backoff
- delivery summaries now track:
  - `sent`
  - `retried`
  - `failed`
- audit metadata stores:
  - provider label
  - provider message id
  - attempt count
  - retry count
  - failure reason
  - outbox path when applicable

## Worker Behavior

The assignment expiry worker now uses:

- an in-memory job queue abstraction
- a single lock key to prevent overlapping expiry runs
- bounded retry logic
- structured logging for:
  - enqueue
  - retry
  - processed
  - failed
  - skipped due to active lock

This does not change expiry or reassignment rules. It only hardens execution.

## Security Hardening

This phase adds:

- request throttling for all API traffic
- tighter rate limits for:
  - login
  - activation
  - password reset
- stricter malformed session token rejection
- continued rejection of expired/revoked/inactive sessions

What this is not:

- not OAuth
- not SSO
- not external IAM

## Observability

Added runtime structure:

- structured JSON logging
- in-memory metric counters

Current logging coverage:

- API request completion/failure
- auth success/failure signals
- worker lifecycle
- mail delivery success/failure/retry
- runtime persistence fallback

Current metrics coverage:

- API request totals and error totals
- rate-limit hits
- auth event totals
- worker enqueue/process/failure/retry totals
- mail delivery totals and retry totals

## Known Limitations

Still not full production maturity:

- metrics are in-memory only
- logs are structured but not shipped to an external platform
- mail delivery does not yet use queue-backed async processing
- worker queue is still single-instance and in-memory
- no distributed locking yet
- standalone API server does not yet serve frontend assets
- frontend build still emits a large bundle warning

## Recommended Next Step

After Phase 14, the next step should be:

- production operations hardening across deployment and observability

That should focus on:

- external log/metric export
- persistent/distributed job execution
- real deployment topology
- mail delivery telemetry and retries through background jobs
- bundle/code-splitting optimization
