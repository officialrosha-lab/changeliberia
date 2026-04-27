#!/bin/sh
set -e
cd "$(dirname "$0")"
if [ "${RUN_MIGRATIONS_ON_START}" = "true" ]; then
  node_modules/.bin/prisma migrate deploy
fi
exec node dist/src/main.js
