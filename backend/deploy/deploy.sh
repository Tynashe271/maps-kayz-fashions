#!/usr/bin/env bash
# Pulls the latest backend image from the GitHub Container Registry and
# restarts the production stack. Run this ON THE VPS, either by hand or via
# the "deploy" job in .github/workflows/deploy-backend.yml over SSH.
#
# Expects to live at /opt/mapskayz/deploy.sh alongside compose.prod.yaml and
# .env.prod (see DEPLOYMENT.md for first-time setup).
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env.prod ]; then
  echo "Missing .env.prod — copy .env.prod.example, fill it in, and re-run." >&2
  exit 1
fi

echo "==> Logging in to the GitHub Container Registry"
# REGISTRY / REGISTRY_USER / REGISTRY_PASSWORD are passed in by the deploy
# workflow (REGISTRY_PASSWORD is that job's GITHUB_TOKEN — it's only used
# here, immediately, not stored). For a manual run, export them yourself
# first (a classic PAT with read:packages scope works for REGISTRY_PASSWORD).
podman login "${REGISTRY:-ghcr.io}" \
  --username "${REGISTRY_USER:?set REGISTRY_USER}" \
  --password-stdin <<<"${REGISTRY_PASSWORD:?set REGISTRY_PASSWORD}"

echo "==> Pulling the latest image"
REGISTRY_IMAGE="${REGISTRY_IMAGE:?set REGISTRY_IMAGE}" \
IMAGE_TAG="${IMAGE_TAG:-latest}" \
podman-compose -f compose.prod.yaml --env-file .env.prod pull api

echo "==> Restarting the stack"
REGISTRY_IMAGE="${REGISTRY_IMAGE}" \
IMAGE_TAG="${IMAGE_TAG:-latest}" \
podman-compose -f compose.prod.yaml --env-file .env.prod up -d

echo "==> Pruning old images"
podman image prune -f

echo "==> Waiting for the API to report healthy"
for _ in $(seq 1 15); do
  if curl -sf http://127.0.0.1:9200/api/health >/dev/null; then
    echo "Deploy complete — API is responding."
    exit 0
  fi
  sleep 2
done

echo "API did not become healthy in time — check 'podman logs mapskayz_api_1'." >&2
exit 1
