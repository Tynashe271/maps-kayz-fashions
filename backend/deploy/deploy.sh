#!/usr/bin/env bash
# Pulls the latest backend image from the GitLab Container Registry and
# restarts the production stack. Run this ON THE VPS, either by hand or via
# the GitLab CI/CD "deploy" job over SSH (see .gitlab-ci.yml).
#
# Expects to live at /opt/mapskayz/deploy.sh alongside compose.prod.yaml and
# .env.prod (see DEPLOYMENT.md for first-time setup).
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env.prod ]; then
  echo "Missing .env.prod — copy .env.prod.example, fill it in, and re-run." >&2
  exit 1
fi

echo "==> Logging in to the GitLab Container Registry"
# CI_REGISTRY / CI_REGISTRY_USER / CI_REGISTRY_PASSWORD are passed in by the
# CI/CD job. For a manual run, export them yourself first (a deploy token or
# personal access token with read_registry scope works for CI_REGISTRY_PASSWORD).
podman login "${CI_REGISTRY:-registry.gitlab.com}" \
  --username "${CI_REGISTRY_USER:?set CI_REGISTRY_USER}" \
  --password-stdin <<<"${CI_REGISTRY_PASSWORD:?set CI_REGISTRY_PASSWORD}"

echo "==> Pulling the latest image"
CI_REGISTRY_IMAGE="${CI_REGISTRY_IMAGE:?set CI_REGISTRY_IMAGE}" \
IMAGE_TAG="${IMAGE_TAG:-latest}" \
podman-compose -f compose.prod.yaml --env-file .env.prod pull api

echo "==> Restarting the stack"
CI_REGISTRY_IMAGE="${CI_REGISTRY_IMAGE}" \
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
