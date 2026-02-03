# Security

## Overview

CineSearch implements comprehensive security features including SSL pinning, biometric authentication, and root detection.

## Security Provider

```tsx
import { SecurityProvider, SecurityCheckResult } from '@/security';

<SecurityProvider
  blockOnCompromised={!__DEV__}
  runStorageAudit={__DEV__}
  onSecurityCheck={(result: SecurityCheckResult) => {
    if (result.isCompromised) {
      console.warn('[Security] Device compromised:', result.riskLevel);
    }
  }}
>
  <App />
</SecurityProvider>
```

## Biometric Authentication

```tsx
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

function LoginScreen() {
  const { authenticate, isAuthenticated, error } = useBiometricAuth();

  const handleLogin = async () => {
    const success = await authenticate('Authenticate to access your account');
    if (success) {
      // Proceed with login
    }
  };

  return <Button title="Login with Biometrics" onPress={handleLogin} />;
}
```

## Root/Jailbreak Detection

```typescript
import { isRooted, isJailbroken } from '@/security/device-security';

const securityChecks = async () => {
  const [isDeviceRooted, isDeviceJailbroken] = await Promise.all([
    isRooted(),
    isJailbroken(),
  ]);

  if (isDeviceRooted || isDeviceJailbroken) {
    return { isCompromised: true, riskLevel: 'HIGH' };
  }

  return { isCompromised: false, riskLevel: 'LOW' };
};
```

## SSL Pinning

```typescript
import { sslPinning } from '@/security/ssl-pinning';

// Configured in security-provider.tsx
const sslPinningConfig = {
  'https://api.cinesearch.com': {
    'sha256-pub-key': 'base64-public-key',
  },
};
```

## Secure Storage

```typescript
import { secureStorage } from '@/security/secure-storage';

// Store sensitive data
await secureStorage.setItem('authToken', token);
await secureStorage.setItem('refreshToken', refreshToken);

// Retrieve data
const token = await secureStorage.getItem('authToken');

// Remove data
await secureStorage.removeItem('authToken');
```

## Related Files

- [`src/security/security-provider.tsx`](../src/security/security-provider.tsx)
- [`src/security/device-security.ts`](../src/security/device-security.ts)
- [`src/security/ssl-pinning.ts`](../src/security/ssl-pinning.ts)
- [`src/security/secure-storage.ts`](../src/security/secure-storage.ts)
- [`src/hooks/useBiometricAuth.ts`](../src/hooks/useBiometricAuth.ts)
