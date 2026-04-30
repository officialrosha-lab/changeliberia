#!/bin/sh
set -e
cd "$(dirname "$0")"
node_modules/.bin/prisma migrate deploy
if [ "${SEED_ADMIN}" = "true" ]; then
  node dist/prisma/create-admin.js
fi
exec node dist/src/main.js
