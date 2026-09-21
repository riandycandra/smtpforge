#!/bin/bash
set -e

# Navigate to project root directory
cd "$(dirname "$0")"

echo -e "\033[1;34m🔄 Starting Docker service update & restart...\033[0m"

# Build new images first (if build fails, existing containers remain unaffected)
echo -e "\033[1;33m🔨 Building Docker images...\033[0m"
docker compose build "$@"

# Recreate and start updated containers in the background with minimal downtime
echo -e "\033[1;33m🚀 Recreating and launching updated containers...\033[0m"
docker compose up -d "$@"

# Print running container status
echo -e "\033[1;32m✅ Docker services successfully updated & restarted!\033[0m\n"
docker compose ps
