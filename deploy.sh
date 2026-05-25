#!/bin/bash
# Omni Reader deploy — copy fresh digest JSON, rebuild, deploy
set -e

APP_DIR="$HOME/projects/omni-reader-app"
DIGEST_JSON="/tmp/omni-digest.json"
STATIC_DIR="$APP_DIR/dist"
REMOTE_USER="camster"  # update
REMOTE_HOST="187.77.26.99"  # update
REMOTE_DIR="/var/www/omni-reader"  # update

echo "[1/4] Building digest..."
python3 "$HOME/.hermes/scripts/omni-reader.py" --new

echo "[2/4] Copying digest JSON..."
cp "$DIGEST_JSON" "$APP_DIR/public/digest.json"

echo "[3/4] Building Next.js..."
cd "$APP_DIR"
npm run build

echo "[4/4] Deploying..."
# Uncomment once host is set:
# rsync -avz --delete "$STATIC_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

echo "Done. Output: $STATIC_DIR/"
