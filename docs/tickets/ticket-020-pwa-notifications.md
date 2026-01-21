# Ticket 020: PWA Push Notifications

**ID:** ticket-020  
**Scope:** `notifications`, `pwa` or `ticket-020`  
**Phase:** 2 (Post-MVP)  
**Dependencies:** ticket-013 (PWA setup), ticket-010 (Habits), ticket-009 (Chores)  
**Status:** ⏳ Pending

## Description

Implement push notifications for the PWA to remind users about habits, upcoming task deadlines, and overdue chores. Includes service worker setup, notification permission management, push subscription storage, and notification scheduling.

## Tasks

### Service Worker

- [ ] Create service worker with push notification handler
- [ ] Configure Vite/SvelteKit to handle service worker registration
- [ ] Implement service worker lifecycle (install, activate, push events)
- [ ] Add notification click handler to open relevant pages
- [ ] Test service worker in dev and production modes

### Backend API

- [ ] Create push subscription endpoint (`POST /api/notifications/subscribe`)
- [ ] Create unsubscribe endpoint (`DELETE /api/notifications/subscribe`)
- [ ] Add database schema for push subscriptions (user_id, endpoint, keys, created_at)
- [ ] Implement Web Push protocol with VAPID keys
- [ ] Create notification scheduler (cron job or background task)
- [ ] Add notification sending logic (habit reminders, task deadlines, chore due dates)

### Frontend UI

- [ ] Create NotificationSettings component (enable/disable, timing preferences)
- [ ] Add notification permission request UI (with clear explanation)
- [ ] Implement notification preference toggles (habits, tasks, chores)
- [ ] Add notification timing settings (e.g., "Remind me 1 hour before")
- [ ] Show notification status indicator (enabled/disabled/blocked)
- [ ] Add notification test button (send test notification)

### Notification Types

- [ ] Habit reminders (daily habits not yet completed)
- [ ] Task deadline reminders (1 hour before, 1 day before)
- [ ] Overdue chore notifications (when chore becomes overdue)
- [ ] Weekly summary notifications (optional)
- [ ] Streak milestone celebrations (e.g., "7 day streak!")

### Testing

- [ ] Unit tests for push subscription storage
- [ ] Unit tests for notification scheduling logic
- [ ] E2E tests for notification permission flow
- [ ] E2E tests for notification preferences
- [ ] Manual testing on iOS, Android, Desktop browsers

## Acceptance Criteria

### Service Worker

- ✅ Service worker registers successfully on app load
- ✅ Service worker handles push events correctly
- ✅ Clicking notification opens app to relevant page
- ✅ Notification icon and badge display correctly
- ✅ Service worker updates without breaking existing functionality

### Backend

- ✅ Push subscriptions stored securely in database
- ✅ VAPID keys generated and stored as environment variables
- ✅ Notifications sent successfully via Web Push API
- ✅ Notification scheduler runs reliably (daily check)
- ✅ Users can unsubscribe from notifications
- ✅ Expired/invalid subscriptions are cleaned up

### Frontend

- ✅ Permission request shown at appropriate time (not on first load)
- ✅ Clear explanation of why notifications are useful
- ✅ User can enable/disable notifications per type
- ✅ User can configure notification timing preferences
- ✅ Notification status visible in settings
- ✅ Test notification works correctly

### Notification Quality

- ✅ Notifications are timely and accurate
- ✅ Notification content is clear and actionable
- ✅ Notifications don't spam users (reasonable frequency)
- ✅ Silent hours respected (no notifications at night)
- ✅ Notifications work offline (queued and sent when online)

## Implementation Details

### Database Schema

