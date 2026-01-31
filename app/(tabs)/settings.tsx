import { useTheme } from '@/hooks/use-theme';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import i18n from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, logout, isBiometricEnabled, enableBiometric, disableBiometric } = useAuthStore();
    const { isDarkMode, toggleTheme, theme } = useTheme();
    const { t } = useTranslation();
    const { isAvailable, isEnrolled, biometricType, authenticate, getBiometricTypeName, checkBiometricSupport } = useBiometricAuth();
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
    const [biometricSupported, setBiometricSupported] = useState(false);

    useEffect(() => {
        checkBiometricSupport().then((support) => {
            setBiometricSupported(support.isAvailable && support.isEnrolled);
        });
    }, [checkBiometricSupport]);

    const changeLanguage = (lang: 'tr' | 'en') => {
        i18n.changeLanguage(lang);
        setSelectedLanguage(lang === 'tr' ? t('languages.tr') : t('languages.en'));
    };

    const handleLogout = () => {
        Alert.alert(t('auth.logout'), t('auth.logoutConfirm'),
            [{ text: t('common.cancel'), style: 'cancel' },
            {
                text: t('auth.logout'),
                style: 'destructive',
                onPress: () => { logout(); router.replace('/(auth)/login'); }
            }
            ],
        );
    };

    const handleToggleBiometric = async (value: boolean) => {
        if (!biometricSupported) {
            Alert.alert(
                t('biometric.notAvailable'),
                t('biometric.notAvailableMessage'),
                [{ text: t('common.ok') }]
            );
            return;
        }

        if (value) {
            // Biyometrik açma - önce doğrulama yap
            const result = await authenticate(
                t('biometric.promptTitle'),
                t('common.cancel')
            );

            if (result.success) {
                try {
                    await enableBiometric(biometricType);
                } catch (error) {
                    Alert.alert(t('common.error'), t('biometric.enableError'));
                }
            }
        } else {
            // Biyometrik kapatma - onay iste
            Alert.alert(
                t('biometric.disable'),
                t('biometric.disableConfirm'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('biometric.disable'),
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await disableBiometric();
                            } catch (error) {
                                Alert.alert(t('common.error'), t('biometric.disableError'));
                            }
                        },
                    },
                ]
            );
        }
    };

    const handleClearCache = async () => {
        Alert.alert(t('settings.clearCache'), t('settings.clearCacheConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.clear'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            Alert.alert(t('common.success'), t('settings.cacheCleared'));
                        } catch (error) {
                            Alert.alert(t('common.error'), t('common.errorOccured'));
                        }
                    }
                },
            ]
        );
    };

    const SettingItem = ({
        icon,
        title,
        subtitle,
        onPress,
        showArrow = true,
        rightElement
    }: any) => (
        <Pressable
            style={[
                styles.settingItem,
                {
                    backgroundColor: theme.card,
                    borderBottomColor: theme.divider
                }
            ]}
            onPress={onPress}
        >
            <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={icon} size={22} color={theme.primary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
            </View>
            {rightElement || (showArrow && (
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            ))}
        </Pressable>
    );

    const SettingToggle = ({
        icon,
        title,
        subtitle,
        value,
        onValueChange
    }: any) => (
        <View style={[
            styles.settingItem,
            {
                backgroundColor: theme.card,
                borderBottomColor: theme.divider
            }
        ]}>
            <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={icon} size={22} color={theme.primary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: theme.divider, true: theme.primary }}
                thumbColor={'#fff'}
                ios_backgroundColor={theme.divider}
            />
        </View>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{title}</Text>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    title: t('settings.title'),
                    headerShown: true,
                    headerStyle: { backgroundColor: theme.card },
                    headerTitleStyle: { color: theme.text, fontWeight: '700' },
                    headerShadowVisible: false,
                    headerTintColor: theme.text,
                }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profil Kartı */}
                <View style={[
                    styles.profileCard,
                    {
                        backgroundColor: theme.card,
                        shadowColor: theme.shadow
                    }
                ]}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{
                                uri: 'https://ui-avatars.com/api/?name=' +
                                    encodeURIComponent(user?.name || 'User') +
                                    '&background=E50914&color=fff&size=128'
                            }}
                            style={styles.avatar}
                        />
                        <Pressable style={styles.cameraButton}>
                            <Ionicons name="camera" size={16} color="white" />
                        </Pressable>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: theme.text }]}>
                            {user?.name || 'User'}
                        </Text>
                        <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
                            {user?.email || 'user@example.com'}
                        </Text>
                    </View>
                    <Pressable style={[styles.editButton, { backgroundColor: theme.background }]}>
                        <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
                    </Pressable>
                </View>

                {/* Hesap Ayarları */}
                <SectionHeader title={t('settings.account')} />
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <SettingItem
                        icon="person-outline"
                        title={t('settings.editProfile')}
                        subtitle="Ad, e-posta, şifre"
                        onPress={() => router.push('/(settings)/edit-profile')}
                    />
                    <SettingItem
                        icon="lock-closed-outline"
                        title={t('settings.privacy')}
                        subtitle="Şifre değiştir, 2FA"
                        onPress={() => { }}
                    />
                    {/* Biometric Toggle */}
                    {biometricSupported && (
                        <SettingToggle
                            icon={biometricType === 'faceID' ? 'scan-outline' : 'finger-print-outline'}
                            title={t('biometric.enable')}
                            subtitle={isBiometricEnabled ? t('biometric.enabled') : t('biometric.disabled')}
                            value={isBiometricEnabled}
                            onValueChange={handleToggleBiometric}
                        />
                    )}
                    <SettingItem
                        icon="card-outline"
                        title="Abonelik"
                        subtitle="Premium Plan"
                        rightElement={
                            <Text style={[styles.badge, {
                                color: theme.success,
                                backgroundColor: isDarkMode ? '#1a2f1a' : '#DCFCE7'
                            }]}>
                                AKTİF
                            </Text>
                        }
                    />
                </View>

                {/* Tercihler */}
                <SectionHeader title={t('settings.preferences')} />
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <SettingToggle
                        icon={isDarkMode ? "moon" : "sunny-outline"}
                        title={t('settings.darkMode')}
                        subtitle={isDarkMode ? "Açık" : "Kapalı"}
                        value={isDarkMode}
                        onValueChange={toggleTheme}
                    />
                    <SettingItem
                        icon="language-outline"
                        title={t('settings.language')}
                        subtitle={selectedLanguage}
                        onPress={() => changeLanguage(selectedLanguage === 'Türkçe' ? 'en' : 'tr')}
                    />
                    <SettingToggle
                        icon="notifications-outline"
                        title={t('settings.notifications')}
                        subtitle="Anlık güncellemeler"
                        value={notifications}
                        onValueChange={setNotifications}
                    />
                    <SettingToggle
                        icon="mail-outline"
                        title={t('settings.emailUpdates')}
                        subtitle="Haftalık öneriler"
                        value={emailUpdates}
                        onValueChange={setEmailUpdates}
                    />
                    <SettingToggle
                        icon="play-circle-outline"
                        title={t('settings.autoPlay')}
                        subtitle="Fragmanları otomatik başlat"
                        value={autoPlay}
                        onValueChange={setAutoPlay}
                    />
                </View>

                {/* İçerik */}
                <SectionHeader title={t('settings.content')} />
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <SettingItem
                        icon="download-outline"
                        title={t('settings.downloads')}
                        subtitle="12 film indirilmiş (2.4 GB)"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="trash-outline"
                        title={t('settings.clearCache')}
                        subtitle="124 MB"
                        onPress={handleClearCache}
                        showArrow={false}
                    />
                    <SettingItem
                        icon="cellular-outline"
                        title="Mobil Veri Kullanımı"
                        subtitle="Yüksek kalite"
                        onPress={() => { }}
                    />
                </View>

                {/* Destek */}
                <SectionHeader title={t('settings.support')} />
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <SettingItem
                        icon="help-circle-outline"
                        title={t('settings.help')}
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="chatbubble-outline"
                        title={t('settings.contact')}
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title={t('settings.privacyPolicy')}
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="information-circle-outline"
                        title={t('settings.about')}
                        subtitle="v1.0.0 (Build 2024)"
                        showArrow={false}
                    />
                </View>

                {/* Çıkış Butonu */}
                <Pressable
                    style={[
                        styles.logoutButton,
                        {
                            backgroundColor: isDarkMode ? '#2a1a1a' : '#FFF3F3'
                        }
                    ]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color={theme.primary} />
                    <Text style={[styles.logoutText, { color: theme.primary }]}>{t('auth.logout')}</Text>
                </Pressable>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textMuted }]}>
                        CineSearch v1.0
                    </Text>
                    <Text style={[styles.footerSubtext, { color: theme.textSecondary }]}>
                        Made with ❤️ in Istanbul
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        marginTop: 8,
        padding: 20,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 32,
        marginTop: 24,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    section: {
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
    },
    badge: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginTop: 32,
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 12,
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 11,
    },
});