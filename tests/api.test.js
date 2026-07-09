const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('GET /health returns 200 and status "ok"', async () => {
  const res = await request(app).get('/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.ok(typeof res.body.uptime === 'number');
});

test('POST /api/feedback with valid {name, message} returns 201 and the created item', async () => {
  const res = await request(app)
    .post('/api/feedback')
    .send({ name: 'Alice', message: 'Great service!' });

  assert.equal(res.status, 201);
  assert.equal(res.body.name, 'Alice');
  assert.equal(res.body.message, 'Great service!');
  assert.ok(res.body.id);
  assert.ok(res.body.createdAt);
});

test('POST /api/feedback with missing message returns 400', async () => {
  const res = await request(app)
    .post('/api/feedback')
    .send({ name: 'Alice' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'message is required');
});

test('POST /api/feedback with a 600-char message returns 400', async () => {
  const res = await request(app)
    .post('/api/feedback')
    .send({ name: 'Alice', message: 'a'.repeat(600) });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'message must be 500 characters or fewer');
});

test('GET /api/feedback returns an array', async () => {
  const res = await request(app).get('/api/feedback');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test('GET /api/feedback/999999 returns 404', async () => {
  const res = await request(app).get('/api/feedback/999999');

  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'feedback not found');
});
