#!/usr/bin/env bash
# Manual smoke: temp Vault + real MCP server + built Next standalone server.
# Mirrors what desktop/main.cjs does, so the API contract is exercised end-to-end.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
FIXTURE="$(mktemp -d /tmp/pv-ui-smoke-XXXXXX)"
TOKEN="smoke-token-$$"
MCP_PORT=8799
UI_PORT=3111
cleanup() {
  [[ -n "${MCP_PID:-}" ]] && kill "$MCP_PID" 2>/dev/null || true
  [[ -n "${UI_PID:-}" ]] && kill "$UI_PID" 2>/dev/null || true
  [[ -n "${MCP_EMPTY_PID:-}" ]] && kill "$MCP_EMPTY_PID" 2>/dev/null || true
  [[ -n "${UI_EMPTY_PID:-}" ]] && kill "$UI_EMPTY_PID" 2>/dev/null || true
  rm -rf "$FIXTURE"
}
trap cleanup EXIT

mkdir -p "$FIXTURE/notes"
printf '# Existing note\n\nHello from the smoke test.\n' > "$FIXTURE/notes/existing.md"

PERSONAL_VAULT_ROOT="$FIXTURE" MCP_HOST=127.0.0.1 MCP_PORT=$MCP_PORT PERSONAL_VAULT_TOKEN="$TOKEN" \
  node "$ROOT/../personal-vault/mcp/personal-vault-server.mjs" >/tmp/pv-ui-smoke-mcp.log 2>&1 &
MCP_PID=$!
for _ in $(seq 1 100); do curl -fsS -m 1 "http://127.0.0.1:$MCP_PORT/status" >/dev/null 2>&1 && break; sleep 0.1; done

cp -R "$ROOT/.next/static" "$ROOT/.next/standalone/.next/static" 2>/dev/null || true
cp -R "$ROOT/public" "$ROOT/.next/standalone/public" 2>/dev/null || true
NODE_ENV=production HOSTNAME=127.0.0.1 PORT=$UI_PORT \
  PERSONAL_VAULT_ROOT="$FIXTURE" \
  PERSONAL_VAULT_MCP_URL="http://127.0.0.1:$MCP_PORT/mcp" \
  PERSONAL_VAULT_TOKEN="$TOKEN" PERSONAL_VAULT_UI_TOKEN="$TOKEN" NEXT_TELEMETRY_DISABLED=1 \
  node "$ROOT/scripts/smoke-web-server.mjs" >/tmp/pv-ui-smoke-web.log 2>&1 &
UI_PID=$!
for _ in $(seq 1 200); do curl -fsS -m 2 -H "x-vault-desktop-token: $TOKEN" "http://127.0.0.1:$UI_PORT/api/files" >/dev/null 2>&1 && break; sleep 0.15; done

B="http://127.0.0.1:$UI_PORT"
H="x-vault-desktop-token: $TOKEN"
fail() { echo "FAIL: $1"; echo "--- web log ---"; tail -30 /tmp/pv-ui-smoke-web.log; exit 1; }

echo "1) unauthenticated requests are refused"
[[ "$(curl -s -o /dev/null -w '%{http_code}' "$B/api/files")" == "401" ]] || fail "files without token"
[[ "$(curl -s -o /dev/null -w '%{http_code}' "$B/api/vault-info")" == "401" ]] || fail "vault-info without token"

echo "2) vault-info reports the real folder"
INFO="$(curl -s -H "$H" "$B/api/vault-info")"
echo "   $INFO"
[[ "$INFO" == *"\"name\":\"$(basename "$FIXTURE")\""* ]] || fail "vault-info name"
[[ "$INFO" == *"$FIXTURE"* ]] || fail "vault-info root"

echo "3) /api/files returns the real folder name, not a placeholder"
FILES="$(curl -s -H "$H" "$B/api/files")"
echo "   $(echo "$FILES" | head -c 220)"
[[ "$FILES" == *"\"vaultRoot\":\"$(basename "$FIXTURE")\""* ]] || fail "files vaultRoot"
[[ "$FILES" == *"Selected Vault"* ]] && fail "placeholder still present"
[[ "$FILES" == *"notes"* ]] || fail "existing folder listed"

echo "4) nested listing via ?path="
curl -s -H "$H" "$B/api/files?path=notes" | grep -q "existing.md" || fail "nested list"

