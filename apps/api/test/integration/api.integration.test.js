const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.example') });

const TEST_DB_NAME = process.env.TEST_DB_NAME || '_mailer_db_test';
const TEST_REDIS_DB = process.env.TEST_REDIS_DB || '15';
const ORIGINAL_DB_NAME = process.env.DB_NAME || 'mailer_db';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = TEST_DB_NAME;
process.env.REDIS_DB = TEST_REDIS_DB;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-jwt-secret';
process.env.JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

const smtpFixture = {
  host: process.env.SMTP_TEST_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.SMTP_TEST_PORT || 587),
  secure: false,
  username: process.env.SMTP_TEST_USERNAME || '3c51249b45b9d3',
  password: process.env.SMTP_TEST_PASSWORD || '7f7ce58ea81be2',
  from_email: process.env.SMTP_TEST_FROM_EMAIL || '3c51249b45b9d3@mailtrap.io',
  from_name: process.env.SMTP_TEST_FROM_NAME || '3c51249b45b9d3',
};

let server;
let baseUrl;

test('API integration flow covers admin and public APIs', async () => {
  try {
    await recreateTestDatabase();

    const { app } = require('../../dist/app');
    const { sequelize } = require('@mailer/database');
    const { seedDefaultAdmin } = require('../../dist/routes/admin/auth');

    await sequelize.sync({ force: true });
    await seedDefaultAdmin();

    server = await listen(app);
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    await expectOk(await request('GET', '/health/live'));
    await expectOk(await request('GET', '/health/ready'));

    const docs = await request('GET', '/docs/openapi.json');
    assert.equal(docs.status, 200, docs.text);
    assert.equal(docs.body.info.title, 'SMTP Forge Public API');

    const status = await request('GET', '/api/v1/admin/auth/status');
    await expectSuccess(status);
    assert.equal(status.body.data.isDefaultState, true);

    const login = await request('POST', '/api/v1/admin/auth/login', {
      body: { username: 'admin', password: 'admin' },
    });
    await expectSuccess(login);
    assert.equal(login.body.data.must_change_password, true);
    const firstAdminToken = login.body.data.token;

    const changedPassword = 'integration-admin-password-1';
    const passwordChange = await request('POST', '/api/v1/admin/auth/change-password', {
      token: firstAdminToken,
      body: { current_password: 'admin', new_password: changedPassword },
    });
    await expectSuccess(passwordChange);
    const adminToken = passwordChange.body.data.token;

    const draftSmtpTest = await request('POST', '/api/v1/admin/smtp/test', {
      token: adminToken,
      body: {
        host: smtpFixture.host,
        port: smtpFixture.port,
        secure: smtpFixture.secure,
        username: smtpFixture.username,
        password: smtpFixture.password,
      },
    });
    await expectSuccess(draftSmtpTest);
    assert.equal(draftSmtpTest.body.data.success, true);

    const smtpAccount = await createSmtp(adminToken, 'Mailtrap integration');
    const smtpId = smtpAccount.id;
    assert.equal(smtpAccount.host, smtpFixture.host);
    assert.equal(smtpAccount.password_encrypted, undefined);

    await expectSuccess(await request('GET', '/api/v1/admin/smtp', { token: adminToken }));
    const smtpGet = await request('GET', `/api/v1/admin/smtp/${smtpId}`, { token: adminToken });
    await expectSuccess(smtpGet);
    assert.equal(smtpGet.body.data.id, smtpId);

    const smtpUpdate = await request('PUT', `/api/v1/admin/smtp/${smtpId}`, {
      token: adminToken,
      body: { from_name: 'SMTP Forge Test Sender', retry_attempts: 2 },
    });
    await expectSuccess(smtpUpdate);
    assert.equal(smtpUpdate.body.data.from_name, 'SMTP Forge Test Sender');

    const storedSmtpTest = await request('POST', `/api/v1/admin/smtp/${smtpId}/test`, {
      token: adminToken,
    });
    await expectSuccess(storedSmtpTest);
    assert.equal(storedSmtpTest.body.data.success, true);

    const apiKeyCreate = await request('POST', '/api/v1/admin/api-keys', {
      token: adminToken,
      body: { name: 'Integration key', rate_limit_per_hour: 100, is_active: true },
    });
    await expectSuccess(apiKeyCreate, 201);
    const apiKeyId = apiKeyCreate.body.data.id;
    const publicApiKey = apiKeyCreate.body.data.api_key;
    assert.match(publicApiKey, /^mlr_live_[a-f0-9]{64}$/);
    assert.equal(apiKeyCreate.body.data.api_key_hash, undefined);

    await expectSuccess(await request('GET', '/api/v1/admin/api-keys', { token: adminToken }));
    const apiKeyGet = await request('GET', `/api/v1/admin/api-keys/${apiKeyId}`, { token: adminToken });
    await expectSuccess(apiKeyGet);
    assert.equal(apiKeyGet.body.data.id, apiKeyId);

    const apiKeyUpdate = await request('PUT', `/api/v1/admin/api-keys/${apiKeyId}`, {
      token: adminToken,
      body: { name: 'Integration key updated', rate_limit_per_hour: 200 },
    });
    await expectSuccess(apiKeyUpdate);
    assert.equal(apiKeyUpdate.body.data.name, 'Integration key updated');

    const permission = await request('POST', `/api/v1/admin/api-keys/${apiKeyId}/smtp-permissions`, {
      token: adminToken,
      body: { smtp_account_id: smtpId },
    });
    await expectSuccess(permission, 201);

    const permissions = await request('GET', `/api/v1/admin/api-keys/${apiKeyId}/smtp-permissions`, {
      token: adminToken,
    });
    await expectSuccess(permissions);
    assert.equal(permissions.body.data.length, 1);
    assert.equal(permissions.body.data[0].smtp_account_id, smtpId);

    const publicUnauthorized = await request('GET', '/api/v1/smtp-accounts');
    assert.equal(publicUnauthorized.status, 401);

    const publicSmtp = await request('GET', '/api/v1/smtp-accounts', { apiKey: publicApiKey });
    await expectSuccess(publicSmtp);
    assert.equal(publicSmtp.body.data.length, 1);
    assert.equal(publicSmtp.body.data[0].id, smtpId);

    const queuedEmail = await request('POST', '/api/v1/emails', {
      apiKey: publicApiKey,
      body: {
        smtp_account: smtpId,
        to: ['recipient@example.com'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'SMTP Forge integration test',
        html: '<p>Queued from the integration suite.</p>',
        attachments: [
          { filename: 'readme.txt', url: 'https://example.com/readme.txt' },
        ],
      },
    });
    await expectSuccess(queuedEmail, 202);
    assert.equal(queuedEmail.body.data.status, 'queued');
    assert.ok(queuedEmail.body.data.job_id);

    const logs = await request('GET', '/api/v1/admin/logs?recipient=recipient@example.com', {
      token: adminToken,
    });
    await expectSuccess(logs);
    assert.equal(logs.body.data.data.length, 1);
    const emailJobId = logs.body.data.data[0].id;

    const resend = await request('POST', `/api/v1/admin/logs/${emailJobId}/resend`, {
      token: adminToken,
    });
    await expectSuccess(resend, 201);
    assert.ok(resend.body.data.new_job_id);

    for (const pathName of [
      '/api/v1/admin/metrics/dashboard',
      '/api/v1/admin/metrics/platform',
      '/api/v1/admin/metrics/workers',
      '/api/v1/admin/metrics/timeseries',
    ]) {
      await expectSuccess(await request('GET', pathName, { token: adminToken }));
    }

    const notificationCreate = await request('POST', '/api/v1/admin/notifications', {
      token: adminToken,
      body: {
        name: 'Integration Slack webhook',
        type: 'slack',
        config: { webhook_url: 'http://127.0.0.1:1/test-webhook' },
        is_enabled: true,
      },
    });
    assert.equal(notificationCreate.status, 201, notificationCreate.text);
    assert.equal(notificationCreate.body.name, 'Integration Slack webhook');
    const notificationId = notificationCreate.body.id;

    const notificationList = await request('GET', '/api/v1/admin/notifications', {
      token: adminToken,
    });
    assert.equal(notificationList.status, 200, notificationList.text);
    assert.equal(notificationList.body.length, 1);

    const notificationUpdate = await request('PATCH', `/api/v1/admin/notifications/${notificationId}`, {
      token: adminToken,
      body: { is_enabled: false },
    });
    assert.equal(notificationUpdate.status, 200, notificationUpdate.text);
    assert.equal(notificationUpdate.body.is_enabled, false);

    const missingNotificationTest = await request('POST', '/api/v1/admin/notifications/00000000-0000-0000-0000-000000000000/test', {
      token: adminToken,
    });
    assert.equal(missingNotificationTest.status, 404, missingNotificationTest.text);

    const notificationDelete = await request('DELETE', `/api/v1/admin/notifications/${notificationId}`, {
      token: adminToken,
    });
    assert.equal(notificationDelete.status, 204, notificationDelete.text);

    await exerciseDeleteEndpoints(adminToken);
  } finally {
    await cleanupRuntime();
    await dropTestDatabase();
  }
});

async function createSmtp(token, name) {
  const response = await request('POST', '/api/v1/admin/smtp', {
    token,
    body: {
      name,
      host: smtpFixture.host,
      port: smtpFixture.port,
      secure: smtpFixture.secure,
      username: smtpFixture.username,
      password: smtpFixture.password,
      from_email: smtpFixture.from_email,
      from_name: smtpFixture.from_name,
      retry_attempts: 3,
      rate_limit_per_hour: 1000,
      is_active: true,
      ignore_tls_errors: false,
    },
  });
  await expectSuccess(response, 201);
  return response.body.data;
}

async function exerciseDeleteEndpoints(adminToken) {
  const disposableSmtp = await createSmtp(adminToken, 'Disposable Mailtrap integration');
  const disposableApiKey = await request('POST', '/api/v1/admin/api-keys', {
    token: adminToken,
    body: { name: 'Disposable integration key', rate_limit_per_hour: 10, is_active: true },
  });
  await expectSuccess(disposableApiKey, 201);

  const apiKeyId = disposableApiKey.body.data.id;
  const smtpId = disposableSmtp.id;

  await expectSuccess(await request('POST', `/api/v1/admin/api-keys/${apiKeyId}/smtp-permissions`, {
    token: adminToken,
    body: { smtp_account_id: smtpId },
  }), 201);

  await expectSuccess(await request('DELETE', `/api/v1/admin/api-keys/${apiKeyId}/smtp-permissions/${smtpId}`, {
    token: adminToken,
  }));

  await expectSuccess(await request('DELETE', `/api/v1/admin/api-keys/${apiKeyId}`, {
    token: adminToken,
  }));

  await expectSuccess(await request('DELETE', `/api/v1/admin/smtp/${smtpId}`, {
    token: adminToken,
  }));
}

async function request(method, pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.apiKey) headers['x-mailer-api-key'] = options.apiKey;

  let body;
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body,
  });

  const text = await response.text();
  let parsedBody = null;
  if (text) {
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = text;
    }
  }

  return {
    status: response.status,
    headers: response.headers,
    body: parsedBody,
    text,
  };
}

