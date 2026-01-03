# Deployment Guide

## Overview

Life Tracker is deployed as a Docker container on a VPS, served via Caddy reverse proxy with automatic HTTPS.

## Architecture

```
GitHub → GitHub Actions → Docker Image (ghcr.io) → VPS → Docker Container → Caddy → tracker.timostermann.io
```

## Prerequisites

- VPS with Docker and Docker Compose installed
- Caddy reverse proxy running (from server-setup)
- GitHub Container Registry access
- DNS A record: `tracker.timostermann.io` → VPS IP

## Docker Setup

### Dockerfile

The app uses SvelteKit's `adapter-node` and runs as a Node.js server.

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
RUN npm ci --production
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
```

### docker-compose.yml (VPS)

```yaml
version: "3.8"

services:
  life-tracker:
    image: ghcr.io/timostermann/life-tracker:latest
    container_name: life-tracker
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_PATH=/data/db.sqlite
    volumes:
      - /mnt/app-data/life-tracker:/data
    networks:
      - caddy_network
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3000/api/health')",
        ]
      interval: 30s
      timeout: 5s
      retries: 3

networks:
  caddy_network:
    external: true
```

## GitHub Actions CI/CD

### Workflow: `.github/workflows/deploy.yml`

```yaml
name: Build, Push, and Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build for scan
        uses: docker/build-push-action@v5
        with:
          context: .
          load: true
          tags: local/${{ github.repository }}:scan

      - name: Scan for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: local/${{ github.repository }}:scan
          format: table
          exit-code: "1"
          ignore-unfixed: true
          severity: CRITICAL,HIGH

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/server-config/apps/life-tracker
            docker compose pull
            docker compose up -d --force-recreate

            # Wait for health check
            sleep 5
            if docker compose ps life-tracker | grep -q "Up (healthy)"; then
              echo "✓ Life Tracker deployed successfully"
            else
              echo "✗ Health check failed"
              exit 1
            fi
```

## Caddy Configuration

Add to `server-setup/server-config/caddy/Caddyfile`:

```caddy
# Life Tracker app
tracker.timostermann.io {
    import security_headers
    import standard_logs
    import rate_limits

    reverse_proxy life-tracker:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}

        # Health check
        health_uri /api/health
        health_interval 30s
        health_timeout 5s
    }

    encode gzip zstd
}
```

## Database Location

SQLite database: `/mnt/app-data/life-tracker/db.sqlite`

### Backup

Backed up automatically via existing VPS backup script (daily at 2 AM).

Manual backup:

```bash
sudo cp /mnt/app-data/life-tracker/db.sqlite \
       /mnt/app-data/backups/life-tracker-$(date +%Y%m%d).sqlite
```

## Environment Variables

### Production (VPS)

Set in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - DATABASE_PATH=/data/db.sqlite
  - SESSION_SECRET=${SESSION_SECRET}
```

### GitHub Secrets

Required secrets in GitHub repository:

- `VPS_HOST`: VPS IP or hostname
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: SSH private key
- `SESSION_SECRET`: Random secret for sessions

## VPS Setup

### Initial Setup

1. Create app directory:

```bash
mkdir -p ~/server-config/apps/life-tracker
cd ~/server-config/apps/life-tracker
```

2. Create `docker-compose.yml` (see above)

3. Create data directory:

```bash
sudo mkdir -p /mnt/app-data/life-tracker
```

4. Login to GitHub Container Registry:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

5. Start container:

```bash
docker compose up -d
```

### Update Caddy

1. Add tracker configuration to Caddyfile (see above)

2. Reload Caddy:

```bash
cd ~/server-config/caddy
docker compose up -d --force-recreate caddy
```

## Monitoring

### Health Check

Endpoint: `https://tracker.timostermann.io/api/health`

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-02T16:00:00Z"
}
```

### Logs

View application logs:

```bash
docker logs -f life-tracker
```

View Caddy logs:

```bash
docker logs -f caddy
```

### Uptime Monitoring

Add to Uptime Kuma (uptime.timostermann.io):

- **Name:** Life Tracker
- **URL:** https://tracker.timostermann.io/api/health
- **Interval:** 60 seconds
- **Retry:** 3 times

## Deployment Workflow

1. Commit changes to main branch
2. GitHub Actions automatically:
   - Builds Docker image
   - Scans for vulnerabilities
   - Pushes to ghcr.io
   - SSHs to VPS
   - Pulls new image
   - Recreates container
   - Verifies health check

## Manual Deployment

If needed, deploy manually:

```bash
# On VPS
cd ~/server-config/apps/life-tracker
docker compose pull
docker compose up -d --force-recreate
docker compose ps
```

## Rollback

Rollback to previous image:

```bash
# On VPS
cd ~/server-config/apps/life-tracker

# Pull specific commit SHA
docker pull ghcr.io/timostermann/life-tracker:main-abc1234

# Update docker-compose.yml to use specific tag
docker compose up -d --force-recreate
```

## Database Migration

On first deployment, database is initialized automatically with schema and seed data.

For future migrations:

```bash
# Migrations run automatically on container start
# Or manually:
docker exec life-tracker node build/migrate.js
```

## SSL/TLS

Caddy handles SSL automatically via Let's Encrypt:

- Certificates auto-renewed
- HTTP → HTTPS redirect automatic
- HSTS headers configured

## Performance

### Caching

- Static assets cached via Caddy
- API responses not cached (dynamic data)
- Database in-memory cache (SQLite WAL mode)

### Scaling

Current setup sufficient for 2 users. If needed:

- Add Redis for session storage
- Add PostgreSQL for multi-instance
- Add load balancer

## Troubleshooting

### Container won't start

```bash
docker logs life-tracker
docker compose ps
```

### Database locked

SQLite WAL mode prevents most locks. If persistent:

```bash
docker exec life-tracker sqlite3 /data/db.sqlite "PRAGMA wal_checkpoint(TRUNCATE);"
```

### High memory usage

Check container stats:

```bash
docker stats life-tracker
```

Restart if needed:

```bash
docker compose restart life-tracker
```

### Can't connect

1. Check DNS: `nslookup tracker.timostermann.io`
2. Check firewall: `sudo ufw status`
3. Check Caddy: `docker logs caddy`
4. Check app: `docker logs life-tracker`

## Security

### Regular Updates

Update dependencies monthly:

```bash
npm update
npm audit fix
```

### Monitoring

- Trivy scans on every build (fails on CRITICAL/HIGH)
- Dependabot enabled for automatic PRs
- Uptime Kuma monitors availability

### Backups

- Database backed up daily (2 AM)
- Retained for 30 days
- Test restore monthly

## Future Enhancements

### Phase 3: Service Worker

For reminders, add background task:

```yaml
# In docker-compose.yml
services:
  life-tracker-cron:
    image: ghcr.io/timostermann/life-tracker:latest
    command: node build/cron.js
    # Check reminders every minute
```

### Monitoring Integration

Add to Grafana:

- Request rate
- Response times
- Error rates
- Database size
