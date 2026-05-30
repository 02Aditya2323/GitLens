#!/bin/bash
# ════════════════════════════════════════════════════════════════
# GitLens — Startup Script
# Boots MariaDB first, waits for it to be healthy, then starts Node.
# MariaDB is 100% MySQL-compatible (mysql2 driver works seamlessly)
# ════════════════════════════════════════════════════════════════
set -e

echo "🔄 Starting MariaDB service..."
service mariadb start

echo "⏳ Waiting for MariaDB to be ready..."
for i in $(seq 1 30); do
  if mysqladmin ping --silent 2>/dev/null; then
    echo "✅ MariaDB is ready!"
    break
  fi
  echo "   Attempt $i/30 — MariaDB not ready yet, waiting 2s..."
  sleep 2
done

# Verify MariaDB is actually up
if ! mysqladmin ping --silent 2>/dev/null; then
  echo "❌ MariaDB failed to start after 60 seconds. Exiting."
  exit 1
fi

# Create the database and set root password if not already done
echo "🗃 Ensuring database '${DB_NAME:-github_analyzer}' exists..."
mysql -u root -e "
  CREATE DATABASE IF NOT EXISTS \`${DB_NAME:-github_analyzer}\`;
  SET PASSWORD FOR 'root'@'localhost' = PASSWORD('${DB_PASSWORD:-rootpass}');
  FLUSH PRIVILEGES;
" 2>/dev/null || true

echo "🚀 Starting Node.js application..."
exec node /app/src/server.js
