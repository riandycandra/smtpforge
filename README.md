# SMTP Forge

A powerful, self-hosted transactional email relay platform designed for teams and developers who need centralized control over their email delivery pipeline. Built as a TypeScript monorepo (`api`, `worker`, `web`, `database`, `shared`) with Express, BullMQ, Redis, PostgreSQL, and Next.js.

---

## 🚀 Why Use This? (The Centralization Mission)

In a typical corporate environment, dozens of internal apps need to send emails. Traditionally, each app stores its own SMTP credentials (username/password) in its own `.env` files or databases. This creates a **security and maintenance nightmare**:
- **Security Risk**: Sensitive SMTP passwords are scattered across many servers and source code repositories.
- **Maintenance Overhead**: If an SMTP password changes (e.g., due to a password rotation policy), every single app must be updated and redeployed.
- **Credential Leakage**: Developers have direct access to production SMTP credentials.

**This platform solves this by centralizing the mailer function:**
- **Zero-Credential Integration**: Internal apps only need an **API Key**. They never see or store the actual SMTP passwords (encrypted at rest using `AES-256-GCM`).
- **Single Point of Rotation**: Change an SMTP password in this dashboard once, and all your company apps are updated instantly without redeployment.
- **Scoped Permissions**: Grant specific apps (API Keys) access to specific mail servers (SMTP Accounts) with per-key hourly rate limits.
- **Real-Time Tracking & Audit Trail**: Every email is logged in PostgreSQL for auditing, can be resent on demand from the dashboard, and can be tracked in real time via Server-Sent Events (SSE).
- **Proactive Health Monitoring & Alerts**: Automated background health checks for SMTP servers and BullMQ workers, with instant notifications via **Slack**, **Microsoft Teams**, and **Telegram**.
- **TLS Flexibility**: Supports internal mail servers using self-signed certificates that standard libraries often reject.

---

## 🏗️ Architecture Overview

| Component | Path | Description | Default Port |
| :--- | :--- | :--- | :--- |
| **API Service** | `apps/api` | Express REST API (Public App API, Admin API, SSE progress stream, Swagger UI, Health Checks) | `3000` |
| **Worker Service** | `apps/worker` | BullMQ background processor handling SMTP connection pooling, attachment downloading, smart retry classification, and Prometheus metrics | `9091` (metrics) |
| **Web Dashboard** | `apps/web` | Next.js 16 administrative UI for managing SMTP accounts, API keys, logs, metrics, and alert channels | `3001` |
| **Database Package** | `packages/database` | Shared Sequelize models (`SmtpAccount`, `ApiKey`, `ApiKeySmtpPermission`, `EmailJob`, `NotificationConfig`, `AdminUser`) and AES-256-GCM encryption | — |
| **Shared Package** | `packages/shared` | Shared TypeScript types, queue constants, status enums, and structured Pino logger | — |

---

## 🛠️ Getting Started

### Option 1: Docker Compose (Recommended for Production / Quick Start)

#### Prerequisites
- Docker and Docker Compose installed.

#### Installation & Running
1. **Clone the repository** and configure environment variables:
   ```bash
   cp .env.example .env
   ```
2. **Run with Docker Compose**:
   ```bash
   docker compose up -d --build
   ```
   *(Tip: To rebuild and restart specific services later with minimal downtime, use `./restart.sh [service...]`.)*
3. **Access the Platform**:
   - **Web Dashboard**: `http://localhost:3001`
   - **API Base URL**: `http://localhost:3000/api/v1`
   - **Interactive Swagger UI**: `http://localhost:3000/docs`
   - **Default Admin Credentials**:
     - **Username**: `admin`
     - **Password**: `admin` *(You will be prompted to change this password on first login)*

### Option 2: Local Development (Node.js & pnpm)

#### Prerequisites
- Node.js (v20+) and `pnpm` installed.
- Running PostgreSQL and Redis instances (you can start just the infrastructure via `docker compose up -d postgres redis`).

#### Running Locally
```bash
# Install dependencies
pnpm install

# Build shared packages and start API (3000), Worker, and Web (3001) in parallel
pnpm dev
```
You can also run services individually (`pnpm dev:api`, `pnpm dev:worker`, `pnpm dev:web`) or use `./start-all.ps1` (Windows) / `./start-all.sh` (Linux/macOS).

### Option 3: OpenShift Deployment

Ready-to-use OpenShift manifests (`ConfigMap`, `Secret`, `Deployment`s, `Service`s, and `Route`s) are provided in [`deploy/openshift/`](./deploy/openshift) for deploying the stateless application stack (`api`, `worker`, `web`) connected to external PostgreSQL and Redis instances.