```sql
CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  habits_enabled BOOLEAN NOT NULL DEFAULT 1,
  tasks_enabled BOOLEAN NOT NULL DEFAULT 1,
  chores_enabled BOOLEAN NOT NULL DEFAULT 1,
  weekly_summary BOOLEAN NOT NULL DEFAULT 0,
  reminder_offset_minutes INTEGER NOT NULL DEFAULT 60,
  silent_hours_start TIME DEFAULT '22:00',
  silent_hours_end TIME DEFAULT '08:00',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Service Worker Structure

```typescript
// static/service-worker.js
self.addEventListener('push', (event) => {
	const data = event.data?.json();
	const { title, body, icon, badge, url } = data;

	event.waitUntil(
		self.registration.showNotification(title, {
			body,
			icon: icon || '/icon-192.png',
			badge: badge || '/icon-192.png',
			data: { url },
			vibrate: [200, 100, 200],
			tag: data.tag || 'default'
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = event.notification.data?.url || '/';
	event.waitUntil(clients.openWindow(url));
});
```

### API Endpoints

**POST /api/notifications/subscribe**

```typescript
// Request body
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}

// Response
{
  "success": true,
  "message": "Subscribed to notifications"
}
```

**POST /api/notifications/test**

```typescript
// Sends a test notification to verify setup
// Response
{
	"success": true,
	"message": "Test notification sent"
}
```

### Notification Scheduling Logic

```typescript
// src/lib/server/notifications/scheduler.ts
export async function sendDailyReminders() {
	const now = new Date();
	const users = await getUsersWithNotificationsEnabled();

	for (const user of users) {
		const prefs = await getNotificationPreferences(user.id);

		// Check silent hours
		if (isInSilentHours(now, prefs)) continue;

		// Habit reminders
		if (prefs.habitsEnabled) {
			const overdueHabits = await getOverdueHabitsForUser(user.id);
			if (overdueHabits.length > 0) {
				await sendNotification(user, {
					title: 'Habit Reminder',
					body: `You have ${overdueHabits.length} habit(s) to complete today`,
					url: '/categories',
					tag: 'habits'
				});
			}
		}

		// Task deadlines
		if (prefs.tasksEnabled) {
			const upcomingTasks = await getUpcomingDeadlines(user.id, prefs.reminderOffsetMinutes);
			for (const task of upcomingTasks) {
				await sendNotification(user, {
					title: 'Task Deadline Approaching',
					body: `"${task.title}" is due in ${prefs.reminderOffsetMinutes} minutes`,
					url: `/categories/${task.categoryId}`,
					tag: `task-${task.id}`
				});
			}
		}

		// Overdue chores
		if (prefs.choresEnabled) {
			const overdueChores = await getOverdueChores(user.id);
			if (overdueChores.length > 0) {
				await sendNotification(user, {
					title: 'Overdue Chores',
					body: `You have ${overdueChores.length} overdue chore(s)`,
					url: '/categories',
					tag: 'chores'
				});
			}
		}
	}
}
```

### Frontend Component

```svelte
<!-- src/lib/components/NotificationSettings/NotificationSettings.svelte -->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Bell, BellOff } from 'lucide-svelte';

	let notificationPermission = $state<NotificationPermission>('default');
	let subscribed = $state(false);

	async function requestPermission() {
		const permission = await Notification.requestPermission();
		notificationPermission = permission;

		if (permission === 'granted') {
			await subscribeToNotifications();
		}
	}

	async function subscribeToNotifications() {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: PUBLIC_VAPID_KEY
		});

		await fetch('/api/notifications/subscribe', {
			method: 'POST',
			body: JSON.stringify({ subscription })
		});

		subscribed = true;
	}

	async function sendTestNotification() {
		await fetch('/api/notifications/test', { method: 'POST' });
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center gap-2">
			{#if subscribed}
				<Bell class="h-5 w-5" />
			{:else}
				<BellOff class="h-5 w-5" />
			{/if}
			Push Notifications
		</Card.Title>
		<Card.Description>
			Get reminders for habits, tasks, and chores directly on your device
		</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-4">
		{#if notificationPermission === 'denied'}
			<p class="text-sm text-destructive">
				Notifications are blocked. Please enable them in your browser settings.
			</p>
		{:else if notificationPermission === 'default'}
			<Button onclick={requestPermission}>Enable Notifications</Button>
		{:else}
			<!-- Notification preferences UI -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label for="habits">Habit Reminders</Label>
					<Switch id="habits" bind:checked={habitsEnabled} />
				</div>
				<!-- More preferences... -->
				<Button variant="outline" onclick={sendTestNotification}>Send Test Notification</Button>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
```

## Testing

### Unit Tests

```typescript
// src/lib/server/notifications/scheduler.spec.ts
describe('sendDailyReminders', () => {
	it('should send habit reminders to users with overdue habits', async () => {
		// Test implementation
	});

	it('should respect silent hours', async () => {
		// Test implementation
	});

	it('should not send notifications to users with preferences disabled', async () => {
		// Test implementation
	});
});
```

### E2E Tests

```typescript
// e2e/notifications.spec.ts
test('user can enable and configure notifications', async ({ page, context }) => {
	await context.grantPermissions(['notifications']);
	await page.goto('/settings');

	await page.click('text=Enable Notifications');
	await expect(page.locator('text=Notifications enabled')).toBeVisible();

	await page.click('label:has-text("Habit Reminders")');
	await expect(page.locator('input[id="habits"]')).toBeChecked();

	await page.click('text=Send Test Notification');
	// Notification received (can't directly test in Playwright, but can verify API call)
});
```

## Accessibility

- ✅ Notification permission request has clear, accessible explanation
- ✅ All settings have proper labels and descriptions
- ✅ Keyboard navigation works for all controls
- ✅ Screen reader announces notification status changes
- ✅ Notification content is clear and actionable

## Security Considerations

- VAPID keys stored as environment variables (never in code)
- Push subscriptions stored securely in database
- Subscription endpoints validated before storing
- Rate limiting on subscription endpoints to prevent abuse
- User can unsubscribe at any time
- Expired subscriptions cleaned up regularly

## Performance

- Service worker cached for offline functionality
- Notification scheduler runs efficiently (batched queries)
- Push subscriptions indexed for fast lookups
- Notification payload kept small (<4KB)
- Failed notification attempts logged and retried

## Future Enhancements (Post-ticket)

- Rich notifications with action buttons (Complete, Snooze)
- Notification history in-app
- Smart notification timing (ML-based on user behavior)
- Group notifications by category
- Custom notification sounds
- Desktop-specific notification settings

## Environment Variables

```env
# .env.example
VAPID_PUBLIC_KEY=your_public_vapid_key
VAPID_PRIVATE_KEY=your_private_vapid_key
VAPID_SUBJECT=mailto:your-email@example.com
```

## Documentation Updates

- Update README with notification setup instructions
- Document VAPID key generation process
- Add notification scheduling documentation
- Update deployment guide with environment variables
- Add troubleshooting section for common notification issues

## Next Steps

After completing this ticket:

- Monitor notification delivery rates and user engagement
- Gather user feedback on notification timing and frequency
- Consider implementing notification preferences per category
- Explore rich notification features (actions, images, etc.)
