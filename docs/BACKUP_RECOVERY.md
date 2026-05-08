# Backup and Recovery Considerations

This document outlines the disaster recovery architecture for the Mailer Platform.

## 1. PostgreSQL Strategy
PostgreSQL stores two critical tiers of data:
1. **Core Configuration**: SMTP Accounts, API Keys, and Permissions.
2. **Audit Logs**: Email Job history.

### Backup Strategy
- Use **pg_dump** daily for Core Configuration.
- Use **WAL archiving** (e.g., pgBackRest / WAL-G) for Point-In-Time-Recovery (PITR).
- If disk space is an issue, exclude the `email_jobs` table from standard logical backups, but retain it in physical snapshots.

## 2. Redis Persistence Strategy
Redis holds the active BullMQ `email-delivery` queue and rate limit sliding windows.
- The platform configures Redis with `--appendonly yes` (AOF) in `docker-compose.yml`.
- **Recommendation**: In production, configure AOF rewrite rules and backup the `appendonly.aof` file if avoiding lost queues is strictly required during a total container failure.

## 3. Credential Recovery Warning
**SMTP Passwords** are symmetrically encrypted using `AES-256-GCM`.
- The encryption algorithm requires the `SMTP_ENCRYPTION_KEY` environment variable.
- **CRITICAL**: If the `SMTP_ENCRYPTION_KEY` is lost, ALL SMTP connections will permanently fail. The ciphertexts inside the database cannot be reverse engineered. You MUST backup this environment variable securely in a vault (e.g., HashiCorp Vault, AWS Secrets Manager).

**API Keys** are hashed using `SHA-256`. 
- They cannot be recovered. If an API key is lost by a client, the administrator must rotate the key by deleting the old one and provisioning a new one via the Dashboard.

## 4. Disaster Recovery Scenarios

**Scenario A: Redis crashes and loses all data**
- Rate limits reset to zero.
- Any emails that were in `queued` state in Postgres but lost from Redis will stay `queued` indefinitely. 
- *Recovery*: Run a script to identify `email_jobs` where `status = 'queued'` and `created_at` > 1 hour ago, and hit the Resend API.

**Scenario B: Worker crash during attachment download**
- The Worker runs defensive `finally` blocks to delete orphans. 
- At startup, the worker executes `startupTempCleanupScan()` to purge lingering `mailer_att_*` temporary files older than 24 hours.

**Scenario C: Database Corruption**
- Restore from WAL. 
- Due to UUID primary keys, restoring partial backups will not cause ID collision issues with newly generated API requests.
