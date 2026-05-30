# ════════════════════════════════════════════════════════════════
# GitLens — Single-Container Dockerfile
# Runs MariaDB + Node.js 20 in one image (for Render free tier)
# MariaDB is 100% MySQL-compatible & available in Debian Bookworm
# ════════════════════════════════════════════════════════════════

FROM node:20-bookworm-slim

# ── System packages ───────────────────────────────────────────────
# Install MariaDB (MySQL-compatible) + curl for health probing
# mariadb-server/client are in Debian Bookworm default repos
RUN apt-get update && apt-get install -y \
      mariadb-server \
      mariadb-client \
      curl \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

# ── MariaDB Prep ──────────────────────────────────────────────────
# Fix run directory and data directory permissions for MariaDB
RUN mkdir -p /var/run/mysqld \
    && chown -R mysql:mysql /var/run/mysqld /var/lib/mysql \
    && chmod 755 /var/run/mysqld

# Bind MariaDB to 127.0.0.1 only (not exposed to internet)
RUN echo "[mysqld]\nbind-address = 127.0.0.1\nskip-host-cache\nskip-name-resolve" \
    >> /etc/mysql/mariadb.conf.d/50-server.cnf

# ── App Setup ─────────────────────────────────────────────────────
WORKDIR /app

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Copy and make the startup script executable
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# ── Environment defaults ──────────────────────────────────────────
# These are overridden by Render's environment variables at runtime
ENV NODE_ENV=production \
    PORT=5000 \
    DB_HOST=127.0.0.1 \
    DB_PORT=3306 \
    DB_USER=root \
    DB_NAME=github_analyzer

# DB_PASSWORD and GITHUB_TOKEN must be set in Render's dashboard
# DB_PASSWORD defaults to 'rootpass' if not set (set it in Render!)

EXPOSE 5000

# ── Boot ──────────────────────────────────────────────────────────
# The entrypoint script:
#   1. Starts MySQL
#   2. Waits until MySQL is healthy
#   3. Creates the database if it doesn't exist
#   4. Starts Node.js
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
