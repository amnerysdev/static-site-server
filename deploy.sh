#!/usr/bin/env bash
set -euo pipefail

SERVER="webserver"
REMOTE_DIR="/var/www/my-site/"
LOCAL_DIR="./gdragon_interactive_site/"

rsync -avz --delete \
  --exclude '.git' \
  --exclude '.DS_Store' \
  "$LOCAL_DIR" "$SERVER:$REMOTE_DIR"

echo "Deployed."
