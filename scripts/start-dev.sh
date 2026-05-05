#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8090}"
BACKEND_ORIGIN="http://localhost:${BACKEND_PORT}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000/}"

if [[ -z "${JAVA_HOME:-}" ]] && [[ "$(uname -s)" == "Darwin" ]]; then
  export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home -v 17 2>/dev/null || true)"
fi

cleanup() {
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    echo ""
    echo "Stopping frontend (PID ${FRONTEND_PID})..."
    kill "${FRONTEND_PID}" 2>/dev/null || true
    wait "${FRONTEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    echo "Stopping backend (PID ${BACKEND_PID})..."
    kill "${BACKEND_PID}" 2>/dev/null || true
    wait "${BACKEND_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [[ "${FREE_BACKEND_PORT:-1}" == "1" ]]; then
  PIDS=$(lsof -ti ":${BACKEND_PORT}" 2>/dev/null || true)
  if [[ -n "${PIDS}" ]]; then
    echo "Port ${BACKEND_PORT} зайнятий — зупиняю старий процес (${PIDS})..."
    kill ${PIDS} 2>/dev/null || true
    sleep 2
    PIDS=$(lsof -ti ":${BACKEND_PORT}" 2>/dev/null || true)
    if [[ -n "${PIDS}" ]]; then
      kill -9 ${PIDS} 2>/dev/null || true
    fi
  fi
fi

echo "Starting backend: ${ROOT}/backend (порт ${BACKEND_PORT})"
(cd "${ROOT}/backend" && mvn -q spring-boot:run) &
BACKEND_PID=$!

echo "Waiting for ${BACKEND_ORIGIN} ..."
for _ in $(seq 1 90); do
  if curl -sf "${BACKEND_ORIGIN}/actuator/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sf "${BACKEND_ORIGIN}/actuator/health" >/dev/null 2>&1; then
  echo "Backend did not become ready in time. Check backend output above."
  exit 1
fi

echo "Backend OK. Starting frontend..."
cd "${ROOT}/frontend"
npm run dev &
FRONTEND_PID=$!

echo "Waiting for Vite on :3000 ..."
for _ in $(seq 1 60); do
  if curl -sf "${FRONTEND_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

OPEN_BROWSER="${OPEN_BROWSER:-1}"
if [[ "${OPEN_BROWSER}" == "1" ]]; then
  case "$(uname -s)" in
    Darwin)
      open "${FRONTEND_URL}"
      ;;
    Linux)
      xdg-open "${FRONTEND_URL}" 2>/dev/null || sensible-browser "${FRONTEND_URL}" 2>/dev/null || true
      ;;
    *)
      echo "Open manually: ${FRONTEND_URL}"
      ;;
  esac
  echo "Opened ${FRONTEND_URL}"
fi

wait "${FRONTEND_PID}"
