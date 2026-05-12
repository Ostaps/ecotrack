#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

free_listen_port() {
  local port=$1
  local pids
  pids=$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [[ -z "$pids" ]]; then
    return 0
  fi
  echo ">>> Порт $port зайнятий, завершую: $pids"
  kill $pids 2>/dev/null || true
  sleep 1
  pids=$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
}

free_listen_port 8080
free_listen_port 3000

BACKEND_URL="http://localhost:8080/actuator/health"
FRONTEND_URL="http://localhost:3000"

PIDS=()

cleanup() {
  echo ""
  echo "Зупинка процесів..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

echo ">>> Backend: mvn spring-boot:run ($ROOT/backend)"
(
  cd "$ROOT/backend"
  exec mvn spring-boot:run
) &
PIDS+=($!)

echo ">>> Очікування API ($BACKEND_URL)..."
ready=0
for _ in $(seq 1 120); do
  if curl -sf "$BACKEND_URL" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" -ne 1 ]]; then
  echo "Помилка: бекенд не відповів за 120 с." >&2
  exit 1
fi
echo ">>> Backend готовий."

echo ">>> Frontend: npm install + vite dev ($ROOT/frontend)"
(
  cd "$ROOT/frontend"
  if [[ ! -d node_modules ]]; then
    npm ci
  fi
  exec npm run dev
) &
PIDS+=($!)

echo ">>> Очікування Vite..."
for _ in $(seq 1 30); do
  if curl -sf "$FRONTEND_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if command -v open >/dev/null 2>&1; then
  open "$FRONTEND_URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$FRONTEND_URL"
else
  echo "Відкрийте вручну: $FRONTEND_URL"
fi

echo ">>> Готово. Натисніть Ctrl+C щоб зупинити все."
wait
