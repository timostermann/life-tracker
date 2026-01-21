# Deployment Guide

This document describes how Life Tracker is deployed to production following the centralized server-setup pattern.

## Deployment Architecture

Life Tracker follows the deployment pattern defined in the `server-setup` repository:

- **App repo** (this repo): Contains Dockerfile and GitHub Actions workflow
- **Server-setup repo**: Contains centralized Docker Compose config and Caddy reverse proxy config
- **VPS**: Runs all apps via a single `docker-compose.yml` file

## Production Deployment

### Automated Deployment (Recommended)

1. **Push to main branch**:

   ```bash
   git push origin main
   ```

2. **GitHub Actions automatically**:
   - Runs tests (lint, unit tests, e2e tests)
   - Scans Docker image for vulnerabilities
   - Builds Docker image
   - Pushes to GitHub Container Registry (GHCR)
   - SSHs to VPS and deploys via central compose file

3. **Check deployment status**:
   - GitHub Actions: https://github.com/timostermann/life-tracker/actions
   - Live app: https://life-tracker.timostermann.io

### Manual Deployment

If you need to deploy manually from the VPS:

```bash
# SSH to VPS
ssh <user>@<server-ip>

# Navigate to apps directory
cd ~/server-config/apps

# Pull latest image from GHCR
docker compose pull life-tracker

# Deploy
docker compose up -d life-tracker

# Check status
docker compose ps life-tracker

# View logs
docker compose logs -f life-tracker
```

## Server Configuration

The production configuration is managed in the `server-setup` repository:

### Docker Compose Service

Located at: `server-setup/server-config/apps/docker-compose.yml`

```yaml
life-tracker:
  image: ghcr.io/timostermann/life-tracker:latest
  container_name: life-tracker
  restart: unless-stopped
  networks:
    - edge
  environment:
    - NODE_ENV=production
    - PORT=3000
    - HOSTNAME=0.0.0.0
    - DATABASE_PATH=/data/db.sqlite
  volumes:
    - /mnt/app-data/life-tracker:/data
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 256M
  healthcheck:
    test: ['CMD', 'node', '-e', '...health check...']
    interval: 30s
```

### Caddy Reverse Proxy

Located at: `server-setup/server-config/caddy/Caddyfile`

```
life-tracker.timostermann.io {
  import security_headers
  import standard_logs
  import rate_limits

  reverse_proxy life-tracker:3000 {
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}

    health_uri /api/health
    health_interval 30s
    health_timeout 5s
  }

  encode gzip zstd
}
```

## Initial Setup (One-time)

### 1. DNS Configuration

Ensure DNS points to your VPS:

```bash
# Check DNS
dig life-tracker.timostermann.io

# Should return your VPS IP address
```

### 2. Data Directory Setup

On the VPS, create and configure the data directory:

```bash
sudo mkdir -p /mnt/app-data/life-tracker
sudo chown -R 1001:1001 /mnt/app-data/life-tracker
sudo chmod 755 /mnt/app-data/life-tracker
```

**Important**: The container runs as UID 1001 (non-root user), so the data directory must be owned by this user.

### 3. GitHub Secrets

Configure these secrets in the GitHub repository settings:

- `VPS_HOST` - Your VPS IP or hostname
- `VPS_USER` - SSH username
- `VPS_SSH_KEY` - Private SSH key for deployment

## Local Development

For local development, use the dev compose file:

```bash
# Start app with SQLite Web UI
docker compose -f docker-compose.dev.yml up

# App: http://localhost:3000
# SQLite Web UI: http://localhost:8080
```

## Monitoring

### Health Checks

The application includes a health endpoint at `/api/health` that:

- Returns 200 OK when healthy
- Is monitored by Docker every 30 seconds
- Is monitored by Caddy reverse proxy

### Check Application Health

```bash
# From VPS
cd ~/server-config/apps
docker compose ps life-tracker

# Should show "Up (healthy)"
```

### View Logs

```bash
# Real-time logs
docker compose logs -f life-tracker

# Last 100 lines
docker compose logs --tail=100 life-tracker
```

## Database Management

### Location

Production database: `/mnt/app-data/life-tracker/db.sqlite`

### Backup

#### Automated Backups (Recommended)

The database is automatically backed up daily at 02:00 UTC by the server's backup system:

- **Location**: `/mnt/app-data/backups/life-tracker-YYYYMMDD-HHMMSS.tar.gz`
- **Retention**: 30 days
- **What's included**: Entire `/mnt/app-data/life-tracker` directory (includes SQLite database and WAL files)

View recent backups:

```bash
ls -lah /mnt/app-data/backups/life-tracker-* | tail -n 10
```

#### Manual Backup

For an immediate backup before making changes:

```bash
# On VPS - Quick database copy
sudo cp /mnt/app-data/life-tracker/db.sqlite \
  /mnt/app-data/life-tracker/db.sqlite.backup-$(date +%Y%m%d-%H%M%S)

# Or use the backup script manually
sudo /usr/local/bin/backup.sh
```

### Restore

#### From Automated Backup

```bash
# On VPS
cd ~/server-config/apps
docker compose stop life-tracker

# Extract backup (this restores the entire directory)
sudo tar -xzf /mnt/app-data/backups/life-tracker-YYYYMMDD-HHMMSS.tar.gz -C /

# Ensure correct permissions
sudo chown -R 1001:1001 /mnt/app-data/life-tracker

# Restart container
docker compose up -d life-tracker
docker compose logs --tail=50 life-tracker
```

#### From Manual Backup

```bash
# On VPS
sudo cp /mnt/app-data/life-tracker/db.sqlite.backup-YYYYMMDD-HHMMSS \
  /mnt/app-data/life-tracker/db.sqlite

# Restart container
cd ~/server-config/apps
docker compose restart life-tracker
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs life-tracker

# Common issues:
# - Data directory permissions (should be owned by UID 1001)
# - Database locked (stop container, check for zombie processes)
# - Memory limit exceeded (check resource usage)
```

### Health Check Failing

```bash
# Test health endpoint directly
docker compose exec life-tracker wget -O- http://localhost:3000/api/health

# Check if app is listening
docker compose exec life-tracker netstat -tlnp
```

### Database Permissions

```bash
# Fix permissions
sudo chown -R 1001:1001 /mnt/app-data/life-tracker
sudo chmod 755 /mnt/app-data/life-tracker
sudo chmod 644 /mnt/app-data/life-tracker/db.sqlite

# Restart container
docker compose restart life-tracker
```

## Rollback

To rollback to a previous version:

```bash
# On VPS
cd ~/server-config/apps

# Edit docker-compose.yml and change image tag
nano docker-compose.yml

# Change:
# image: ghcr.io/timostermann/life-tracker:latest
# To:
# image: ghcr.io/timostermann/life-tracker:main-<commit-sha>

# Deploy
docker compose pull life-tracker
docker compose up -d life-tracker
```

## Security Notes

- Container runs as non-root user (UID 1001)
- No secrets are baked into Docker image
- Rate limiting enforced by Caddy
- HTTPS enforced with Let's Encrypt certificates
- Security headers applied by Caddy
- Database is stored on persistent volume, not in container

## Related Documentation

- Server setup guide: `server-setup/docs/ONBOARD_NEW_APP.md`
- Deployment checklist: `server-setup/DEPLOYMENT_CHECKLIST.md`
- Caddy configuration: `server-setup/server-config/caddy/README.md`
- Monitoring setup: `server-setup/server-config/monitoring/README.md`
