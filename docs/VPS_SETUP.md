# VPS Setup Instructions

This document contains the manual steps you need to perform on your VPS to deploy Life Tracker.

## Prerequisites

- VPS with Docker and Docker Compose installed
- Caddy reverse proxy running
- SSH access to your VPS
- GitHub Container Registry access

## Step 1: DNS Configuration

Add an A record for your domain:

```
Type: A
Name: tracker
Value: <YOUR_VPS_IP>
TTL: 3600
```

Result: `tracker.timostermann.io` → Your VPS IP

**Verify DNS:**

```bash
nslookup tracker.timostermann.io
```

## Step 2: VPS Directory Setup

SSH into your VPS and create the application directory:

```bash
# Create app directory
mkdir -p ~/server-config/apps/life-tracker
cd ~/server-config/apps/life-tracker

# Create data directory (with appropriate permissions)
sudo mkdir -p /mnt/app-data/life-tracker
sudo chown $USER:$USER /mnt/app-data/life-tracker
```

## Step 3: Docker Compose Configuration

Create the production docker-compose file on your VPS:

```bash
cd ~/server-config/apps/life-tracker
cat > docker-compose.prod.yml << 'EOF'
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
      test: ['CMD', 'node', '-e', "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

networks:
  caddy_network:
    external: true
EOF
```

## Step 4: GitHub Container Registry Authentication

Login to GitHub Container Registry to pull images:

```bash
# Create a GitHub Personal Access Token with read:packages permission
# Then login:
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## Step 5: Caddy Configuration

Add the Life Tracker configuration to your Caddyfile:

```bash
cd ~/server-config/caddy
nano Caddyfile
```

Add this block to your Caddyfile:

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

**Important:** Make sure the imports (`security_headers`, `standard_logs`, `rate_limits`) are defined elsewhere in your Caddyfile. If not, you can inline the configuration or remove the imports.

## Step 6: Reload Caddy

Reload Caddy to apply the new configuration:

```bash
cd ~/server-config/caddy
docker compose restart caddy

# Or if you need a full reload:
docker compose up -d --force-recreate caddy
```

**Verify Caddy is running:**

```bash
docker logs caddy --tail 50
```

## Step 7: Start Life Tracker

Pull and start the Life Tracker container:

```bash
cd ~/server-config/apps/life-tracker
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

**Check container status:**

```bash
docker compose -f docker-compose.prod.yml ps
docker logs life-tracker --tail 50
```

## Step 8: Verify Deployment

### Check Health Endpoint

```bash
curl https://tracker.timostermann.io/api/health
```

Expected response:

```json
{
	"status": "ok",
	"timestamp": "2026-01-20T...",
	"database": "connected"
}
```

### Access the Application

Open your browser and navigate to:

```
https://tracker.timostermann.io
```

You should see the Life Tracker login page.

## Step 9: GitHub Secrets

Add the following secrets to your GitHub repository for automated deployments:

1. Go to: `https://github.com/YOUR_USERNAME/life-tracker/settings/secrets/actions`

2. Add these secrets:

| Secret Name   | Value                                       |
| ------------- | ------------------------------------------- |
| `VPS_HOST`    | Your VPS IP address or hostname             |
| `VPS_USER`    | SSH username (usually `root` or your user)  |
| `VPS_SSH_KEY` | Your SSH private key (from `~/.ssh/id_rsa`) |

**To get your SSH key:**

```bash
cat ~/.ssh/id_rsa
```

Copy the entire output including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

## Step 10: Test Automated Deployment

Push a commit to the `main` branch to trigger the deployment workflow:

```bash
git add .
git commit -m "test: trigger deployment"
git push origin main
```

Monitor the GitHub Actions workflow at:

```
https://github.com/YOUR_USERNAME/life-tracker/actions
```

## Monitoring

### Add to Uptime Kuma

If you're using Uptime Kuma (uptime.timostermann.io), add a monitor:

- **Name:** Life Tracker
- **URL:** https://tracker.timostermann.io/api/health
- **Type:** HTTP(s)
- **Interval:** 60 seconds
- **Retries:** 3

### View Logs

```bash
# Application logs
docker logs -f life-tracker

# Caddy logs
docker logs -f caddy
```

### Check Database

```bash
# Check database size
ls -lh /mnt/app-data/life-tracker/

# Access database (if needed)
docker exec -it life-tracker sh
sqlite3 /data/db.sqlite
```

## Backup

The database is automatically backed up by your existing VPS backup script.

**Manual backup:**

```bash
sudo cp /mnt/app-data/life-tracker/db.sqlite \
       /mnt/app-data/backups/life-tracker-$(date +%Y%m%d-%H%M%S).sqlite
```

## Troubleshooting

### Container won't start

```bash
docker logs life-tracker
docker compose -f docker-compose.prod.yml ps
```

### Database issues

```bash
# Check database file exists
ls -l /mnt/app-data/life-tracker/

# Check permissions
ls -ld /mnt/app-data/life-tracker/
```

### Caddy issues

```bash
# Check Caddy logs
docker logs caddy

# Test Caddy configuration
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
```

### Can't access the app

1. Check DNS: `nslookup tracker.timostermann.io`
2. Check firewall: `sudo ufw status`
3. Check Caddy is running: `docker ps | grep caddy`
4. Check Life Tracker is running: `docker ps | grep life-tracker`
5. Check health endpoint: `curl http://localhost:3000/api/health` (from VPS)

## Updates

The application will automatically deploy when you push to the `main` branch on GitHub.

To manually update:

```bash
cd ~/server-config/apps/life-tracker
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

## Rollback

If you need to rollback to a previous version:

```bash
cd ~/server-config/apps/life-tracker

# Pull specific commit SHA
docker pull ghcr.io/timostermann/life-tracker:main-abc1234

# Update docker-compose.prod.yml to use specific tag
# Then recreate:
docker compose -f docker-compose.prod.yml up -d --force-recreate
```
