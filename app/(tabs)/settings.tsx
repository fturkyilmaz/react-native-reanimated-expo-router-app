import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    // State'ler
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('Türkçe');

    const handleLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: () => logout()
                },
            ]
        );
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Önbelleği Temizle',
            'Tüm yerel veriler silinecek. Devam etmek istiyor musunuz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Temizle',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            Alert.alert('Başarılı', 'Önbellek temizlendi.');
                        } catch (error) {
                            Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
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
        <Pressable style={styles.settingItem} onPress={onPress}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={22} color="#E50914" />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightElement || (showArrow && (
                <Ionicons name="chevron-forward" size={20} color="#999" />
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
        <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={22} color="#E50914" />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#ddd', true: '#E50914' }}
                thumbColor={value ? '#fff' : '#fff'}
                ios_backgroundColor="#ddd"
            />
        </View>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Ayarlar',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#fff' },
                    headerTitleStyle: { color: '#1a1a1a', fontWeight: '700' },
                    headerShadowVisible: false,
                }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profil Kartı */}
                <View style={styles.profileCard}>
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
                        <Text style={styles.profileName}>{user?.name || 'Kullanıcı'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
                    </View>
                    <Pressable style={styles.editButton}>
                        <Ionicons name="create-outline" size={20} color="#666" />
                    </Pressable>
                </View>

                {/* Hesap Ayarları */}
                <SectionHeader title="HESAP" />
                <View style={styles.section}>
                    <SettingItem
                        icon="person-outline"
                        title="Profili Düzenle"
                        subtitle="Ad, e-posta, şifre"
                        onPress={() => router.push('/(settings)/edit-profile')}
                    />
                    <SettingItem
                        icon="lock-closed-outline"
                        title="Gizlilik ve Güvenlik"
                        subtitle="Şifre değiştir, 2FA"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="card-outline"
                        title="Abonelik"
                        subtitle="Premium Plan"
                        rightElement={<Text style={styles.badge}>AKTİF</Text>}
                    />
                </View>

                {/* Tercihler */}
                <SectionHeader title="TERCİHLER" />
                <View style={styles.section}>
                    <SettingToggle
                        icon={isDarkMode ? "moon" : "sunny-outline"}
                        title="Karanlık Mod"
                        subtitle={isDarkMode ? "Açık" : "Kapalı"}
                        value={isDarkMode}
                        onValueChange={setIsDarkMode}
                    />
                    <SettingItem
                        icon="language-outline"
                        title="Dil"
                        subtitle={selectedLanguage}
                        onPress={() => { }}
                    />
                    <SettingToggle
                        icon="notifications-outline"
                        title="Bildirimler"
                        subtitle="Anlık güncellemeler"
                        value={notifications}
                        onValueChange={setNotifications}
                    />
                    <SettingToggle
                        icon="mail-outline"
                        title="E-posta Bülteni"
                        subtitle="Haftalık öneriler"
                        value={emailUpdates}
                        onValueChange={setEmailUpdates}
                    />
                    <SettingToggle
                        icon="play-circle-outline"
                        title="Otomatik Oynat"
                        subtitle="Fragmanları otomatik başlat"
                        value={autoPlay}
                        onValueChange={setAutoPlay}
                    />
                </View>

                {/* İçerik */}
                <SectionHeader title="İÇERİK" />
                <View style={styles.section}>
                    <SettingItem
                        icon="download-outline"
                        title="İndirmeler"
                        subtitle="12 film indirilmiş (2.4 GB)"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="trash-outline"
                        title="Önbelleği Temizle"
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
                <SectionHeader title="DESTEK" />
                <View style={styles.section}>
                    <SettingItem
                        icon="help-circle-outline"
                        title="Yardım Merkezi"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="chatbubble-outline"
                        title="Bize Ulaşın"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Gizlilik Politikası"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="information-circle-outline"
                        title="Hakkında"
                        subtitle="v1.0.0 (Build 2024)"
                        showArrow={false}
                    />
                </View>

                {/* Çıkış Butonu */}
                <Pressable style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#E50914" />
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </Pressable>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>CineSearch v1.0</Text>
                    <Text style={styles.footerSubtext}>Made with ❤️ in Istanbul</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 8,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
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
        backgroundColor: '#f0f0f0',
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
        color: '#1a1a1a',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginLeft: 32,
        marginTop: 24,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    section: {
        backgroundColor: '#fff',
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
        borderBottomColor: '#f0f0f0',
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFF3F3',
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
        color: '#1a1a1a',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#999',
    },
    badge: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#22C55E',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF3F3',
        marginHorizontal: 16,
        marginTop: 32,
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E50914',
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 11,
        color: '#ccc',
    },
});