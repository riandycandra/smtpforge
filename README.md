# SMTP Forge

A powerful, self-hosted email relay service designed for developers who need full control over their email delivery pipeline. Built to handle complex SMTP configurations, support self-signed certificates, and provide a clean dashboard for monitoring.

---

## 🚀 Why Use This? (The Centralization Mission)

In a typical corporate environment, dozens of internal apps need to send emails. Traditionally, each app stores its own SMTP credentials (username/password) in its own `.env` files or databases. This creates a **security and maintenance nightmare**:
- **Security Risk**: Sensitive SMTP passwords are scattered across many servers and source code repositories.
- **Maintenance Overhead**: If an SMTP password changes (e.g., due to a password rotation policy), every single app must be updated and redeployed.
- **Credential Leakage**: Developers have direct access to production SMTP credentials.

**This platform solves this by centralizing the mailer function:**
- **Zero-Credential Integration**: Internal apps only need an **API Key**. They never see or store the actual SMTP passwords.
- **Single Point of Rotation**: Change an SMTP password in this dashboard once, and all your company apps are updated instantly without redeployment.
- **Scoped Permissions**: Grant specific apps (API Keys) access to specific mail servers (SMTP Accounts).
- **Audit & Compliance**: Every email sent by any internal app is logged here, providing a central audit trail for the company.
- **TLS Flexibility**: Supports internal mail servers using self-signed certificates that standard libraries often reject.

---

## 🛠️ Getting Started

### Prerequisites
- Docker and Docker Compose installed.

### Installation & Running
1. **Clone the repository** (if you haven't already).
2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```
3. **Access the Dashboard**:
   - URL: `http://localhost:3000`
   - Default Credentials:
     - **Username**: `admin`
     - **Password**: `admin`

---

## 🔌 API Documentation

Integrate this mailer into your 3rd-party applications using standard HTTP requests.

### Authentication
All requests to the public API must include the following header:
`X-Mailer-Api-Key: YOUR_API_KEY_HERE`

### Send Email
**Endpoint**: `POST /api/v1/emails`

**Payload (JSON)**:
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `to` | `string` or `array` | Yes | Recipient email(s). |
| `subject` | `string` | Yes | The email subject. |
| `html` | `string` | Yes | The HTML body of the email. |
| `text` | `string` | No | Plain text fallback. |
| `attachments` | `array` | No | List of files to attach. Each object requires `filename` and `url`. |
| `smtp_account` | `UUID` | No | Specific account to use. If omitted, the platform auto-selects an active account. |

**Example (Bash)**:
```bash
curl -X POST http://localhost:3000/api/v1/emails \
  -H "Content-Type: application/json" \
  -H "X-Mailer-Api-Key: your_key_here" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello from SMTP Forge!</h1>"
  }'
```

**Example with Attachments**:
```bash
curl -X POST http://localhost:3000/api/v1/emails \
  -H "Content-Type: application/json" \
  -H "X-Mailer-Api-Key: your_key_here" \
  -d '{
    "to": "user@example.com",
    "subject": "Email with Attachment",
    "html": "<p>See the attached file.</p>",
    "attachments": [
      {
        "filename": "cat.jpg",
        "url": "https://example.com/images/cat.jpg"
      }
    ]
  }'
```

**Response (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "message": "Email queued successfully",
    "job_id": "bullet-job-123",
    "status": "queued"
  }
}
```

### 📎 Attachments
SMTP Forge supports sending attachments by providing a public URL. The worker will download the file, verify its size, and attach it to the email.
- **Max File Size**: 50MB per file.
- **Method**: Provide a JSON array of objects with `filename` and `url`.
- **Cleanup**: Temporary files are automatically purged from the worker node after delivery.

---

## 🗺️ Future Roadmap & Enhancements

- [ ] **Webhooks**: Receive POST notifications when an email is successfully sent or fails.
- [x] **Analytics Dashboard**: Visual charts for delivery success rates and latency.
- [x] **Attachments Support**: Upload and send files via the API.
- [x] **Rate Limiting**: Per-key and per-SMTP account throughput control.
- [ ] **Multi-Admin Support**: Manage multiple admin users with different permission levels.
- [x] **JWT Authentication**: Transition from static tokens to signed JWTs for improved security.

---

## 📁 Data Persistence
Postgres and Redis data are stored in the `./data` directory. This directory is ignored by Git but ensures your settings and logs survive container restarts.
