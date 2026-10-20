# Platform Documentation

Welcome to the **SMTP Forge** operational and architectural documentation.

## Contents

- **[Root README](../README.md)** — Project overview, quick start, public API reference (`POST /api/v1/emails`, `GET /api/v1/emails/:job_id/progress`, `GET /api/v1/smtp-accounts`), and architecture summary.
- **[Deployment Guide (`DEPLOYMENT.md`)](./DEPLOYMENT.md)** — Docker Compose orchestration, Kubernetes/OpenShift readiness probes (`/health/live`, `/health/ready`), non-root container execution, and horizontal scaling recommendations.
- **[OpenShift Deployment Guide (`../deploy/openshift/README.md`)](../deploy/openshift/README.md)** — Step-by-step instructions and manifests for deploying `api`, `worker`, and `web` to OpenShift with external PostgreSQL and Redis.
- **[Backup & Disaster Recovery (`BACKUP_RECOVERY.md`)](./BACKUP_RECOVERY.md)** — PostgreSQL backup strategy, Redis AOF persistence, `SMTP_ENCRYPTION_KEY` vault requirements, and failure recovery scenarios.
- **[Operational Scripts (`../scripts/README.md`)](../scripts/README.md)** — Reference for local development runners (`scripts/dev.js`, `start-all.ps1`, `start-all.sh`) and zero-downtime Docker rebuild script (`restart.sh`).

