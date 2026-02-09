/**
 * Security Module
 * 
 * Centralized security exports for the application.
 * Includes SSL pinning, device security, and secure storage.
 */

// SSL Pinning
export {
    extractPublicKeyHash, sslPinning, SSLPinningManager,
    useSSLPinning
} from './ssl-pinning';
export type {
    PinConfig,
    ValidationResult
} from './ssl-pinning';

// Device Security
export {
    DeviceSecurity, deviceSecurity,
    SecurityCheckType, useDeviceSecurity
} from './device-security';
export type {
    DeviceSecurityConfig, SecurityCheck,
    SecurityCheckResult
} from './device-security';

// Secure Storage
export {
    SecureStorage, secureStorage,
    StorageKey, useSecureStorage
} from './secure-storage';
export type {
    StorageAudit, StorageItem, StorageResult
} from './secure-storage';

// Security Provider
export {
    SecurityProvider,
    useSecurity
} from './security-provider';
export type {
    SecurityContextState,
    SecurityProviderProps
} from './security-provider';

// Audit Logger
export {
    securityAuditLogger,
    useSecurityAudit,
    type SecurityEvent,
    type SecurityEventType
} from './audit-logger';

// Default exports
export { default } from './security-provider';
