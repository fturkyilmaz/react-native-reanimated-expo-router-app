# Push Notifications

## Overview

CineSearch implements push notifications using `expo-notifications` to keep users informed about movie releases, updates, and personalized content.

## Architecture

```
src/notifications/
├── config.ts           # Notification configuration
├── provider.tsx        # Notification context provider
├── service.ts          # Push notification sending service
├── index.ts            # Public exports
└── README.md           # This file
```

## Usage

### Requesting Permission

```tsx
import { useNotifications } from '@/hooks/use-notifications';

function App() {
  const { requestPermission, permissionStatus } = useNotifications();

  useEffect(() => {
    if (permissionStatus === 'undetermined') {
      requestPermission();
    }
  }, [permissionStatus]);

  return <AppContent />;
}
```

### Using the Hook

```tsx
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationsExample() {
  const { 
    token, 
    permissionStatus, 
    requestPermission,
    handleNotification,
    lastNotification 
  } = useNotifications();

  return (
    <View>
      <Text>Permission: {permissionStatus}</Text>
      <Text>Token: {token || 'Not registered'}</Text>
      <Button title="Request Permission" onPress={requestPermission} />
    </View>
  );
}
```

## Configuration

### app.json

Notifications are configured in `app.json`:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#E50914",
      "iosDisplayInForeground": true
    }
  }
}
```

### Notification Handler

```typescript
// src/notifications/config.ts
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

## Notification Categories

Define notification actions for user interaction:

```typescript
import { useNotificationCategories } from '@/hooks/use-notifications';

function App() {
  useNotificationCategories();

  return <AppContent />;
}
```

Categories include:
- **movie_release**: View movie, Dismiss
- **general**: Open, Dismiss

## Sending Notifications

### Server-Side

Send push notifications from your backend:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxxxx]",
    "title": "New Movie Released",
    "body": "Check out the latest blockbuster!",
    "data": {
      "type": "movie_release",
      "movieId": 12345
    }
  }'
```

### Using the Service

```typescript
import { sendPushNotification } from '@/services/notification-service';

await sendPushNotification(
  'ExponentPushToken[xxxxx]',
  'New Movie Released',
  'Check out the latest blockbuster!',
  { type: 'movie_release', movieId: 12345 }
);
```

## Notification Data Structure

```typescript
interface NotificationData {
  type: 'movie_release' | 'general';
  movieId?: number;
  deepLink?: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: NotificationData;
}
```

## Permission Status

| Status | Description |
|--------|-------------|
| `granted` | User has authorized notifications |
| `denied` | User has denied notification permission |
| `undetermined` | User has not been asked yet |

## Handling Notifications

### Foreground Notifications

```tsx
import { useEffect } from 'react';
import { addNotificationReceivedListener } from 'expo-notifications';

useEffect(() => {
  const subscription = addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification.request.content.title);
    // Handle notification display
  });

  return () => subscription.remove();
}, []);
```

### Notification Response (User Tap)

```tsx
import { useNotificationResponse } from '@/hooks/use-notifications';

function App() {
  const { handleNotificationResponse } = useNotificationResponse();

  useEffect(() => {
    // Handle when user taps notification
  }, []);
}
```

## Testing

### Local Testing

1. Enable notifications in simulator settings
2. Use the development build
3. Check console for token registration

### Production Testing

1. Build with EAS: `eas build --profile production`
2. Install on device
3. Test from development server or push notification service

## Best Practices

1. **Request permissions early**: Ask for permission when user engages with notifications
2. **Handle denied state**: Provide alternative ways to get information
3. **Use categories**: Enable quick actions from notifications
4. **Respect user choice**: Don't spam notifications
5. **Track analytics**: Monitor notification engagement

## Troubleshooting

### Token Not Received

```typescript
// Check if running on physical device
import * as Device from 'expo-device';

if (!Device.isDevice) {
  console.warn('Push notifications require physical device');
}
```

### Notifications Not Showing

1. Check notification permission status
2. Verify notification handler is set
3. Check device notification settings

## Related Files

- [`src/hooks/use-notifications.ts`](../src/hooks/use-notifications.ts) - Notification hook
- [`src/services/notification-service.ts`](../src/services/notification-service.ts) - Push notification service
- [`src/notifications/provider.tsx`](../src/notifications/provider.tsx) - Context provider
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
