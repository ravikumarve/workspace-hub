#!/usr/bin/env bash
# Workspace Hub — start API (:8787) + Web (:3000), fully detached.
# Logs: /tmp/hub_api.log · /tmp/hub_web.log
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$ROOT/web/node_modules" ]; then
  echo "First run: installing web deps..."
  (cd "$ROOT/web" && npm install)
fi

if ss -tln 2>/dev/null | grep -q ":8787"; then
  echo "API already running on :8787 — skipping"
else
  (cd "$ROOT/backend" && setsid nohup python3 -m uvicorn api:app --port 8787 > /tmp/hub_api.log 2>&1 < /dev/null &)
fi
if ss -tln 2>/dev/null | grep -q ":3001"; then
  echo "Web already running on :3001 — skipping"
else
  (cd "$ROOT/web" && setsid nohup npm run dev -- --port 3001 > /tmp/hub_web.log 2>&1 < /dev/null &)
fi

echo "Workspace Hub:"
echo "  UI  → http://localhost:3001  (CertifyAI uses :3000)"
echo "  API → http://localhost:8787/api/overview"