async function expectOk(response) {
  assert.equal(response.status, 200, response.text);
}

async function expectSuccess(response, status = 200) {
  assert.equal(response.status, status, response.text);
  assert.equal(response.body.success, true, response.text);
}

async function listen(app) {
  const httpServer = app.listen(0);
  await new Promise((resolve, reject) => {
    httpServer.once('listening', resolve);
    httpServer.once('error', reject);
  });
  return httpServer;
}

async function cleanupRuntime() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = undefined;
  }

  try {
    const { emailQueue } = require('../../dist/config/queue');
    const { redisClient } = require('../../dist/config/redis');

    if (redisClient.status === 'ready') {
      await emailQueue.obliterate({ force: true });
      await deleteRedisKeys(redisClient, 'rl:app:*');
    }

    await withTimeout(emailQueue.close(), 2000).catch(() => emailQueue.disconnect());
    redisClient.disconnect();
  } catch {
    // The test may fail before Redis-backed modules load.
  }

  try {
    const { sequelize } = require('@mailer/database');
    await sequelize.close();
  } catch {
    // The test may fail before the database package loads.
  }
}

async function deleteRedisKeys(redisClient, pattern) {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    cursor = nextCursor;
  } while (cursor !== '0');
}

async function recreateTestDatabase() {
  await dropDatabase(TEST_DB_NAME);
  const client = await connectMaintenanceDatabase();
  try {
    await client.query(`CREATE DATABASE ${quoteIdentifier(TEST_DB_NAME)}`);
  } finally {
    await client.end();
  }
}

async function dropTestDatabase() {
  await dropDatabase(TEST_DB_NAME);
}

async function dropDatabase(databaseName) {
  const client = await connectMaintenanceDatabase();
  try {
    await client.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [databaseName]
    );
    await client.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
  } finally {
    await client.end();
  }
}

async function connectMaintenanceDatabase() {
  const candidates = [
    process.env.DB_MAINTENANCE_NAME || 'postgres',
    ORIGINAL_DB_NAME,
  ].filter((value, index, list) => value && value !== TEST_DB_NAME && list.indexOf(value) === index);

  let lastError;
  for (const database of candidates) {
    const client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database,
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});
    }
  }

  throw lastError;
}

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe database identifier: ${identifier}`);
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), timeoutMs)),
  ]);
}
