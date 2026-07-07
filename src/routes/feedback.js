const express = require('express');

const router = express.Router();

// In-memory store; resets when the process restarts
const feedback = [];
let nextId = 1;

// Validate POST body; returns an error message string or null if valid
function validateFeedback({ name, message }) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return 'name is required';
  }
  if (name.length > 50) {
    return 'name must be 50 characters or fewer';
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return 'message is required';
  }
  if (message.length < 3) {
    return 'message must be at least 3 characters';
  }
  if (message.length > 500) {
    return 'message must be 500 characters or fewer';
  }
  return null;
}

// POST /api/feedback — create a new feedback entry
router.post('/', (req, res) => {
  const error = validateFeedback(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const entry = {
    id: nextId++,
    name: req.body.name.trim(),
    message: req.body.message.trim(),
    createdAt: new Date().toISOString(),
  };

  feedback.push(entry);
  res.status(201).json(entry);
});

// GET /api/feedback — list all entries, newest first
router.get('/', (_req, res) => {
  const sorted = [...feedback].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sorted);
});

// GET /api/feedback/:id — fetch a single entry by id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const entry = feedback.find((item) => item.id === id);

  if (!entry) {
    return res.status(404).json({ error: 'feedback not found' });
  }

  res.json(entry);
});

module.exports = router;
