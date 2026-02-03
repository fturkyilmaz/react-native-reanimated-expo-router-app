# OTA Updates (EAS Update)

## Overview

CineSearch uses EAS Update to push over-the-air (OTA) updates to the app without requiring a new build through app stores.

## Architecture

```
src/hooks/
├── use-ota-update.ts    # OTA update hook
└── README.md           # This file

eas.json                # EAS configuration
```

## Usage

### Basic Update Check

```tsx
import { useOTAUpdate } from '@/hooks/use-ota-update';

function AppVersionInfo() {
  const { 
    status, 
    isUpdateAvailable, 
    currentVersion,
    checkForUpdates,
    applyUpdate 
  } = useOTAUpdate();

  return (
    <View>
      <Text>Current Version: {currentVersion}</Text>
      <Text>Update Available: {isUpdateAvailable ? 'Yes' : 'No'}</Text>
      <Button 
        title="Check for Updates" 
        onPress={checkForUpdates}
        disabled={status === 'checking'}
      />
    </View>
  );
}
```

### Auto-Update Check

```tsx
import { useAutoUpdate } from '@/hooks/use-ota-update';

function App() {
  const { isUpdateAvailable, status } = useAutoUpdate({
    checkOnMount: true,
    checkInterval: 60 * 60 * 1000, // Check every hour
  });

  if (isUpdateAvailable) {
    return <UpdateAvailableBanner onUpdate={() => Updates.reloadAsync()} />;
  }

  return <AppContent />;
}
```

## Update Status

| Status | Description |
|--------|-------------|
| `idle` | No update check in progress |
| `checking` | Checking for updates |
| `downloading` | Downloading update |
| `ready` | Update downloaded, ready to apply |
| `error` | Update check/download failed |

## Configuration

### eas.json

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  },
  "updates": {
    "url": "https://u.expo.dev/PROJECT_ID",
    "enabled": true
  }
}
```

### Environment Variables

```env
EXPO_PUBLIC_PROJECT_ID=your-project-id
```

## Channel Management

### Create Channels

```bash
# Create production channel
eas update:configure --channel production

# Create preview channel
eas update:configure --channel preview

# Create development channel
eas update:configure --channel development
```

### Publish Updates

```bash
# Publish to production
eas update --channel production --message "Fix login bug"

# Publish to preview
eas update --channel preview --message "Add new feature"

# Publish to development
eas update --channel development --message "Test changes"
```

## Update Flow

```
┌─────────────────┐
│   App Starts    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check for Update│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Update Found?   │──No─┤  Use Current    │
└────────┬────────┘     └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│  Download Update│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Prompt    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Reload App    │
└─────────────────┘
```

## Best Practices

### 1. Update Message Conventions

Use clear, concise messages:

```bash
# Good
eas update --channel production --message "Fix login issue on auth screen"

# Avoid
eas update --channel production --message "fix"
eas update --channel production --message "various fixes and improvements"
```

### 2. Semantic Versioning

Use semantic versioning for trackable updates:

```
1.0.0 - Initial release
1.0.1 - Bug fix
1.1.0 - New feature
2.0.0 - Breaking change
```

### 3. Update Frequency

- **Critical fixes**: Publish immediately to production
- **Minor improvements**: Use preview channel first, then production
- **New features**: Test on development, then preview, then production

### 4. Rollback Strategy

If an update causes issues:

```bash
# Rollback by publishing previous version
git checkout v1.0.0
eas update --channel production --message "Rollback to v1.0.0"
```

## What Can Be Updated

OTA updates can modify:
- JavaScript/TypeScript code
- Assets (images, fonts, etc.)
- Configuration files
- Bundled data

OTA updates **cannot** change:
- Native code
- App permissions
- SDK version requirements
- App signing keys

## Troubleshooting

### Update Not Detected

1. Check channel configuration
2. Verify update was published correctly:
   ```bash
   eas update:list --channel production
   ```

### Update Download Fails

1. Check network connection
2. Verify sufficient storage space
3. Check update size (limit: 10MB uncompressed)

### App Crashes After Update

1. Check update message for recent changes
2. Try rollback to previous version
3. Test on development build first

## Monitoring

### View Update History

```bash
eas update:list --channel production
```

### Check Update Status

```bash
eas build:list --channel production
```

## Related Files

- [`src/hooks/use-ota-update.ts`](../src/hooks/use-ota-update.ts) - OTA update hook
- [`eas.json`](../eas.json) - EAS configuration
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
