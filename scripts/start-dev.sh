#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${JAVA_HOME:-}" ]] && [[ "$(uname -s)" == "Darwin" ]]; then
  export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home -v 17 2>/dev/null || true)"
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo ""
    echo "Stopping backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting backend: $ROOT/backend"
(cd "$ROOT/backend" && mvn -q spring-boot:run) &
BACKEND_PID=$!

echo "Waiting for http://localhost:8080 ..."
for _ in $(seq 1 90); do
  if curl -sf "http://localhost:8080/actuator/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sf "http://localhost:8080/actuator/health" >/dev/null 2>&1; then
  echo "Backend did not become ready in time. Check backend logs above."
  exit 1
fi

echo "Backend OK. Starting frontend..."
cd "$ROOT/frontend"
exec npm run dev
