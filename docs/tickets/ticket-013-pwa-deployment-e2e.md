# Ticket 013: PWA, Deployment & E2E Tests

**ID:** ticket-013  
**Scope:** `setup`, `pwa` or `ticket-013`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-012 (all features complete)

## Description

Configure PWA functionality, set up Docker deployment pipeline, Caddy configuration, and comprehensive E2E test suite.

## Tasks

### PWA

- [x] Create PWA manifest.json
- [x] Generate PWA icons (192x192, 512x512)
- [x] Configure SvelteKit adapter-node
- [x] Add manifest link to app.html
- [x] Configure theme colors

### Docker & Deployment

- [x] Create Dockerfile (Node 24)
- [x] Create docker-compose.yml for local dev
- [x] Create production docker-compose.yml for VPS
- [x] Create GitHub Actions workflow (.github/workflows/deploy.yml)
- [x] Add Trivy security scanning
- [x] Configure environment variables
- [x] Set up health check endpoint (`/api/health`)`

### Caddy Configuration

- [x] Add tracker.timostermann.io to Caddyfile
- [x] Configure reverse proxy to port 3000
- [x] Add rate limiting
- [x] Add security headers
- [x] Add health check monitoring
- [x] Test Caddy reload

## Acceptance Criteria

### PWA

- ✅ App installable on iOS Safari
- ✅ App installable on Android Chrome
- ✅ App installable on desktop browsers
- ✅ Installed app opens in standalone mode
- ✅ App icon displays correctly
- ✅ Theme colors applied

### Deployment

- ✅ Docker image builds successfully
- ✅ GitHub Actions pipeline works
- ✅ Security scan passes (no CRITICAL/HIGH)
- ✅ Deployment SSHs to VPS successfully
- ✅ Health check endpoint returns 200
- ✅ App accessible at tracker.timostermann.io
- ✅ HTTPS works (Caddy auto-cert)
- ✅ Database persists between deployments

### E2E Tests

- ✅ All E2E tests pass
- ✅ Tests run in CI on every PR
- ✅ Tests cover all critical user flows
- ✅ Tests run on Chrome, Firefox, Safari
- ✅ Test reports generated
- ✅ Tests clean up test data

## Technical Notes

**PWA Manifest:**

```json
{
	"name": "Life Tracker",
	"short_name": "Tracker",
	"icons": [
		{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
		{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
	],
	"theme_color": "#3b82f6",
	"background_color": "#ffffff",
	"display": "standalone",
	"start_url": "/"
}
```

**Caddy config:**

```caddy
tracker.timostermann.io {
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

**E2E test example:**

```typescript
test('create and complete task', async ({ page, user }) => {
	await page.goto('/categories/1');
	await page.click('text=New Task');

	await page.fill('[name="title"]', 'Buy groceries');
	await page.selectOption('[name="priority"]', 'high');
	await page.click('button:has-text("Create")');

	await expect(page.locator('text=Buy groceries')).toBeVisible();
	await expect(page.locator('text=Task created')).toBeVisible();

	await page.click('button:has-text("Complete")');
	await expect(page.locator('text=Task completed')).toBeVisible();
});
```

## Testing

- ✅ Unit test: Health check returns 200
- ✅ Unit test: Manifest validates
- ✅ Integration test: Docker build succeeds
- ✅ E2E: All 10 user flows pass
- ✅ E2E: Tests run in < 5 minutes
- ✅ Manual: PWA install on 3 platforms

## Accessibility

- ✅ PWA name clear and descriptive
- ✅ Icons have alt text
- ✅ Standalone mode accessible

## Performance

- ✅ Docker image < 300MB
- ✅ Health check < 100ms
- ✅ E2E tests parallelized
- ✅ Lighthouse score > 90
