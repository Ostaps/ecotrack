#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! gh auth status >/dev/null 2>&1; then
  echo "Спочатку авторизуйте GitHub CLI (один раз):"
  echo "  gh auth login"
  exit 1
fi

git remote remove origin 2>/dev/null || true

gh repo create ecotrack --public --source=. --remote=origin --push \
  --description "EcoTrack — logistics emissions tracking"

echo "Готово: https://github.com/Ostaps/ecotrack"