echo "5) create -> read -> update -> archive -> restore through MCP only"
call() { curl -s -H "$H" -H 'Content-Type: application/json' -X POST -d "$1" "$B/api/vault"; }
call '{"operation":"create","args":{"path":"notes/new.md","content":"# New\n"}}' | grep -q '"path":"notes/new.md"' || fail "create"
[[ "$(cat "$FIXTURE/notes/new.md")" == "# New"* ]] || fail "created on disk"
call '{"operation":"update","args":{"path":"notes/new.md","content":"# Edited\n"}}' >/dev/null || fail "update"
[[ "$(cat "$FIXTURE/notes/new.md")" == "# Edited" ]] || fail "updated on disk"
ARCHIVED="$(call '{"operation":"archive","args":{"path":"notes/new.md"}}')"
echo "   archived -> $(echo "$ARCHIVED" | head -c 120)"
echo "$ARCHIVED" | grep -q 'archive/' || fail "archive result"
[[ -f "$FIXTURE/notes/new.md" ]] && fail "archive should move the file"
TO="$(echo "$ARCHIVED" | sed -n 's/.*"to":"\([^"]*\)".*/\1/p')"

echo "5b) the Archive view's data path works (archive/ then archive/<date>/, nested)"
ARCHIVE_ROOT="$(curl -s -H "$H" "$B/api/files?path=archive")"
echo "   $(echo "$ARCHIVE_ROOT" | head -c 200)"
[[ "$ARCHIVE_ROOT" == *"archive/$(date +%Y-%m-%d)"* ]] || fail "archive date folder not listed"
ARCHIVE_ALL="$(curl -s -H "$H" "$B/api/files?path=archive&recursive=1")"
echo "   $(echo "$ARCHIVE_ALL" | head -c 260)"
[[ "$ARCHIVE_ALL" == *"notes/new.md"* ]] || fail "archived note not listed recursively"
[[ "$ARCHIVE_ALL" == *"\"vaultRoot\":\"$(basename "$FIXTURE")\""* ]] || fail "archive listing vault name"

call "{\"operation\":\"restore\",\"args\":{\"path\":\"$TO\"}}" >/dev/null || fail "restore"
[[ -f "$FIXTURE/notes/new.md" ]] || fail "restore returned the file"

echo "6) no hidden storage: temp Vault is the only thing written"
[[ -z "$(find "$FIXTURE" -maxdepth 2 -name '.smoke-user-data' -o -name 'settings.json' | head -1)" ]] || fail "hidden storage"

echo "7) vault-info desktop actions reach the main process over IPC (no display needed)"
REVEAL="$(curl -s -H "$H" -H 'Content-Type: application/json' -X POST -d '{"action":"reveal"}' "$B/api/vault-info")"
echo "   $REVEAL"
[[ "$REVEAL" == *"\"ok\":true"* ]] || fail "reveal over IPC"
grep -q 'MAIN_RECEIVED {"type":"vault:reveal"}' /tmp/pv-ui-smoke-web.log || fail "main process never received vault:reveal"
CHOOSE="$(curl -s -H "$H" -H 'Content-Type: application/json' -X POST -d '{"action":"choose"}' "$B/api/vault-info")"
echo "   $CHOOSE"
[[ "$CHOOSE" == *"\"ok\":true"* ]] || fail "choose over IPC"
grep -q 'MAIN_RECEIVED {"type":"vault:choose"}' /tmp/pv-ui-smoke-web.log || fail "main process never received vault:choose"
BAD="$(curl -s -o /dev/null -w '%{http_code}' -H "$H" -H 'Content-Type: application/json' -X POST -d '{"action":"delete-everything"}' "$B/api/vault-info")"
[[ "$BAD" == "400" ]] || fail "unknown vault-info action should be refused"
echo "8) legacy Assistant routes stay blocked"
[[ "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" "$B/api/today")" == "404" ]] || fail "today route not blocked"

echo "9) rendered page contains the new copy and no account chrome"
PAGE="$(curl -s -H "$H" "$B/")"
[[ "$PAGE" == *"Your notes and files"* ]] || fail "subtitle copy"
[[ "$PAGE" == *"Kirill"* ]] && fail "hardcoded user name still rendered"
[[ "$PAGE" == *"Local-first AI memory system"* ]] && fail "old subtitle still rendered"

echo "10) an empty folder shows the friendly empty state, not 'Empty directory'"
EMPTY="$(mktemp -d /tmp/pv-ui-empty-XXXXXX)"
PERSONAL_VAULT_ROOT="$EMPTY" MCP_HOST=127.0.0.1 MCP_PORT=$((MCP_PORT+1)) PERSONAL_VAULT_TOKEN="$TOKEN" \
  node "$ROOT/../personal-vault/mcp/personal-vault-server.mjs" >/tmp/pv-ui-smoke-mcp-empty.log 2>&1 &
MCP_EMPTY_PID=$!
for _ in $(seq 1 100); do curl -fsS -m 1 "http://127.0.0.1:$((MCP_PORT+1))/status" >/dev/null 2>&1 && break; sleep 0.1; done
UI_EMPTY_PORT=$((UI_PORT+1))
NODE_ENV=production HOSTNAME=127.0.0.1 PORT=$UI_EMPTY_PORT \
  PERSONAL_VAULT_ROOT="$EMPTY" \
  PERSONAL_VAULT_MCP_URL="http://127.0.0.1:$((MCP_PORT+1))/mcp" \
  PERSONAL_VAULT_TOKEN="$TOKEN" PERSONAL_VAULT_UI_TOKEN="$TOKEN" NEXT_TELEMETRY_DISABLED=1 \
  node "$ROOT/.next/standalone/server.js" >/tmp/pv-ui-smoke-web-empty.log 2>&1 &
UI_EMPTY_PID=$!
for _ in $(seq 1 200); do curl -fsS -m 2 -H "$H" "http://127.0.0.1:$UI_EMPTY_PORT/api/files" >/dev/null 2>&1 && break; sleep 0.15; done
EMPTY_FILES="$(curl -s -H "$H" "http://127.0.0.1:$UI_EMPTY_PORT/api/files")"
[[ "$EMPTY_FILES" == *"\"files\":[]"* && "$EMPTY_FILES" == *"\"directories\":[]"* ]] || fail "empty vault not reported empty"
[[ "$EMPTY_FILES" == *"\"vaultRoot\":\"$(basename "$EMPTY")\""* ]] || fail "empty vault name"
kill "$UI_EMPTY_PID" "$MCP_EMPTY_PID" 2>/dev/null || true
rm -rf "$EMPTY"

echo
echo "SMOKE_OK"
