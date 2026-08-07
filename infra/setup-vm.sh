#!/bin/bash
set -euxo pipefail

REPO_URL="https://github.com/solana-foundation/tokens.git"
RUNNER_HOME=/home/runner
REPO_DIR="$RUNNER_HOME/tokens"

if [ ! -d "$REPO_DIR/.git" ]; then
  sudo -u runner git clone --depth=1 "$REPO_URL" "$REPO_DIR"
else
  sudo -u runner git -C "$REPO_DIR" fetch origin
  sudo -u runner git -C "$REPO_DIR" reset --hard origin/main
fi

sudo -u runner bash -c "cd $REPO_DIR && export PATH=\$HOME/.bun/bin:\$PATH && bun install --frozen-lockfile"

chmod +x \
  "$REPO_DIR/infra/cron/api-health.sh" \
  "$REPO_DIR/infra/cron/usage-digest.sh"

install -m 0644 "$REPO_DIR/infra/systemd/tokens-api-health.service"     /etc/systemd/system/
install -m 0644 "$REPO_DIR/infra/systemd/tokens-api-health.timer"       /etc/systemd/system/
install -m 0644 "$REPO_DIR/infra/systemd/tokens-usage-digest.service"   /etc/systemd/system/
install -m 0644 "$REPO_DIR/infra/systemd/tokens-usage-digest.timer"     /etc/systemd/system/

systemctl daemon-reload
systemctl enable --now \
  tokens-api-health.timer \
  tokens-usage-digest.timer

systemctl list-timers tokens-* --all
