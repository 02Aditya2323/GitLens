# ════════════════════════════════════════════════════════════════
# GitLens — Dockerfile (Alpine Linux, Node 20)
# ════════════════════════════════════════════════════════════════

# ── Stage 1: install production deps ────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: production image ────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# tini: lightweight init system for proper PID 1 / signal handling
RUN apk add --no-cache tini

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Remove local-only files that shouldn't be in the image
RUN rm -f .env .env.example docker-compose.yml .dockerignore

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

ENV NODE_ENV=production

# Use tini as PID 1 to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
