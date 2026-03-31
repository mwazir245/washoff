#!/bin/sh
set -eu

echo "[WashOff] Starting container entrypoint"

if [ "${WASHOFF_RUN_PRISMA_GENERATE:-true}" = "true" ]; then
  echo "[WashOff] Generating Prisma client"
  npm run prisma:generate
fi

if [ "${WASHOFF_RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[WashOff] Running Prisma migrations"
  npm run db:deploy
fi

echo "[WashOff] Starting process: $*"
exec "$@"
