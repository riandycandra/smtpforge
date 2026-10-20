# Operational & Development Scripts

This directory and the repository root provide helper scripts for running and managing the Mailer Platform across environments.

## 1. Local Development (`scripts/dev.js`)

Run via the root `package.json`:
```bash
pnpm dev
```
**What it does:**
1. Synchronously builds the shared workspace packages (`@mailer/shared` and `@mailer/database`).
2. Spawns all three services in parallel with color-coded log prefixes:
   - `[API   ]` (`@mailer/api` on port `3000`)
   - `[Worker]` (`@mailer/worker`)
   - `[Web   ]` (`web` Next.js dashboard on port `3001`, configured with `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`)
3. Gracefully terminates all child processes on `SIGINT` / `SIGTERM`.

## 2. Shell Runners (`start-all.ps1` / `start-all.sh`)

Located in the repository root for starting `api`, `worker`, and `web` directly via PowerShell (Windows) or Bash (Linux/macOS):
```powershell
# Windows PowerShell
.\start-all.ps1
```
```bash
# Linux / macOS
./start-all.sh
```

## 3. Docker Compose Zero-Downtime Restart (`restart.sh`)

Located in the repository root, `restart.sh` safely rebuilds and restarts Docker Compose services without unnecessary downtime:
```bash
./restart.sh                  # Rebuild & restart all services
./restart.sh api              # Rebuild & restart only the API service
./restart.sh api worker       # Rebuild & restart API and Worker services
./restart.sh web              # Rebuild & restart only the Web dashboard
./restart.sh --help           # Display usage instructions
```
**How it works:**
- Runs `docker compose build` first so existing containers remain running if a build fails.
- Runs `docker compose up -d` to recreate only modified containers while preserving PostgreSQL and Redis state.

