import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

export type BiometricType = 'faceID' | 'touchID' | 'fingerprint' | 'iris' | 'none';

export interface BiometricSupport {
    isAvailable: boolean;
    isEnrolled: boolean;
    biometricType: BiometricType;
    error?: string;
}

export interface BiometricAuthResult {
    success: boolean;
    error?: string;
}

export function useBiometricAuth() {
    const [biometricSupport, setBiometricSupport] = useState<BiometricSupport>({
        isAvailable: false,
        isEnrolled: false,
        biometricType: 'none',
    });
    const [isChecking, setIsChecking] = useState(false);

    // Cihazın biyometrik yeteneklerini kontrol et
    const checkBiometricSupport = useCallback(async (): Promise<BiometricSupport> => {
        setIsChecking(true);
        try {
            // Hardware desteğini kontrol et
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                const result: BiometricSupport = {
                    isAvailable: false,
                    isEnrolled: false,
                    biometricType: 'none',
                    error: 'Biometric hardware not available',
                };
                setBiometricSupport(result);
                return result;
            }

            // Kayıtlı biyometrik veri var mı kontrol et
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                const result: BiometricSupport = {
                    isAvailable: true,
                    isEnrolled: false,
                    biometricType: 'none',
                    error: 'No biometric data enrolled',
                };
                setBiometricSupport(result);
                return result;
            }

            // Biyometrik tipi belirle
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
            let biometricType: BiometricType = 'none';

            if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                biometricType = 'faceID';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                biometricType = 'fingerprint';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
                biometricType = 'iris';
            }

            const result: BiometricSupport = {
                isAvailable: true,
                isEnrolled: true,
                biometricType,
            };
            setBiometricSupport(result);
            return result;
        } catch (error) {
            const result: BiometricSupport = {
                isAvailable: false,
                isEnrolled: false,
                biometricType: 'none',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            setBiometricSupport(result);
            return result;
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Biyometrik doğrulama yap
    const authenticate = useCallback(async (
        promptMessage?: string,
        cancelLabel?: string
    ): Promise<BiometricAuthResult> => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: promptMessage || 'Kimlik Doğrulama',
                cancelLabel: cancelLabel || 'İptal',
                disableDeviceFallback: false,
                requireConfirmation: false,
            });

            if (result.success) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: result.error === 'user_cancel'
                        ? 'User cancelled authentication'
                        : result.error === 'not_enrolled'
                            ? 'No biometric data enrolled'
                            : result.error === 'not_available'
                                ? 'Biometric authentication not available'
                                : 'Authentication failed',
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication error',
            };
        }
    }, []);

    // Biyometrik doğrulamayı iptal et
    const cancelAuthentication = useCallback(async (): Promise<void> => {
        try {
            await LocalAuthentication.cancelAuthenticate();
        } catch (error) {
            console.error('Error cancelling authentication:', error);
        }
    }, []);

    // Biyometrik tip için kullanıcı dostu isim getir
    const getBiometricTypeName = useCallback((type: BiometricType): string => {
        switch (type) {
            case 'faceID':
                return 'Face ID';
            case 'touchID':
                return 'Touch ID';
            case 'fingerprint':
                return 'Fingerprint';
            case 'iris':
                return 'Iris';
            default:
                return 'Biometric';
        }
    }, []);

    // Component mount olduğunda desteği kontrol et
    useEffect(() => {
        checkBiometricSupport();
    }, [checkBiometricSupport]);

    return {
        ...biometricSupport,
        isChecking,
        authenticate,
        cancelAuthentication,
        checkBiometricSupport,
        getBiometricTypeName,
    };
}
