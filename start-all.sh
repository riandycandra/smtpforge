#!/bin/bash

# Mailer Platform - Start All Services
# This script runs the API, Worker, and Web services in parallel.
# Requires pnpm to be installed.

echo -e "\033[1;35m🚀 Starting Mailer Platform Services...\033[0m"

# Kill all background jobs on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start API
pnpm --filter @mailer/api dev &
echo -e "\033[32m[API] Starting...\033[0m"

# Start Worker
pnpm --filter @mailer/worker dev &
echo -e "\033[34m[Worker] Starting...\033[0m"

# Start Web
pnpm --filter web dev &
echo -e "\033[36m[Web] Starting...\033[0m"

# Wait for all background processes
wait
