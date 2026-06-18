const assert = require('node:assert/strict');
const test = require('node:test');

// Set environment variables before requiring the app
process.env.CORS_ORIGIN = 'http://example.com,https://test.example.org';
process.env.NODE_ENV = 'production';

// Mock dependencies if required, but since we only hit /health/live which doesn't use DB/Redis, 
// we don't need database or redis mock for CORS check.
const { app } = require('../../dist/app');

let server;
let baseUrl;

async function listen(app) {
  const httpServer = app.listen(0);
  await new Promise((resolve, reject) => {
    httpServer.once('listening', resolve);
    httpServer.once('error', reject);
  });
  return httpServer;
}

test('CORS verification suite', async (t) => {
  server = await listen(app);
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await t.test('Allowed origins from comma-separated CORS_ORIGIN list', async () => {
      // http://example.com is in CORS_ORIGIN
      const res1 = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://example.com' }
      });
      assert.equal(res1.status, 200);
      assert.equal(res1.headers.get('access-control-allow-origin'), 'http://example.com');

      // https://test.example.org is in CORS_ORIGIN
      const res2 = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'https://test.example.org' }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('access-control-allow-origin'), 'https://test.example.org');

      // http://another.com is NOT in CORS_ORIGIN
      const res3 = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://another.com' }
      });
      // CORS error results in standard Express error handler response (500 Unhandled Exception)
      assert.equal(res3.status, 500);
      assert.equal(res3.headers.get('access-control-allow-origin'), null);
    });

    await t.test('CORS behavior in production mode', async () => {
      process.env.NODE_ENV = 'production';

      // Development/private IPs should NOT be allowed in production mode
      const res1 = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://10.1.3.240:3001' }
      });
      assert.equal(res1.status, 500);
      assert.equal(res1.headers.get('access-control-allow-origin'), null);

      const res2 = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://localhost:3000' }
      });
      assert.equal(res2.status, 500);
      assert.equal(res2.headers.get('access-control-allow-origin'), null);
    });

    await t.test('CORS behavior in development mode (localhost and private IPs allowed)', async () => {
      process.env.NODE_ENV = 'development';

      // localhost should be allowed
      const resLocalhost = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://localhost:3000' }
      });
      assert.equal(resLocalhost.status, 200);
      assert.equal(resLocalhost.headers.get('access-control-allow-origin'), 'http://localhost:3000');

      // 127.0.0.1 should be allowed
      const resLoopback = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://127.0.0.1:3001' }
      });
      assert.equal(resLoopback.status, 200);
      assert.equal(resLoopback.headers.get('access-control-allow-origin'), 'http://127.0.0.1:3001');

      // Private IP 10.1.3.240 should be allowed
      const resPrivate10 = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://10.1.3.240:3001' }
      });
      assert.equal(resPrivate10.status, 200);
      assert.equal(resPrivate10.headers.get('access-control-allow-origin'), 'http://10.1.3.240:3001');

      // Private IP 192.168.1.100 should be allowed
      const resPrivate192 = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://192.168.1.100:3000' }
      });
      assert.equal(resPrivate192.status, 200);
      assert.equal(resPrivate192.headers.get('access-control-allow-origin'), 'http://192.168.1.100:3000');

      // Private IP 172.16.0.5 should be allowed
      const resPrivate172 = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'http://172.16.0.5:8080' }
      });
      assert.equal(resPrivate172.status, 200);
      assert.equal(resPrivate172.headers.get('access-control-allow-origin'), 'http://172.16.0.5:8080');

      // Public malicious IP/domain should NOT be allowed
      const resMalicious = await fetch(`${baseUrl}/health/live`, {
        method: 'GET',
        headers: { 'Origin': 'https://malicious.com' }
      });
      assert.equal(resMalicious.status, 500);
      assert.equal(resMalicious.headers.get('access-control-allow-origin'), null);
    });
  } finally {
    // Cleanup server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Disconnect Redis and Queue clients to let test process exit
    try {
      const { redisClient } = require('../../dist/config/redis');
      redisClient.disconnect();
    } catch {}

    try {
      const { emailQueue } = require('../../dist/config/queue');
      await emailQueue.close();
    } catch {}

    try {
      const { sequelize } = require('@mailer/database');
      await sequelize.close();
    } catch {}
  }
});
