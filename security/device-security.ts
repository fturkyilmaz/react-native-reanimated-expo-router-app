/**
 * Device Security Module
 * 
 * Provides jailbreak/root detection and device security checks
 * to prevent running on compromised devices.
 */

import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Security check types
 */
export enum SecurityCheckType {
    ROOT_DETECTION = 'root_detection',
    JAILBREAK_DETECTION = 'jailbreak_detection',
    DEBUG_MODE = 'debug_mode',
    EMULATOR = 'emulator',
    APP_TAMPERING = 'app_tampering',
    USB_DEBUGGING = 'usb_debugging',
    DEVELOPER_MODE = 'developer_mode',
}

/**
 * Individual security check result
 */
export interface SecurityCheck {
    /** Type of security check */
    type: SecurityCheckType;
    /** Whether the check detected a security issue */
    detected: boolean;
    /** Human-readable description */
    description: string;
    /** Severity level */
    severity: 'low' | 'medium' | 'high';
    /** Additional details */
    details?: Record<string, unknown>;
}

/**
 * Overall security check result
 */
export interface SecurityCheckResult {
    /** Whether the device is compromised */
    isCompromised: boolean;
    /** Overall risk level */
    riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    /** Individual check results */
    checks: SecurityCheck[];
    /** Timestamp of the check */
    timestamp: string;
    /** Device information */
    deviceInfo: {
        platform: string;
        version: string | null;
        brand: string | null;
        model: string | null;
    };
}

/**
 * Configuration for device security checks
 */
export interface DeviceSecurityConfig {
    /** Whether to enable root detection (Android) */
    enableRootDetection: boolean;
    /** Whether to enable jailbreak detection (iOS) */
    enableJailbreakDetection: boolean;
    /** Whether to allow debug mode */
    allowDebugMode: boolean;
    /** Whether to allow emulators */
    allowEmulators: boolean;
    /** Whether to allow USB debugging */
    allowUSBDebugging: boolean;
    /** Whether to allow developer mode */
    allowDeveloperMode: boolean;
    /** Minimum risk level to report */
    minRiskLevel: 'low' | 'medium' | 'high';
}

/**
 * Default security configuration
 */
const DEFAULT_CONFIG: DeviceSecurityConfig = {
    enableRootDetection: true,
    enableJailbreakDetection: true,
    allowDebugMode: __DEV__, // Allow in development
    allowEmulators: __DEV__, // Allow in development
    allowUSBDebugging: __DEV__,
    allowDeveloperMode: __DEV__,
    minRiskLevel: 'low',
};

/**
 * Paths that indicate root access on Android
 */
const ANDROID_ROOT_INDICATORS = [
    '/system/app/Superuser.apk',
    '/sbin/su',
    '/system/bin/su',
    '/system/xbin/su',
    '/data/local/xbin/su',
    '/data/local/bin/su',
    '/system/sd/xbin/su',
    '/system/bin/failsafe/su',
    '/data/local/su',
    '/su/bin/su',
    '/su/bin',
    '/system/xbin/daemonsu',
    '/system/etc/init.d/99SuperSUDaemon',
    '/system/bin/.ext/.su',
    '/system/etc/.has_su_daemon',
    '/system/etc/.installed_su_daemon',
    '/dev/com.koushikdutta.superuser.daemon/',
];

/**
 * Paths that indicate jailbreak on iOS
 */
const IOS_JAILBREAK_INDICATORS = [
    '/Applications/Cydia.app',
    '/Applications/blackra1n.app',
    '/Applications/FakeCarrier.app',
    '/Applications/Icy.app',
    '/Applications/IntelliScreen.app',
    '/Applications/MxTube.app',
    '/Applications/RockApp.app',
    '/Applications/SBSettings.app',
    '/Applications/WinterBoard.app',
    '/Applications/3uTools.app',
    '/Library/MobileSubstrate/MobileSubstrate.dylib',
    '/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist',
    '/Library/MobileSubstrate/DynamicLibraries/Veency.plist',
    '/private/var/lib/apt/',
    '/private/var/lib/cydia/',
    '/private/var/mobile/Library/SBSettings/Themes',
    '/private/var/stash/',
    '/private/var/tmp/cydia.log',
    '/System/Library/LaunchDaemons/com.ikey.bbot.plist',
    '/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist',
    '/usr/bin/sshd',
    '/usr/bin/ssh',
    '/usr/libexec/sftp-server',
    '/usr/libexec/ssh-keysign',
    '/var/cache/apt/',
    '/var/lib/apt/',
    '/var/lib/cydia/',
    '/var/log/syslog',
    '/var/tmp/cydia.log',
    '/bin/bash',
    '/bin/sh',
    '/etc/apt/',
    '/etc/ssh/sshd_config',
];

/**
 * Device Security Manager
 * 
 * Manages device security checks and root/jailbreak detection
 */
export class DeviceSecurity {
    private static instance: DeviceSecurity;
    private config: DeviceSecurityConfig;
    private lastCheckResult: SecurityCheckResult | null = null;

