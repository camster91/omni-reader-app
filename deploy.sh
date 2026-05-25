#!/bin/bash
# Omni Reader deploy — refresh digest JSON, commit, push (GitHub Actions rebuilds)
set -e

APP_DIR="$HOME/projects/omni-reader-app"
DIGEST_JSON="/tmp/omni-digest.json"

echo "[1/2] Building digest..."
python3 "$HOME/.hermes/scripts/omni-reader.py" --new

echo "[2/2] Commit + push..."
cp "$DIGEST_JSON" "$APP_DIR/public/digest.json"
cd "$APP_DIR"
git add public/digest.json
git commit -m "Update digest $(date +%F_%H:%M)" || true
git push origin main

echo "Done. Site: https://camster91.github.io/omni-reader-app/"
