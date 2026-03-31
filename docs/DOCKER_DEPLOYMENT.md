# WashOff Docker Deployment

## Files
- Local ready env: `.env.docker`
- Production example env: `.env.docker.prod.example`
- Local compose: `docker-compose.yml`
- Production compose with Nginx: `docker-compose.prod.yml`
- Nginx config: `docker/nginx.conf`

## Local Docker run
Use `.env.docker` for local production-like Docker on `localhost`.

Important local note:
- `.env.docker` sets `WASHOFF_SESSION_COOKIE_SECURE=false` so browser sessions work over plain `http://localhost:3000`
- For real internet-facing production behind HTTPS, this must be `true`

Commands:
```bash
docker compose build
docker compose up -d
```

Access:
- Frontend: `http://localhost:3000`
- Health: `http://localhost:3000/health`
- API base: `http://localhost:3000/api/platform`

## Production Docker run
1. Copy `.env.docker.prod.example` to `.env.docker.prod`
2. Replace all placeholder values:
  - `DATABASE_URL`
  - `POSTGRES_PASSWORD`
  - `WASHOFF_SIGNING_SECRET`
  - `WASHOFF_PUBLIC_APP_URL`
  - `WASHOFF_SESSION_COOKIE_DOMAIN`
  - SMTP settings
3. Start the production stack:

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Production topology:
- `nginx`: public entrypoint on port `80`
- `app`: internal application service on port `3000`
- `worker`: background worker
- `db`: PostgreSQL 15

## Startup behavior
The `app` container entrypoint:
1. runs `npm run prisma:generate`
2. runs `npm run db:deploy` when `WASHOFF_RUN_MIGRATIONS=true`
3. starts `npm run server:start`

The `worker` container:
1. runs `npm run prisma:generate`
2. starts `npm run worker:start`

## Notes
- Docker deployment is `db` only, not file persistence.
- The application container serves the built frontend and the API together.
- The production compose file places Nginx in front of the app container without changing application behavior.
- Database migrations are applied automatically by the app container at startup.
- Platform seller legal/VAT profile is managed from WashOff platform settings and database data, not from Docker env variables.
