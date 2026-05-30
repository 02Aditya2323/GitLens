#!/bin/bash
# ════════════════════════════════════════════════════════════════
# GitLens — Startup Script
# Boots MySQL first, waits for it to be healthy, then starts Node.
# ════════════════════════════════════════════════════════════════
set -e

echo "🔄 Starting MySQL service..."
service mysql start

echo "⏳ Waiting for MySQL to be ready..."
for i in $(seq 1 30); do
  if mysqladmin ping --silent 2>/dev/null; then
    echo "✅ MySQL is ready!"
    break
  fi
  echo "   Attempt $i/30 — MySQL not ready yet, waiting 2s..."
  sleep 2
done

# Verify MySQL is actually up
if ! mysqladmin ping --silent 2>/dev/null; then
  echo "❌ MySQL failed to start after 60 seconds. Exiting."
  exit 1
fi

# Create the database and user if not already done
echo "🗃 Ensuring database '${DB_NAME:-github_analyzer}' exists..."
mysql -u root --password="${DB_PASSWORD:-}" -e "
  CREATE DATABASE IF NOT EXISTS \`${DB_NAME:-github_analyzer}\`;
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD:-rootpass}';
  FLUSH PRIVILEGES;
" 2>/dev/null || true

echo "🚀 Starting Node.js application..."
exec node /app/src/server.js
