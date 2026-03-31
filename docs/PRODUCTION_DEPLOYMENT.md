# WashOff Production Deployment

## Required production configuration
- `WASHOFF_ENV=production`
- `WASHOFF_SERVER_PERSISTENCE_MODE=db`
- `WASHOFF_AUTH_MODE=session`
- `WASHOFF_MAIL_MODE=smtp`
- `WASHOFF_STORAGE_MODE=database` or a future external object-storage provider
- `WASHOFF_JOB_QUEUE_MODE=database`
- `DATABASE_URL`
- `WASHOFF_SIGNING_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

The server now fails fast in production when these requirements are missing.

## Deployment sequence
1. Provision PostgreSQL and verify network access from the app runtime.
2. Set all production environment variables in the deployment platform secret store.
3. Run `npm ci`.
4. Run `npm run prisma:generate`.
5. Run `npm run prisma:migrate:deploy`.
6. Run `npm run check`.
7. Start the server with `npm run server:prod`.

## Runtime checks
- `GET /health` must report:
  - `status = ok`
  - `databaseReady = true`
  - `storageReady = true`
  - `workerReady = true`
- `GET /metrics` is internal-only and requires `x-washoff-internal-key`.

## Production security notes
- Session auth is cookie-based and production defaults are session-only.
- Database fallback to file persistence is disabled.
- Document downloads are served from object storage through signed or authorized download paths.
- Finance PDFs are generated and stored through the same storage abstraction.

## Recommended deployment topology
- 1+ application instances behind a reverse proxy
- PostgreSQL with managed backups and PITR
- HTTPS termination at the edge or reverse proxy
- external log shipping and metrics collection
- scheduled backup verification and restore drills
