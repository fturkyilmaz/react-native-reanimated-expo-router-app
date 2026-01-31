import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn(),
    isEnrolledAsync: jest.fn(),
    supportedAuthenticationTypesAsync: jest.fn(),
    authenticateAsync: jest.fn(),
    cancelAuthenticate: jest.fn(),
    AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
        IRIS: 3,
    },
}));

describe('useBiometricAuth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkBiometricSupport', () => {
        it('should return not available when hardware is not supported', async () => {
            (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useBiometricAuth());

            await act(async () => {
                await result.current.checkBiometricSupport();
            });

            await waitFor(() => {
                expect(result.current.isAvailable).toBe(false);
                expect(result.current.isEnrolled).toBe(false);
                expect(result.current.biometricType).toBe('none');
            });
        });

        it('should return not enrolled when no biometric data exists', async () => {
            (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useBiometricAuth());

            await act(async () => {
                await result.current.checkBiometricSupport();
            });

            await waitFor(() => {
                expect(result.current.isAvailable).toBe(true);
                expect(result.current.isEnrolled).toBe(false);
                expect(result.current.biometricType).toBe('none');
            });
        });

        it('should detect Face ID', async () => {
            (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
                LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
            ]);

            const { result } = renderHook(() => useBiometricAuth());

            await act(async () => {
                await result.current.checkBiometricSupport();
            });

            await waitFor(() => {
                expect(result.current.isAvailable).toBe(true);
                expect(result.current.isEnrolled).toBe(true);
                expect(result.current.biometricType).toBe('faceID');
            });
        });

        it('should detect Fingerprint', async () => {
            (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
                LocalAuthentication.AuthenticationType.FINGERPRINT,
            ]);

            const { result } = renderHook(() => useBiometricAuth());

            await act(async () => {
                await result.current.checkBiometricSupport();
            });

            await waitFor(() => {
                expect(result.current.isAvailable).toBe(true);
                expect(result.current.isEnrolled).toBe(true);
                expect(result.current.biometricType).toBe('fingerprint');
            });
        });

        it('should detect Iris', async () => {
            (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
                LocalAuthentication.AuthenticationType.IRIS,
            ]);

            const { result } = renderHook(() => useBiometricAuth());

            await act(async () => {
                await result.current.checkBiometricSupport();
            });

            await waitFor(() => {
                expect(result.current.isAvailable).toBe(true);
                expect(result.current.isEnrolled).toBe(true);
                expect(result.current.biometricType).toBe('iris');
            });
        });

        it('should handle errors gracefully', async () => {
            (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValue(new Error('Hardware error'));

            const { result } = renderHook(() => useBiometricAuth());

            await act(async () => {
                await result.current.checkBiometricSupport();
            });

            await waitFor(() => {
                expect(result.current.isAvailable).toBe(false);
                expect(result.current.error).toBe('Hardware error');
            });
        });
    });

    describe('authenticate', () => {
        it('should return success when authentication succeeds', async () => {
            (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
                success: true,
            });

            const { result } = renderHook(() => useBiometricAuth());

            let authResult;
            await act(async () => {
                authResult = await result.current.authenticate('Test Prompt', 'Cancel');
            });

            expect(authResult).toEqual({ success: true });
            expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
                promptMessage: 'Test Prompt',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
                requireConfirmation: false,
            });
        });

        it('should return error when authentication fails', async () => {
            (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
                success: false,
                error: 'user_cancel',
            });

            const { result } = renderHook(() => useBiometricAuth());

            let authResult;
            await act(async () => {
                authResult = await result.current.authenticate();
            });

            expect(authResult!.success).toBe(false);
            expect(authResult!.error).toBe('User cancelled authentication');
        });

        it('should return not_enrolled error', async () => {
            (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
                success: false,
                error: 'not_enrolled',
            });

            const { result } = renderHook(() => useBiometricAuth());

            let authResult;
            await act(async () => {
                authResult = await result.current.authenticate();
            });

            expect(authResult!.success).toBe(false);
            expect(authResult!.error).toBe('No biometric data enrolled');
        });

        it('should handle exceptions', async () => {
            (LocalAuthentication.authenticateAsync as jest.Mock).mockRejectedValue(new Error('Auth error'));

            const { result } = renderHook(() => useBiometricAuth());

            let authResult;
            await act(async () => {
                authResult = await result.current.authenticate();
            });

            expect(authResult!.success).toBe(false);
            expect(authResult!.error).toBe('Auth error');
        });
    });

    describe('cancelAuthentication', () => {
        it('should call cancelAuthenticate', async () => {
            const { result } = renderHook(() => useBiometricAuth());

            await act(async () => {
                await result.current.cancelAuthentication();
            });

            expect(LocalAuthentication.cancelAuthenticate).toHaveBeenCalled();
        });

        it('should handle errors silently', async () => {
            (LocalAuthentication.cancelAuthenticate as jest.Mock).mockRejectedValue(new Error('Cancel error'));

            const { result } = renderHook(() => useBiometricAuth());

            // Should not throw
            await act(async () => {
                await result.current.cancelAuthentication();
            });

            expect(LocalAuthentication.cancelAuthenticate).toHaveBeenCalled();
        });
    });

    describe('getBiometricTypeName', () => {
        it('should return correct names for each type', () => {
            const { result } = renderHook(() => useBiometricAuth());

            expect(result.current.getBiometricTypeName('faceID')).toBe('Face ID');
            expect(result.current.getBiometricTypeName('touchID')).toBe('Touch ID');
            expect(result.current.getBiometricTypeName('fingerprint')).toBe('Fingerprint');
            expect(result.current.getBiometricTypeName('iris')).toBe('Iris');
            expect(result.current.getBiometricTypeName('none')).toBe('Biometric');
        });
    });

    describe('initial check on mount', () => {
        it('should check biometric support on mount', async () => {
            (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
            (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
                LocalAuthentication.AuthenticationType.FINGERPRINT,
            ]);

            const { result } = renderHook(() => useBiometricAuth());

            // Wait for initial effect
            await waitFor(() => {
                expect(result.current.isChecking).toBe(false);
            });

            expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
        });
    });
});
