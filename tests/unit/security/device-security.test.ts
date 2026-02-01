/**
 * Device Security Tests
 */

import { DeviceSecurity, SecurityCheckType } from '@/security';

describe('DeviceSecurity', () => {
    let security: DeviceSecurity;

    beforeEach(() => {
        security = DeviceSecurity.getInstance({
            enableRootDetection: true,
            enableJailbreakDetection: true,
            allowDebugMode: true,
            allowEmulators: true,
            allowUSBDebugging: true,
            allowDeveloperMode: true,
            minRiskLevel: 'low',
        });
    });

    describe('Configuration', () => {
        it('should get default configuration', () => {
            const config = security.getConfig();
            expect(config.enableRootDetection).toBe(true);
            expect(config.enableJailbreakDetection).toBe(true);
            expect(config.allowDebugMode).toBe(true);
        });

        it('should update configuration', () => {
            security.setConfig({ allowDebugMode: false });
            const config = security.getConfig();
            expect(config.allowDebugMode).toBe(false);
        });
    });

    describe('Security Checks', () => {
        it('should perform security check', async () => {
            const result = await security.checkDeviceSecurity();

            expect(result).toHaveProperty('isCompromised');
            expect(result).toHaveProperty('riskLevel');
            expect(result).toHaveProperty('checks');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('deviceInfo');

            expect(Array.isArray(result.checks)).toBe(true);
            expect(result.checks.length).toBeGreaterThan(0);
        });

        it('should include debug mode check', async () => {
            const result = await security.checkDeviceSecurity();
            const debugCheck = result.checks.find(
                check => check.type === SecurityCheckType.DEBUG_MODE
            );

            expect(debugCheck).toBeDefined();
            expect(debugCheck?.type).toBe(SecurityCheckType.DEBUG_MODE);
        });

        it('should include emulator check', async () => {
            const result = await security.checkDeviceSecurity();
            const emulatorCheck = result.checks.find(
                check => check.type === SecurityCheckType.EMULATOR
            );

            expect(emulatorCheck).toBeDefined();
            expect(emulatorCheck?.type).toBe(SecurityCheckType.EMULATOR);
        });

        it('should include tampering check', async () => {
            const result = await security.checkDeviceSecurity();
            const tamperCheck = result.checks.find(
                check => check.type === SecurityCheckType.APP_TAMPERING
            );

            expect(tamperCheck).toBeDefined();
            expect(tamperCheck?.type).toBe(SecurityCheckType.APP_TAMPERING);
        });
    });

    describe('Risk Levels', () => {
        it('should return risk level as string', async () => {
            const result = await security.checkDeviceSecurity();
            expect(['none', 'low', 'medium', 'high', 'critical']).toContain(
                result.riskLevel
            );
        });

        it('should cache last check result', async () => {
            await security.checkDeviceSecurity();
            const cached = security.getLastCheckResult();

            expect(cached).not.toBeNull();
            expect(cached).toHaveProperty('isCompromised');
        });
    });

    describe('isSafe', () => {
        it('should return boolean', async () => {
            const isSafe = await security.isSafe();
            expect(typeof isSafe).toBe('boolean');
        });
    });

    describe('Device Info', () => {
        it('should include device information', async () => {
            const result = await security.checkDeviceSecurity();

            expect(result.deviceInfo).toHaveProperty('platform');
            expect(result.deviceInfo).toHaveProperty('version');
            expect(result.deviceInfo).toHaveProperty('brand');
            expect(result.deviceInfo).toHaveProperty('model');
        });
    });
});
