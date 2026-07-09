const express = require('express');
const path = require('path');
const feedbackRouter = require('./routes/feedback');

// App factory — configures Express with routes and middleware but does not start
// a server. Exporting the app separately lets tests import it via supertest
// without calling .listen(), while index.js remains the single entry point
// responsible for reading env vars and binding to a port.
const app = express();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Log every incoming request (method + path)
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Parse JSON request bodies
app.use(express.json());

// Serve static assets from src/public
app.use(express.static(path.join(__dirname, 'public')));

// Health check — used by load balancers and container orchestrators
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Feedback API routes
app.use('/api/feedback', feedbackRouter);

// 404 handler for routes that don't match anything above
app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});

// Central error handler — catches thrown errors and async failures
app.use((err, _req, res, _next) => {
  console.error(err);

  const status = err.status || 500;
  const body = { error: err.message || 'internal server error' };

  // Hide stack traces in production
  if (!isProduction && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
});

module.exports = app;