    private constructor(config: Partial<DeviceSecurityConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: Partial<DeviceSecurityConfig>): DeviceSecurity {
        if (!DeviceSecurity.instance) {
            DeviceSecurity.instance = new DeviceSecurity(config);
        }
        return DeviceSecurity.instance;
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<DeviceSecurityConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): DeviceSecurityConfig {
        return { ...this.config };
    }

    /**
     * Perform comprehensive security check
     */
    async checkDeviceSecurity(): Promise<SecurityCheckResult> {
        const checks: SecurityCheck[] = [];

        // Run all security checks
        if (Platform.OS === 'android' && this.config.enableRootDetection) {
            checks.push(await this.checkRoot());
            checks.push(await this.checkUSBDebugging());
            checks.push(await this.checkDeveloperMode());
        }

        if (Platform.OS === 'ios' && this.config.enableJailbreakDetection) {
            checks.push(await this.checkJailbreak());
        }

        // Platform-independent checks
        checks.push(await this.checkDebugMode());
        checks.push(await this.checkEmulator());
        checks.push(await this.checkAppTampering());

        // Calculate overall risk
        const riskLevel = this.calculateRiskLevel(checks);
        const isCompromised = this.isDeviceCompromised(checks);

        const result: SecurityCheckResult = {
            isCompromised,
            riskLevel,
            checks,
            timestamp: new Date().toISOString(),
            deviceInfo: {
                platform: Platform.OS,
                version: Platform.Version?.toString() || null,
                brand: Platform.select({
                    android: (Platform as unknown as { constants?: { Brand?: string } }).constants?.Brand || null,
                    ios: 'Apple',
                    default: null,
                }),
                model: Platform.select({
                    android: (Platform as unknown as { constants?: { Model?: string } }).constants?.Model || null,
                    ios: null,
                    default: null,
                }),
            },
        };

        this.lastCheckResult = result;
        return result;
    }

    /**
     * Check for root access on Android
     */
    private async checkRoot(): Promise<SecurityCheck> {
        let detected = false;
        const foundPaths: string[] = [];

        // Check for root indicator files
        for (const path of ANDROID_ROOT_INDICATORS) {
            try {
                const info = await FileSystem.getInfoAsync(path);
                if (info.exists) {
                    detected = true;
                    foundPaths.push(path);
                }
            } catch {
                // File doesn't exist, continue
            }
        }

        // Check for test-keys in build tags (using type assertion for runtime check)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buildTags = (Constants.expoConfig?.android as any)?.buildType || '';
        if (typeof buildTags === 'string' && buildTags.includes('test-keys')) {
            detected = true;
        }

        return {
            type: SecurityCheckType.ROOT_DETECTION,
            detected,
            description: detected
                ? 'Root access detected on device'
                : 'No root access detected',
            severity: 'high',
            details: { foundPaths: foundPaths.slice(0, 5) }, // Limit details
        };
    }

    /**
     * Check for jailbreak on iOS
     */
    private async checkJailbreak(): Promise<SecurityCheck> {
        let detected = false;
        const foundPaths: string[] = [];

        // Check for jailbreak indicator files
        for (const path of IOS_JAILBREAK_INDICATORS) {
            try {
                const info = await FileSystem.getInfoAsync(path);
                if (info.exists) {
                    detected = true;
                    foundPaths.push(path);
                }
            } catch {
                // Continue checking
            }
        }

        // Check if we can write to restricted directories
        try {
            const testPath = '/private/jailbreakTest.txt';
            await FileSystem.writeAsStringAsync(testPath, 'test');
            await FileSystem.deleteAsync(testPath);
            detected = true;
        } catch {
            // Cannot write, device is likely not jailbroken
        }

        return {
            type: SecurityCheckType.JAILBREAK_DETECTION,
            detected,
            description: detected
                ? 'Jailbreak detected on device'
                : 'No jailbreak detected',
            severity: 'high',
            details: { foundPaths: foundPaths.slice(0, 5) },
        };
    }

    /**
     * Check if running in debug mode
     */
    private async checkDebugMode(): Promise<SecurityCheck> {
        const detected = __DEV__;

        return {
            type: SecurityCheckType.DEBUG_MODE,
            detected,
            description: detected
                ? 'Application is running in debug mode'
                : 'Application is running in release mode',
            severity: detected && !this.config.allowDebugMode ? 'medium' : 'low',
            details: { allowed: this.config.allowDebugMode },
        };
    }

