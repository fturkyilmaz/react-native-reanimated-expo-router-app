/**
 * Security Provider Component
 * 
 * React Context provider for security features.
 * Manages device security checks and provides security status to the app.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import {
    DeviceSecurity,
    DeviceSecurityConfig,
    SecurityCheckResult,
    SecurityCheckType,
} from './device-security';
import { SecureStorage, StorageAudit } from './secure-storage';
import { SSLPinningManager } from './ssl-pinning';

/**
 * Security context state
 */
export interface SecurityContextState {
    /** Whether security checks are complete */
    isInitialized: boolean;
    /** Whether the device is compromised */
    isCompromised: boolean;
    /** Overall risk level */
    riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    /** Individual security check results */
    securityChecks: SecurityCheckResult | null;
    /** Storage audit results */
    storageAudit: StorageAudit[];
    /** Whether to block app usage */
    isBlocked: boolean;
    /** Re-run security checks */
    checkSecurity: () => Promise<void>;
    /** Run storage audit */
    auditStorage: () => Promise<void>;
    /** Clear all sensitive data */
    clearSensitiveData: () => Promise<void>;
}

/**
 * Security provider props
 */
export interface SecurityProviderProps {
    children: React.ReactNode;
    /** Configuration for device security checks */
    config?: Partial<DeviceSecurityConfig>;
    /** Whether to block the app if device is compromised */
    blockOnCompromised?: boolean;
    /** Callback when security check completes */
    onSecurityCheck?: (result: SecurityCheckResult) => void;
    /** Custom loading component */
    loadingComponent?: React.ReactNode;
    /** Custom blocked component */
    blockedComponent?: React.ReactNode;
    /** Whether to run storage audit on mount */
    runStorageAudit?: boolean;
}

// Create context with default values
const SecurityContext = createContext<SecurityContextState>({
    isInitialized: false,
    isCompromised: false,
    riskLevel: 'none',
    securityChecks: null,
    storageAudit: [],
    isBlocked: false,
    checkSecurity: async () => { },
    auditStorage: async () => { },
    clearSensitiveData: async () => { },
});

/**
 * Hook to access security context
 */
export function useSecurity() {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
}

/**
 * Security Provider Component
 * 
 * Wraps the app and provides security checks and status
 */
export function SecurityProvider({
    children,
    config = {},
    blockOnCompromised = true,
    onSecurityCheck,
    loadingComponent,
    blockedComponent,
    runStorageAudit = false,
}: SecurityProviderProps) {
    const { t } = useTranslation();
    const [isInitialized, setIsInitialized] = useState(false);
    const [securityResult, setSecurityResult] = useState<SecurityCheckResult | null>(null);
    const [storageAudit, setStorageAudit] = useState<StorageAudit[]>([]);
    const [isChecking, setIsChecking] = useState(true);

    const deviceSecurity = DeviceSecurity.getInstance(config);
    const secureStorage = SecureStorage.getInstance();
    const sslPinning = SSLPinningManager.getInstance();

    /**
     * Perform security checks
     */
    const checkSecurity = useCallback(async () => {
        setIsChecking(true);

        try {
            // Disable SSL pinning in development
            if (__DEV__) {
                sslPinning.setEnabled(false);
            }

            // Run device security checks
            const result = await deviceSecurity.checkDeviceSecurity();
            setSecurityResult(result);

            // Notify callback
            onSecurityCheck?.(result);

            // Show alert for compromised devices
            if (result.isCompromised && !__DEV__) {
                const criticalChecks = result.checks.filter(
                    check => check.detected && check.severity === 'high'
                );

                if (criticalChecks.length > 0) {
                    Alert.alert(
                        t('security.warningTitle', 'Security Warning'),
                        t(
                            'security.compromisedMessage',
                            'This device appears to be compromised. Some features may be limited for your security.'
                        ),
                        [{ text: t('common.ok', 'OK') }]
                    );
                }
            }
        } catch (error) {
            console.error('[SecurityProvider] Security check failed:', error);
        } finally {
            setIsChecking(false);
            setIsInitialized(true);
        }
    }, [config, onSecurityCheck, sslPinning, deviceSecurity, t]);

    /**
     * Run storage audit
     */
    const auditStorage = useCallback(async () => {
        try {
            const audit = await secureStorage.performAudit();
            setStorageAudit(audit);

            // Alert about high-risk items
            const highRiskItems = audit.filter(item => item.riskLevel === 'high');
            if (highRiskItems.length > 0 && !__DEV__) {
                console.warn('[SecurityProvider] High-risk storage items found:', highRiskItems);
            }
        } catch (error) {
            console.error('[SecurityProvider] Storage audit failed:', error);
        }
    }, [secureStorage]);

    /**
     * Clear sensitive data
     */
    const clearSensitiveData = useCallback(async () => {
        try {
            await secureStorage.clearSensitiveData();
            Alert.alert(
                t('security.dataClearedTitle', 'Data Cleared'),
                t('security.dataClearedMessage', 'All sensitive data has been cleared.')
            );
        } catch (error) {
            console.error('[SecurityProvider] Failed to clear sensitive data:', error);
            Alert.alert(
                t('security.errorTitle', 'Error'),
                t('security.clearDataError', 'Failed to clear sensitive data.')
            );
        }
    }, [secureStorage, t]);

    // Run security checks on mount
    useEffect(() => {
        checkSecurity();
    }, [checkSecurity]);

    // Run storage audit if enabled
    useEffect(() => {
        if (runStorageAudit && isInitialized) {
            auditStorage();
        }
    }, [runStorageAudit, isInitialized, auditStorage]);

    // Determine if app should be blocked
    const isBlocked = blockOnCompromised &&
        securityResult?.isCompromised &&
        !__DEV__ &&
        securityResult.riskLevel === 'critical';

    // Loading state
    if (isChecking) {
        if (loadingComponent) {
            return <>{loadingComponent}</>;
        }

        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                    {t('security.checking', 'Checking device security...')}
                </Text>
            </View>
        );
    }

    // Blocked state
    if (isBlocked) {
        if (blockedComponent) {
            return <>{blockedComponent}</>;
        }

        const rootDetected = securityResult?.checks.find(
            check => check.type === SecurityCheckType.ROOT_DETECTION && check.detected
        );
        const jailbreakDetected = securityResult?.checks.find(
            check => check.type === SecurityCheckType.JAILBREAK_DETECTION && check.detected
        );

        return (
            <View style={styles.container}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningTitle}>
                    {t('security.blockedTitle', 'Security Check Failed')}
                </Text>
                <Text style={styles.warningMessage}>
                    {rootDetected
                        ? t('security.rootDetected', 'Root access detected on this device.')
                        : jailbreakDetected
                            ? t('security.jailbreakDetected', 'Jailbreak detected on this device.')
                            : t('security.deviceCompromised', 'This device appears to be compromised.')}
                </Text>
                <Text style={styles.warningSubtext}>
                    {t(
                        'security.blockedSubtext',
                        'For security reasons, this app cannot run on compromised devices.'
                    )}
                </Text>
            </View>
        );
    }

    const contextValue: SecurityContextState = {
        isInitialized,
        isCompromised: securityResult?.isCompromised ?? false,
        riskLevel: securityResult?.riskLevel ?? 'none',
        securityChecks: securityResult,
        storageAudit,
        isBlocked: !!isBlocked,
        checkSecurity,
        auditStorage,
        clearSensitiveData,
    };

    return (
        <SecurityContext.Provider value={contextValue}>
            {children}
        </SecurityContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    warningIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    warningTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 12,
        textAlign: 'center',
    },
    warningMessage: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    warningSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default SecurityProvider;
