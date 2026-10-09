# Deploying Mailer Platform to OpenShift (Stateless / External DB & Redis)

This guide walks you through deploying the `mailer-platform` (`web`, `api`, `worker`) to an OpenShift cluster using external PostgreSQL and Redis services (no Persistent Volumes required).

---

## 1. Prerequisites

- OpenShift CLI (`oc`) logged in to your cluster:
  ```bash
  oc login https://api.<cluster-name>.<domain>:6443
  ```
- A project/namespace created:
  ```bash
  oc new-project mailer-platform
  ```

---

## 2. Configure Credentials & Hosts

1. Edit [`deploy/openshift/01-configmap.yaml`](./01-configmap.yaml):
   - Set `DB_HOST` and `DB_PORT` to your external PostgreSQL server.
   - Set `REDIS_HOST` and `REDIS_PORT` to your external Redis server.

2. Edit [`deploy/openshift/02-secrets.yaml`](./02-secrets.yaml):
   - Set `DB_PASSWORD`.
   - Set `REDIS_PASSWORD` (if applicable).
   - Set `SMTP_ENCRYPTION_KEY` (must be exactly 32 characters).
   - Set `JWT_SECRET`.

---

## 3. Apply Manifests

The container images (`riandycandra/mailer-api`, `riandycandra/mailer-worker`, `riandycandra/mailer-web`) are publicly available on Docker Hub, so no image pull secrets are required.

Deploy the components to OpenShift:

```bash
oc apply -f deploy/openshift/01-configmap.yaml
oc apply -f deploy/openshift/02-secrets.yaml
oc apply -f deploy/openshift/10-api-deployment.yaml
oc apply -f deploy/openshift/20-worker-deployment.yaml
oc apply -f deploy/openshift/30-web-deployment.yaml
oc apply -f deploy/openshift/40-routes.yaml
```

---

## 4. Verify the Deployment

---

## 4. Verify the Deployment

1. Check pod status:
   ```bash
   oc get pods -w
   ```
2. Verify API and Worker logs:
   ```bash
   oc logs -l app=mailer-api --tail=50
   oc logs -l app=mailer-worker --tail=50
   ```
3. Get the public route URL:
   ```bash
   oc get route mailer-web
   ```
   Open the generated URL in your browser to access the Web UI and `/docs`.