1. Configure your external database/Redis hosts in [`deploy/openshift/01-configmap.yaml`](./deploy/openshift/01-configmap.yaml) and credentials/keys in [`deploy/openshift/02-secrets.yaml`](./deploy/openshift/02-secrets.yaml).
2. Apply the manifests using the OpenShift CLI (`oc`):
   ```bash
   oc apply -f deploy/openshift/01-configmap.yaml
   oc apply -f deploy/openshift/02-secrets.yaml
   oc apply -f deploy/openshift/10-api-deployment.yaml
   oc apply -f deploy/openshift/20-worker-deployment.yaml
   oc apply -f deploy/openshift/30-web-deployment.yaml
   oc apply -f deploy/openshift/40-routes.yaml
   ```

👉 For full prerequisites, configuration steps, and verification commands, refer to the **[OpenShift Deployment Guide (`deploy/openshift/README.md`)](./deploy/openshift/README.md)**.

---

## 🔌 Public API Documentation

Integrate SMTP Forge into your applications using standard HTTP requests. Interactive OpenAPI documentation is also available at **`GET /docs`** (`http://localhost:3000/docs`) and raw JSON at **`GET /docs/openapi.json`**.

### Authentication
All requests to the public API (`/api/v1/*`) must include your API key in the request header:
```http
X-Mailer-Api-Key: YOUR_API_KEY_HERE
```
*(Note: For browser `EventSource` clients connecting to the SSE progress stream, you may alternatively pass `?api_key=YOUR_API_KEY_HERE` as a query parameter.)*

---

### 1. Send Email
**Endpoint**: `POST /api/v1/emails`

Queues an outbound email for asynchronous delivery via BullMQ.

**Payload (JSON)**:
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `from_email` | `string` | No | Override sender email address (max 255 chars). If omitted, falls back to the SMTP account's configured `from_email`. |
| `from_name` | `string` | No | Override sender display name (max 255 chars). If omitted, falls back to the SMTP account's configured `from_name`. |
| `to` | `string` or `string[]` | **Yes** | Primary recipient email address, or an array of valid email addresses (min 1). |
| `cc` | `string[]` | No | Array of Carbon Copy (CC) recipient email addresses (max 255 chars each). |
| `bcc` | `string[]` | No | Array of Blind Carbon Copy (BCC) recipient email addresses (max 255 chars each). |
| `subject` | `string` | **Yes** | The email subject line (max 500 characters). |
| `html` | `string` | **Yes** | The HTML body of the email (max 5MB). |
| `attachments` | `array` | No | List of files to attach. Each item requires `filename` (`string`, max 255 chars) and `url` (`string`, valid public URL). |
| `smtp_account` | `UUID` | No | Specific SMTP account ID to use. If omitted, the platform auto-selects an active account permitted for your API key. |

**Example (Basic)**:
```bash
curl -X POST http://localhost:3000/api/v1/emails \
  -H "Content-Type: application/json" \
  -H "X-Mailer-Api-Key: your_key_here" \
  -d '{
    "from_email": "billing@example.com",
    "from_name": "Acme Billing",
    "to": ["user@example.com", "ops@example.com"],
    "cc": ["manager@example.com"],
    "bcc": ["audit@example.com"],
    "subject": "Test Email",
    "html": "<h1>Hello from SMTP Forge!</h1>"
  }'
```

**Example (With Attachments & Explicit SMTP Account)**:
```bash
curl -X POST http://localhost:3000/api/v1/emails \
  -H "Content-Type: application/json" \
  -H "X-Mailer-Api-Key: your_key_here" \
  -d '{
    "to": "user@example.com",
    "cc": ["team@example.com"],
    "subject": "Monthly Invoice",
    "html": "<p>Please find your invoice attached.</p>",
    "smtp_account": "b2fe839c-0f7f-48fe-872f-9dc37d51af65",
    "attachments": [
      {
        "filename": "invoice.pdf",
        "url": "https://example.com/files/invoice.pdf"
      }
    ]
  }'
```

**Response (`202 Accepted`)**:
```json
{
  "success": true,
  "data": {
    "message": "Email queued successfully",
    "job_id": "12",
    "status": "queued"
  }
}
```

---

### 2. Stream Email Delivery Progress (SSE)
**Endpoint**: `GET /api/v1/emails/:job_id/progress`

Subscribes to real-time **Server-Sent Events (SSE)** for a queued email job (accepts either the queue `job_id` returned by `POST /api/v1/emails` or the internal database UUID). The stream automatically closes once the email reaches a terminal state (`sent` or `failed`).

- **Emitted Events**: `progress`, `completed`, `failed`
- **Progress Steps**: `queued` (0%) → `preparing` (25%) → `connecting_smtp` (50%) → `delivered` (100%) / `retrying` / `failed` (100%)

**Example (Bash)**:
```bash
curl -N http://localhost:3000/api/v1/emails/12/progress \
  -H "X-Mailer-Api-Key: your_key_here"
```

