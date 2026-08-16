const express = require("express");

// API currently exposes only read-only GET endpoints and does not use cookie-based sessions.
// CSRF protection must be revisited if state-changing authenticated browser routes are added.
const app = express(); // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "DevSecOps Secure Pipeline"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});