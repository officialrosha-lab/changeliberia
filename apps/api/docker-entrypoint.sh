#!/bin/sh
set -e
cd "$(dirname "$0")"
if [ "${RUN_MIGRATIONS_ON_START}" = "true" ]; then
  node_modules/.bin/prisma migrate deploy
fi
if [ "${SEED_ADMIN}" = "true" ]; then
  node dist/prisma/create-admin.js
fi
exec node dist/src/main.js
