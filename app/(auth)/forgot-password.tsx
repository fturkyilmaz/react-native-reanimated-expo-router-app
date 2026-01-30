import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    email: z.string().min(1, 'E-posta adresi giriniz').email('Geçerli bir e-posta adresi giriniz'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    const emailValue = watch('email');

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Back Button */}
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <View style={styles.backCircle}>
                            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                        </View>
                    </Pressable>

                    {/* Header Illustration */}
                    <View style={styles.illustrationContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="lock-open-outline" size={48} color="#E50914" />
                        </View>
                        <View style={styles.lockBadge}>
                            <Ionicons name="mail" size={20} color="white" />
                        </View>
                    </View>

                    {/* Title Section */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Şifrenizi mi unuttunuz?</Text>
                        <Text style={styles.subtitle}>
                            {isSuccess
                                ? 'Şifre sıfırlama bağlantısını e-posta adresinize gönderdik.'
                                : 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.'}
                        </Text>
                    </View>

                    {!isSuccess ? (
                        // Form Section
                        <View style={styles.formContainer}>
                            {/* Email Input */}
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>E-posta Adresi</Text>
                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View
                                            style={[
                                                styles.inputContainer,
                                                errors.email && styles.inputError,
                                            ]}
                                        >
                                            <Ionicons
                                                name="mail-outline"
                                                size={20}
                                                color={errors.email ? '#E50914' : '#666'}
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="ornek@email.com"
                                                value={value}
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                editable={!isLoading}
                                            />
                                            {value.length > 0 && !errors.email && (
                                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                            )}
                                        </View>
                                    )}
                                />
                                {errors.email ? (
                                    <Text style={styles.errorText}>{errors.email.message}</Text>
                                ) : (
                                    <Text style={styles.hintText}>Kayıtlı e-posta adresinizi girin</Text>
                                )}
                            </View>

                            {/* Reset Button */}
                            <Pressable
                                style={[
                                    styles.resetButton,
                                    isLoading && styles.buttonDisabled,
                                    !emailValue && styles.buttonInactive,
                                ]}
                                onPress={handleSubmit(onSubmit)}
                                disabled={isLoading || !emailValue}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Sıfırlama Bağlantısı Gönder</Text>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={20}
                                            color="white"
                                            style={styles.buttonIcon}
                                        />
                                    </>
                                )}
                            </Pressable>
                        </View>
                    ) : (
                        // Success Section
                        <View style={styles.successContainer}>
                            <View style={styles.successIcon}>
                                <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
                            </View>
                            <Text style={styles.successEmail}>{emailValue}</Text>
                            <Text style={styles.successText}>
                                Lütfen gelen kutunuzu ve spam klasörünü kontrol edin.
                            </Text>
                            <Pressable
                                style={styles.backToLoginButton}
                                onPress={() => router.replace('/(auth)/login')}
                            >
                                <Text style={styles.backToLoginText}>Giriş Ekranına Dön</Text>
                            </Pressable>

                            {/* Resend Option */}
                            <Pressable
                                style={styles.resendButton}
                                onPress={() => {
                                    setIsSuccess(false);
                                    reset();
                                }}
                            >
                                <Text style={styles.resendText}>Farklı bir e-posta dene</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Help Section */}
                    {!isSuccess && (
                        <View style={styles.helpContainer}>
                            <Text style={styles.helpText}>Yardım mı lazım?</Text>
                            <Pressable onPress={() => router.push('/(auth)/login')}>
                                <Text style={styles.helpLink}>Giriş yap</Text>
                            </Pressable>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
    },
    backButton: {
        marginBottom: 32,
    },
    backCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustrationContainer: {
        alignSelf: 'center',
        marginBottom: 32,
        position: 'relative',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF3F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    titleContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
        paddingLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#E50914',
        backgroundColor: '#FFF3F3',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a1a',
    },
    errorText: {
        color: '#E50914',
        fontSize: 13,
        marginTop: 8,
        marginLeft: 4,
        fontWeight: '500',
    },
    hintText: {
        color: '#999',
        fontSize: 13,
        marginTop: 8,
        marginLeft: 4,
    },
    resetButton: {
        backgroundColor: '#E50914',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#E50914',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonInactive: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    buttonIcon: {
        marginLeft: 8,
    },
    successContainer: {
        alignItems: 'center',
        paddingTop: 20,
    },
    successIcon: {
        marginBottom: 24,
    },
    successEmail: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
        paddingHorizontal: 20,
        textAlign: 'center',
    },
    successText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    backToLoginButton: {
        backgroundColor: '#1a1a1a',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 16,
    },
    backToLoginText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    resendButton: {
        padding: 12,
    },
    resendText: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: '600',
    },
    helpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    helpText: {
        color: '#666',
        fontSize: 14,
        marginRight: 4,
    },
    helpLink: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: '600',
    },
});