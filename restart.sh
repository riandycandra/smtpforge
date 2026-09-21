#!/bin/bash
set -e

# Navigate to project root directory
cd "$(dirname "$0")"

show_help() {
  cat << EOF
Usage: ./restart.sh [OPTIONS] [SERVICES...]

Safely rebuilds and restarts Docker Compose services with zero unnecessary downtime.

Options:
  -h, --help        Show this help message and exit

Available Services:
  api               Backend Express REST API
  worker            Background email processing workers
  web               Next.js dashboard web application
  postgres          PostgreSQL database service
  redis             Redis cache & BullMQ queue service

Examples:
  ./restart.sh                  # Rebuild & restart all updated services
  ./restart.sh api              # Rebuild & restart only the API service
  ./restart.sh api worker       # Rebuild & restart API and Worker services
  ./restart.sh web              # Rebuild & restart only the Web dashboard
  ./restart.sh -h               # Display this help manual

How it works:
  1. Runs 'docker compose build' first. If build fails, existing containers stay running.
  2. Runs 'docker compose up -d' to gracefully recreate only modified containers.
  3. Preserves database and redis state without unnecessary downtime.
EOF
}

# Check for help argument
for arg in "$@"; do
  case "$arg" in
    -h|--help|help)
      show_help
      exit 0
      ;;
  esac
done

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
