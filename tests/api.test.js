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

test('POST /api/feedback with name exactly 50 characters returns 201', async () => {
  const name = 'a'.repeat(50);
  const res = await request(app)
    .post('/api/feedback')
    .send({ name, message: 'Valid message' });

  assert.equal(res.status, 201);
  assert.equal(res.body.name, name);
});

test('POST /api/feedback with name of 51 characters returns 400', async () => {
  const res = await request(app)
    .post('/api/feedback')
    .send({ name: 'a'.repeat(51), message: 'Valid message' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'name must be 50 characters or fewer');
});

test('POST /api/feedback with message exactly 3 characters returns 201', async () => {
  const res = await request(app)
    .post('/api/feedback')
    .send({ name: 'Bob', message: 'abc' });

  assert.equal(res.status, 201);
  assert.equal(res.body.message, 'abc');
});

test('POST /api/feedback with empty JSON body returns 400', async () => {
  const res = await request(app).post('/api/feedback').send({});

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'name is required');
});

test('GET /api/feedback returns items sorted newest-first', async () => {
  const older = await request(app)
    .post('/api/feedback')
    .send({ name: 'SortOlder', message: 'First created' });
  assert.equal(older.status, 201);

  const newer = await request(app)
    .post('/api/feedback')
    .send({ name: 'SortNewer', message: 'Second created' });
  assert.equal(newer.status, 201);

  const res = await request(app).get('/api/feedback');
  assert.equal(res.status, 200);

  const ids = res.body.map((item) => item.id);
  const newerIndex = ids.indexOf(newer.body.id);
  const olderIndex = ids.indexOf(older.body.id);
  assert.ok(newerIndex !== -1);
  assert.ok(olderIndex !== -1);
  assert.ok(newerIndex < olderIndex, 'newer item should appear before older item');
});

test('GET /api/nothing returns 404 JSON', async () => {
  const res = await request(app).get('/api/nothing');

  assert.equal(res.status, 404);
  assert.equal(res.type, 'application/json');
  assert.equal(res.body.error, 'not found');
});
