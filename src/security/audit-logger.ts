/**
 * Security Audit Logger
 * 
 * Provides security event logging for audit purposes.
 * Tracks authentication, authorization, and sensitive operations.
 */

import { captureMessage, setUser } from '@/sentry';

/**
 * Security event types
 */
export type SecurityEventType =
    | 'login_attempt'
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'session_expired'
    | 'password_change'
    | 'password_reset'
    | 'biometric_enable'
    | 'biometric_disable'
    | 'permission_change'
    | 'sensitive_data_access'
    | 'data_export'
    | 'account_delete'
    | 'rate_limit_exceeded'
    | 'suspicious_activity';

/**
 * Security event interface
 */
export interface SecurityEvent {
    type: SecurityEventType;
    timestamp: Date;
    userId?: string;
    success: boolean;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Security audit logger
 */
class SecurityAuditLogger {
    private eventQueue: SecurityEvent[] = [];
    private maxQueueSize = 100;
    private flushInterval: ReturnType<typeof setInterval> | null = null;
    private flushIntervalMs = 60000; // Flush every minute

    constructor() {
        // Start periodic flush
        if (typeof setInterval !== 'undefined') {
            this.flushInterval = setInterval(() => {
                this.flush();
            }, this.flushIntervalMs);
        }
    }

    /**
     * Log a security event
     */
    log(event: Omit<SecurityEvent, 'timestamp'>): void {
        const fullEvent: SecurityEvent = {
            ...event,
            timestamp: new Date(),
        };

        // Add to queue
        this.eventQueue.push(fullEvent);

        // Flush if queue is full
        if (this.eventQueue.length >= this.maxQueueSize) {
            this.flush();
        }

        // Log to console in development
        if (__DEV__) {
            console.log(`[SecurityAudit] ${event.type}`, {
                success: event.success,
                userId: event.userId,
                metadata: event.metadata,
            });
        }

        // Capture to Sentry as security event
        const level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = event.success ? 'info' : 'warning';
        captureMessage(`security: ${event.type}`, level);
    }

    /**
     * Log login attempt
     */
    logLoginAttempt(userId: string, method: 'email' | 'social' | 'biometric'): void {
        this.log({
            type: 'login_attempt',
            userId,
            success: true,
            metadata: { method },
        });
    }

    /**
     * Log login success
     */
    logLoginSuccess(userId: string, method: 'email' | 'social' | 'biometric'): void {
        setUser({ id: userId });
        this.log({
            type: 'login_success',
            userId,
            success: true,
            metadata: { method },
        });
    }

    /**
     * Log login failure
     */
    logLoginFailure(userId: string, method: 'email' | 'social' | 'biometric', reason: string): void {
        this.log({
            type: 'login_failure',
            userId,
            success: false,
            metadata: { method, reason },
        });
    }

    /**
     * Log logout
     */
    logLogout(userId: string): void {
        setUser(null);
        this.log({
            type: 'logout',
            userId,
            success: true,
        });
    }

    /**
     * Log password change
     */
    logPasswordChange(userId: string, success: boolean, reason?: string): void {
        this.log({
            type: 'password_change',
            userId,
            success,
            metadata: reason ? { reason } : undefined,
        });
    }

    /**
     * Log biometric enable/disable
     */
    logBiometricChange(userId: string, enabled: boolean): void {
        this.log({
            type: enabled ? 'biometric_enable' : 'biometric_disable',
            userId,
            success: true,
        });
    }

    /**
     * Log rate limit exceeded
     */
    logRateLimitExceeded(endpoint: string, userId?: string): void {
        this.log({
            type: 'rate_limit_exceeded',
            userId,
            success: false,
            metadata: { endpoint },
        });
    }

    /**
     * Log sensitive data access
     */
    logSensitiveDataAccess(userId: string, dataType: string): void {
        this.log({
            type: 'sensitive_data_access',
            userId,
            success: true,
            metadata: { dataType },
        });
    }

    /**
     * Flush event queue
     */
    flush(): void {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        // In production, this would send to a secure audit log service
        if (!__DEV__) {
            // Send to audit service
            console.log(`[SecurityAudit] Flushed ${events.length} events`);
        }
    }

    /**
     * Clear all events
     */
    clear(): void {
        this.eventQueue = [];
    }

    /**
     * Destroy the logger
     */
    destroy(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        this.flush();
    }
}

// Singleton instance
export const securityAuditLogger = new SecurityAuditLogger();

/**
 * React hook for security logging
 */
export function useSecurityAudit() {
    return {
        log: (event: Omit<SecurityEvent, 'timestamp'>) => securityAuditLogger.log(event),
        logLoginAttempt: (userId: string, method: 'email' | 'social' | 'biometric') =>
            securityAuditLogger.logLoginAttempt(userId, method),
        logLoginSuccess: (userId: string, method: 'email' | 'social' | 'biometric') =>
            securityAuditLogger.logLoginSuccess(userId, method),
        logLoginFailure: (userId: string, method: 'email' | 'social' | 'biometric', reason: string) =>
            securityAuditLogger.logLoginFailure(userId, method, reason),
        logLogout: (userId: string) => securityAuditLogger.logLogout(userId),
        logPasswordChange: (userId: string, success: boolean, reason?: string) =>
            securityAuditLogger.logPasswordChange(userId, success, reason),
        logBiometricChange: (userId: string, enabled: boolean) =>
            securityAuditLogger.logBiometricChange(userId, enabled),
        logRateLimitExceeded: (endpoint: string, userId?: string) =>
            securityAuditLogger.logRateLimitExceeded(endpoint, userId),
        logSensitiveDataAccess: (userId: string, dataType: string) =>
            securityAuditLogger.logSensitiveDataAccess(userId, dataType),
    };
}
