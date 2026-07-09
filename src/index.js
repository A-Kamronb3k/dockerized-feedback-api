require('dotenv').config();

const app = require('./app');

// Entry point — loads environment variables and starts the HTTP server.
// All route/middleware setup lives in app.js so tests can import the app
// without triggering .listen().
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${NODE_ENV})`);
});
