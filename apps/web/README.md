# SMTP Forge — Web Dashboard (`apps/web`)

The administrative Next.js 16 frontend for **SMTP Forge**.

## Features

- **Dashboard Overview (`/dashboard`)**: Delivery volume summary, recent activity, and quick system health indicators.
- **SMTP Accounts (`/dashboard/smtp`)**: Manage SMTP servers, configure TLS (`reject_unauthorized`), run single or bulk SMTP health checks, test connections, and send live test emails.
- **API Keys (`/dashboard/api-keys`)**: Provision SHA-256 hashed API keys, configure per-key hourly rate limits, and scope keys to specific SMTP accounts.
- **Email Logs (`/dashboard/logs`)**: Searchable, filterable audit trail of all queued, processing, sent, and failed emails with one-click **Resend** capability.
- **Metrics (`/dashboard/metrics`)**: Time-series delivery charts, latency metrics, and live BullMQ worker statistics.
- **Notifications (`/dashboard/notifications`)**: Configure and test operational status alerts for **Slack**, **Microsoft Teams**, and **Telegram**.
- **Security (`/login`, `/change-password`, `/dashboard/settings`)**: JWT-authenticated admin sessions with mandatory password rotation on initial login.

## Running Locally

From the repository root:
```bash
pnpm dev:web
```
Or start the entire stack (`api`, `worker`, `web`) with:
```bash
pnpm dev
```

In local development alongside the API on port `3000`, the dashboard runs on [http://localhost:3001](http://localhost:3001).

