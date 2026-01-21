# Stage 1: Builder
FROM node:24-alpine AS builder
WORKDIR /app

# Update npm to latest version (fixes glob and tar vulnerabilities)
RUN npm install -g npm@latest

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files and npm config
COPY package*.json .npmrc ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Runtime
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Update npm to latest version (fixes glob and tar vulnerabilities)
RUN npm install -g npm@latest

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 sveltekit

# Create data directory for SQLite database with proper permissions
RUN mkdir -p /data && \
  chown -R sveltekit:nodejs /data

# Copy built application and dependencies
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package*.json ./
COPY --from=builder --chown=sveltekit:nodejs /app/.npmrc ./

# Install production dependencies only (skip husky prepare script with --ignore-scripts)
# Then rebuild better-sqlite3 to compile native bindings
RUN npm ci --only=production --ignore-scripts && \
  npm rebuild better-sqlite3

USER sveltekit

EXPOSE 3000

# Declare volume for database persistence
VOLUME ["/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "build"]
