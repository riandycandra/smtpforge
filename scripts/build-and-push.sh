#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -euo pipefail

# Configuration with fallback defaults / environment variables
DOCKER_USERNAME="${DOCKER_USERNAME:-riandycandra}"
TAG="${TAG:-latest}"
REPO_PREFIX="${REPO_PREFIX:-mailer}"

# Check if Docker username is provided
if [ -z "$DOCKER_USERNAME" ]; then
  read -rp "Enter your Docker Hub username/organization: " DOCKER_USERNAME
  if [ -z "$DOCKER_USERNAME" ]; then
    echo "Error: Docker username cannot be empty." >&2
    exit 1
  fi
fi

# Locate project root directory (directory where this script lives or parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo " Project Root   : $ROOT_DIR"
echo " Docker Hub User: $DOCKER_USERNAME"
echo " Image Prefix   : $REPO_PREFIX"
echo " Tag            : $TAG"
echo "=========================================="

# Ensure user is logged in to Docker Hub (optional check)
if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker daemon is not running." >&2
  exit 1
fi

echo "Checking Docker login status..."
if ! docker system info 2>/dev/null | grep -q "Username:"; then
  echo "You do not appear to be logged into Docker. Prompting docker login..."
  docker login -u "$DOCKER_USERNAME"
fi

# Service definitions: "<service_name>:<dockerfile_path>"
SERVICES=(
  "api:apps/api/Dockerfile"
  "worker:apps/worker/Dockerfile"
  "web:apps/web/Dockerfile"
)

# 1. Build images
echo ""
echo ">>> [1/2] Building Docker images..."
for item in "${SERVICES[@]}"; do
  IFS=":" read -r SERVICE DOCKERFILE <<< "$item"
  FULL_IMAGE_NAME="${DOCKER_USERNAME}/${REPO_PREFIX}-${SERVICE}:${TAG}"

  echo "----------------------------------------------------"
  echo "Building: $SERVICE ($FULL_IMAGE_NAME)"
  echo "Dockerfile: $DOCKERFILE"
  echo "Context: $ROOT_DIR"
  echo "----------------------------------------------------"

  docker build \
    -t "$FULL_IMAGE_NAME" \
    -f "$ROOT_DIR/$DOCKERFILE" \
    "$ROOT_DIR"
done

# 2. Push images
echo ""
echo ">>> [2/2] Pushing Docker images to Docker Hub..."
for item in "${SERVICES[@]}"; do
  IFS=":" read -r SERVICE _ <<< "$item"
  FULL_IMAGE_NAME="${DOCKER_USERNAME}/${REPO_PREFIX}-${SERVICE}:${TAG}"

  echo "----------------------------------------------------"
  echo "Pushing: $FULL_IMAGE_NAME"
  echo "----------------------------------------------------"

  docker push "$FULL_IMAGE_NAME"
done

echo ""
echo "=========================================="
echo " Successfully built and pushed all images!"
echo "=========================================="