**Example Event Stream Output**:
```text
event: progress
data: {"job_id":"12","email_job_id":"d3b07384-d113-4a6c-9c3f-98f5b84c8a5b","status":"processing","step":"connecting_smtp","percentage":50,"message":"Connecting to SMTP server and transmitting message","timestamp":"2026-10-20T04:50:00.000Z"}

event: completed
data: {"job_id":"12","email_job_id":"d3b07384-d113-4a6c-9c3f-98f5b84c8a5b","status":"sent","step":"delivered","percentage":100,"message":"Email delivered successfully","latency_ms":320,"smtp_response":"250 2.0.0 OK","timestamp":"2026-10-20T04:50:01.000Z"}
```

---

### 3. List Authorized SMTP Accounts
**Endpoint**: `GET /api/v1/smtp-accounts`

Returns a list of active SMTP accounts that the current API key is authorized to use.

**Example (Bash)**:
```bash
curl -X GET http://localhost:3000/api/v1/smtp-accounts \
  -H "X-Mailer-Api-Key: your_key_here"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "b2fe839c-0f7f-48fe-872f-9dc37d51af65",
      "name": "Marketing SMTP",
      "host": "smtp.sendgrid.net",
      "port": 587,
      "from_email": "marketing@example.com",
      "from_name": "Marketing Team"
    }
  ]
}
```

---

### 📎 Attachment Handling
SMTP Forge supports sending attachments by referencing a publicly reachable URL. The worker downloads each file before sending:
- **Max File Size**: 50MB per file (60s download timeout).
- **SSRF Protection**: Blocks local/loopback domains (`localhost`, `127.0.0.1`, `169.254.169.254`).
- **Automatic Cleanup**: Temporary files (`mailer_att_*`) are purged immediately after delivery (in a `finally` block), and a startup scan removes any orphaned files older than 24 hours.

---

## 🏥 Health Probes & Operational Monitoring

- **Liveness Probe**: `GET /health/live` — Verifies the API process is up and accepting requests.
- **Readiness Probe**: `GET /health/ready` — Verifies PostgreSQL, Redis, and BullMQ queue connections.
- **Worker Prometheus Metrics**: Exposed by the worker service on port `9091` (`GET /metrics` and `GET /health`) tracking active jobs, completed/failed/retried counters, and processing latency histograms.
- **Automated Background Jobs**:
  - **Worker Health Monitor**: Checks active BullMQ workers every 60 seconds and dispatches notifications via configured channels (**Microsoft Teams**, **Slack**, **Telegram**) if worker availability changes.
  - **SMTP Health Monitor**: Periodically verifies SMTP connectivity (every 15 minutes by default, configurable via `SMTP_HEALTH_CHECK_INTERVAL_MS`). Admins can also trigger single/bulk health checks and send live test emails from the dashboard.

---

## 📚 Additional Documentation

- [Deployment Guide (`docs/DEPLOYMENT.md`)](./docs/DEPLOYMENT.md) — Docker, Kubernetes/OpenShift readiness, and scaling recommendations.
- [OpenShift Deployment (`deploy/openshift/README.md`)](./deploy/openshift/README.md) — Manifests and step-by-step instructions for OpenShift clusters.
- [Backup & Disaster Recovery (`docs/BACKUP_RECOVERY.md`)](./docs/BACKUP_RECOVERY.md) — PostgreSQL, Redis AOF, and `SMTP_ENCRYPTION_KEY` recovery procedures.
- [Operational Scripts (`scripts/README.md`)](./scripts/README.md) — Helper scripts for local development and container lifecycle management.

---

## 🗺️ Roadmap & Feature Status

- [x] **Analytics & Metrics Dashboard**: Visual charts for delivery success rates, time-series volume, worker status, and latency.
- [x] **Attachments Support**: Download and attach remote files via the API with automatic temp cleanup.
- [x] **Rate Limiting**: Redis-backed per-API-key hourly throughput control (`express-rate-limit` + `rate-limit-redis`).
- [x] **JWT Authentication & Forced Password Rotation**: Signed JWTs for admin sessions with mandatory password change on initial setup.
- [x] **Real-Time Delivery Progress (SSE)**: Live Server-Sent Events stream (`GET /api/v1/emails/:job_id/progress`) for tracking queued emails.
- [x] **Multi-Channel Health Alerting**: Webhook & bot notifications for **Slack**, **Microsoft Teams**, and **Telegram** when worker status changes.
- [x] **Interactive Swagger / OpenAPI Docs**: Built-in API explorer at `/docs`.
- [ ] **Per-Email Delivery Webhooks**: Outbound POST callbacks to client applications when individual emails are sent or fail.
- [ ] **Multi-Admin RBAC**: Manage multiple admin users with granular role-based permission levels.

---

## 📁 Data Persistence
When running via Docker Compose, PostgreSQL and Redis data are stored in the `./data` directory (`./data/postgres` and `./data/redis`). This directory is git-ignored and ensures your configuration, credentials, and logs survive container restarts.
