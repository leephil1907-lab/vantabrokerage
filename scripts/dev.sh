#!/usr/bin/env bash
# Supervised dev server.
#
# Next's dev server can exit when a build worker is killed (OOM) in constrained
# containers. This wrapper restarts it immediately and logs each cycle, so
# local previews and the e2e suite never see a dead port. Production uses
# `npm run build && npm start`, which is not affected.
set -u
cd "$(dirname "$0")/.."
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=3072}"
while true; do
  echo "[dev.sh] starting next dev $(date -Is)"
  npx next dev -p "${PORT:-3000}" -H 0.0.0.0
  code=$?
  echo "[dev.sh] next dev exited with $code $(date -Is); restarting in 2s"
  sleep 2
done