    /**
     * Check if running on an emulator/simulator
     */
    private async checkEmulator(): Promise<SecurityCheck> {
        let detected = false;

        // Check for emulator indicators
        const brand = (Platform as unknown as { constants?: { Brand?: string } }).constants?.Brand?.toLowerCase() || '';
        const model = (Platform as unknown as { constants?: { Model?: string } }).constants?.Model?.toLowerCase() || '';
        const deviceId = Constants.deviceId || '';

        const emulatorIndicators = [
            'google_sdk',
            'sdk',
            'emulator',
            'simulator',
            'generic',
            'unknown',
        ];

        detected = emulatorIndicators.some(
            indicator =>
                brand.includes(indicator) ||
                model.includes(indicator) ||
                deviceId.includes(indicator)
        );

        // Additional checks for specific emulators
        if (Platform.OS === 'android') {
            // Check for common emulator build properties
            if (model.includes('nox') || model.includes('bluestacks')) {
                detected = true;
            }
        }

        return {
            type: SecurityCheckType.EMULATOR,
            detected,
            description: detected
                ? 'Running on emulator/simulator'
                : 'Running on physical device',
            severity: detected && !this.config.allowEmulators ? 'medium' : 'low',
            details: { allowed: this.config.allowEmulators, brand, model },
        };
    }

    /**
     * Check for app tampering
     */
    private async checkAppTampering(): Promise<SecurityCheck> {
        let detected = false;
        const checks: Record<string, boolean> = {};

        // Check bundle ID (iOS) or package name (Android)
        const bundleId = Constants.expoConfig?.ios?.bundleIdentifier ||
            Constants.expoConfig?.android?.package || '';

        // Verify against expected bundle ID
        const expectedBundleId = 'com.cinesearch.app'; // Replace with your actual bundle ID
        checks.bundleIdValid = bundleId === expectedBundleId;

        // Check if code signature is valid (would require native module)
        checks.signatureValid = true; // Placeholder

        detected = !checks.bundleIdValid || !checks.signatureValid;

        return {
            type: SecurityCheckType.APP_TAMPERING,
            detected,
            description: detected
                ? 'Potential app tampering detected'
                : 'No app tampering detected',
            severity: 'high',
            details: checks,
        };
    }

    /**
     * Check for USB debugging (Android)
     */
    private async checkUSBDebugging(): Promise<SecurityCheck> {
        // This would require native module access
        // For now, return a placeholder
        const detected = false;

        return {
            type: SecurityCheckType.USB_DEBUGGING,
            detected,
            description: 'USB debugging check requires native module',
            severity: 'medium',
            details: { allowed: this.config.allowUSBDebugging },
        };
    }

    /**
     * Check for developer mode (Android)
     */
    private async checkDeveloperMode(): Promise<SecurityCheck> {
        // This would require native module access
        const detected = false;

        return {
            type: SecurityCheckType.DEVELOPER_MODE,
            detected,
            description: 'Developer mode check requires native module',
            severity: 'low',
            details: { allowed: this.config.allowDeveloperMode },
        };
    }

    /**
     * Calculate overall risk level based on checks
     */
    private calculateRiskLevel(checks: SecurityCheck[]): SecurityCheckResult['riskLevel'] {
        const hasCritical = checks.some(
            check => check.detected && check.severity === 'high'
        );
        const hasMedium = checks.some(
            check => check.detected && check.severity === 'medium'
        );
        const hasLow = checks.some(
            check => check.detected && check.severity === 'low'
        );

        if (hasCritical) return 'critical';
        if (hasMedium) return 'high';
        if (hasLow) return 'medium';
        return 'none';
    }

    /**
     * Determine if device is compromised based on configuration
     */
    private isDeviceCompromised(checks: SecurityCheck[]): boolean {
        return checks.some(check => {
            if (!check.detected) return false;

            switch (check.type) {
                case SecurityCheckType.ROOT_DETECTION:
                case SecurityCheckType.JAILBREAK_DETECTION:
                    return true;
                case SecurityCheckType.DEBUG_MODE:
                    return !this.config.allowDebugMode;
                case SecurityCheckType.EMULATOR:
                    return !this.config.allowEmulators;
                case SecurityCheckType.USB_DEBUGGING:
                    return !this.config.allowUSBDebugging;
                case SecurityCheckType.DEVELOPER_MODE:
                    return !this.config.allowDeveloperMode;
                case SecurityCheckType.APP_TAMPERING:
                    return true;
                default:
                    return false;
            }
        });
    }

    /**
     * Get the last check result
     */
    getLastCheckResult(): SecurityCheckResult | null {
        return this.lastCheckResult;
    }

    /**
     * Check if device is safe to run sensitive operations
     */
    async isSafe(): Promise<boolean> {
        const result = await this.checkDeviceSecurity();
        return !result.isCompromised;
    }
}

/**
 * Hook for React components to access device security
 */
export function useDeviceSecurity(config?: Partial<DeviceSecurityConfig>) {
    const security = DeviceSecurity.getInstance(config);

    return {
        checkSecurity: security.checkDeviceSecurity.bind(security),
        isSafe: security.isSafe.bind(security),
        getLastCheckResult: security.getLastCheckResult.bind(security),
        setConfig: security.setConfig.bind(security),
        getConfig: security.getConfig.bind(security),
    };
}

// Export singleton instance
export const deviceSecurity = DeviceSecurity.getInstance();

export default deviceSecurity;
