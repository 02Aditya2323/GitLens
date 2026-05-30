require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/db');
const { runMigrations } = require('./config/migrate');
const profileRoutes = require('./routes/profileRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static frontend ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Serve Swagger API Docs ────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'GitHub Profile Analyzer API',
    version: '1.0.0',
  });
});

// ── API Routes & Database Middleware ──────────────────────────────────────────
// Custom middleware to ensure migrations run once MySQL is up
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  
  try {
    const success = await runMigrations();
    if (!success) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline. Please start MySQL and verify your credentials in `.env`.'
      });
    }
    next();
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please ensure MySQL is running.',
      error: err.message
    });
  }
});

app.use('/api', profileRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
  }
  // For non-API routes serve the frontend
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong.' });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  console.log('🔄 Booting GitLens server...');
  
  // Test DB connection and run migrations. If offline, don't crash.
  const isDbConnected = await testConnection();
  if (isDbConnected) {
    await runMigrations();
  } else {
    console.warn('⚠️ Server started with MySQL offline. Live database features will be available once MySQL is started.');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 GitHub Profile Analyzer API running at http://localhost:${PORT}`);
    console.log(`🌐 Frontend:       http://localhost:${PORT}`);
    console.log(`📖 API Docs:       http://localhost:${PORT}/api-docs`);
    console.log(`🔍 API Health:     http://localhost:${PORT}/api/health`);
    console.log(`📊 All Profiles:   http://localhost:${PORT}/api/profiles`);
    console.log(`🏆 Leaderboard:    http://localhost:${PORT}/api/leaderboard\n`);
  });
}

boot().catch((err) => {
  console.error('🚨 Severe boot crash:', err);
  process.exit(1);
});
