# WashOff Release Checklist

## Before release
- `npm ci`
- `npm run prisma:generate`
- `npm run lint`
- `npm run typecheck`
- `npm run test:ci`
- `npm run build`

## Environment validation
- production env vars are present
- `WASHOFF_AUTH_MODE=session`
- `WASHOFF_SERVER_PERSISTENCE_MODE=db`
- `WASHOFF_MAIL_MODE=smtp`
- `WASHOFF_JOB_QUEUE_MODE=database`
- `WASHOFF_SIGNING_SECRET` is set

## Database validation
- review migration plan
- run `npm run prisma:migrate:deploy`
- confirm no destructive manual SQL is pending

## Functional smoke checks
- login / logout
- hotel order creation
- provider order execution progression
- hotel completion confirmation
- hotel invoice generation
- provider statement generation
- invoice PDF download
- provider statement PDF download
- admin finance collect / pay actions

## Post-deploy checks
- `GET /health`
- application logs are clean
- metrics endpoint is reachable internally
- assignment expiry worker can run once successfully

## Rollback readiness
- backup exists and is recent
- restore owner is identified
- rollback version is available
