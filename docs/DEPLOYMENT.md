# Deployment Guide

This document outlines the operational deployment instructions for the Transactional Email Platform.

## 1. Docker Deployment

The platform is fully containerized with multi-stage Dockerfiles. It consists of three primary services:
- **API**: The public-facing ingress and administrative REST server.
- **Worker**: The background job processor pulling from BullMQ.
- **Web**: The Next.js administrative dashboard.

### Environment Requirements
Before deploying, ensure you have a `.env` file populated with secure credentials. Use `docker-compose.yml` to orchestrate.

```bash
# Start infrastructure
docker-compose up -d postgres redis

# Wait for readiness, then start application
docker-compose up -d api worker web
```

## 2. OpenShift / Kubernetes Readiness

The platform is explicitly designed to be cloud-native:
1. **Non-Root Execution**: Both `api` and `worker` Dockerfiles create a `nodejs` system group (uid: 1001) preventing privilege escalation.
2. **Health Probes**: 
   - `Liveness`: Point your orchestrator to `GET /health/live`
   - `Readiness`: Point your orchestrator to `GET /health/ready` (validates DB/Redis).
3. **Graceful Termination**: Handles `SIGTERM` directly. OpenShift will send `SIGTERM`, and the app will halt queue ingestion, finish active transmissions, and close Postgres connections cleanly before exiting.

## 3. Scaling Recommendations

### API Service
- **Type**: Stateless, IO bound.
- **Scaling**: Horizontally scalable behind a LoadBalancer. 
- **Limits**: Set CPU limit to `500m`, Memory to `512Mi`.

### Worker Service
- **Type**: Stateful connection (SMTP), highly IO bound, temporary storage bound.
- **Scaling**: Horizontally scalable. 
- **Concurrency**: Adjust `WORKER_CONCURRENCY` environment variable (default: 20). If scaling pods, lower concurrency per pod to prevent SMTP rate-limiting exhaustion.
- **Limits**: Set CPU limit to `1000m`, Memory to `1Gi` (due to attachment buffers).

### Redis
- **Type**: In-memory, persistent options enabled.
- **Scaling**: Redis 7 Cluster or Sentinel. Ensure sufficient memory for queue backlog.

### PostgreSQL
- **Scaling**: Scale vertically initially. Use PgBouncer if API replica counts exceed 20, to prevent connection exhaustion.
