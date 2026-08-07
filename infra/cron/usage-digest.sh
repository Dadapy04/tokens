#!/bin/bash
set -euo pipefail

REPO_DIR="${TOKENS_REPO_DIR:-/home/runner/tokens}"
DOPPLER_PROJECT=tokens
DOPPLER_CONFIG=prd

cd "$REPO_DIR"

for key in GRAFANA_API_URL GRAFANA_API_TOKEN SLACK_USAGE_DIGEST_WEBHOOK_URL SLACK_ALERT_WEBHOOK_URL TOKENS_CLOUDRUN_USAGE_URL TOKENS_CLOUDRUN_AUTH_TOKEN; do
  declare "$key=$(doppler secrets get "$key" --plain --project "$DOPPLER_PROJECT" --config "$DOPPLER_CONFIG")"
done

DIGEST_LOG="$(mktemp -t tokens-usage-digest.XXXXXX)"
PROJECT_LOOKUP_PATH="$(mktemp -t tokens-projects.XXXXXX.json)"
trap 'rm -f "$DIGEST_LOG" "$PROJECT_LOOKUP_PATH"' EXIT

# Project id → {name, isPersonal} lookup from the cloudrun-usage service
# (replaces the legacy `convex run --inline-query` against Convex prod).
curl -sf -X POST "${TOKENS_CLOUDRUN_USAGE_URL%/}/query/listProjectsDigest" \
  -H "Authorization: Bearer $TOKENS_CLOUDRUN_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}' > "$PROJECT_LOOKUP_PATH"

probe_status=0
GRAFANA_API_URL="$GRAFANA_API_URL" \
GRAFANA_API_TOKEN="$GRAFANA_API_TOKEN" \
SLACK_USAGE_DIGEST_WEBHOOK_URL="$SLACK_USAGE_DIGEST_WEBHOOK_URL" \
PROJECT_LOOKUP_PATH="$PROJECT_LOOKUP_PATH" \
  "$HOME/.bun/bin/bun" scripts/usage-digest.ts > "$DIGEST_LOG" 2>&1 \
  || probe_status=$?

cat "$DIGEST_LOG"

if [ "$probe_status" -ne 0 ]; then
  REASON=$(tail -1 "$DIGEST_LOG" || true)
  [ -z "$REASON" ] && REASON="usage-digest exited $probe_status"
  if [ -n "${SLACK_ALERT_WEBHOOK_URL:-}" ]; then
    PAYLOAD=$(jq -n \
      --arg host "$(hostname)" \
      --arg reason "$REASON" \
      '{
        text: "*[ALERT] usage-digest* — could not post the daily digest",
        attachments: [{
          color: "#d63031",
          blocks: [
            {type:"section", text:{type:"mrkdwn", text:"*[ALERT] usage-digest* failed on the daily run"}},
            {type:"section", fields:[
              {type:"mrkdwn", text:("*Host:*\n`"+$host+"`")},
              {type:"mrkdwn", text:("*Reason:*\n`"+$reason+"`")}
            ]}
          ]
        }]
      }')
    curl -sS --fail-with-body -X POST -H 'Content-Type: application/json' \
      --data "$PAYLOAD" "$SLACK_ALERT_WEBHOOK_URL" || true
  fi
  exit "$probe_status"
fi
