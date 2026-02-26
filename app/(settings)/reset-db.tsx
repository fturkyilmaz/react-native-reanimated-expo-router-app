/**
 * Reset Database Screen
 * Development tool to reset the SQLite database
 * 
 * Usage:
 * - Accessed from Settings screen via "Database Sıfırla" button
 * - Provides options to reset or reinitialize the database
 * - Shows confirmation dialogs before destructive actions
 */

import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { exportDatabase, initializeDatabase, resetDatabase } from '../../src/db/database';

export default function ResetDatabaseScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    // ─────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────
    
    const handleReset = useCallback(async () => {
        Alert.alert(
            '🔴 Database Sıfırla',
            'Bu işlem TÜM mevcut verileri kalıcı olarak silecektir. Bu işlem geri alınamaz!\n\nDevam etmek istiyor musunuz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet, Sıfırla',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await resetDatabase();
                            Alert.alert(
                                '✅ Başarılı',
                                'Database başarıyla sıfırlandı.\n\nUygulamayı kapatıp yeniden başlatmanız gerekiyor.',
                                [{ text: 'Tamam', onPress: () => router.back() }]
                            );
                        } catch (error) {
                            Alert.alert('❌ Hata', `Sıfırlama başarısız: ${error}`);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    }, [router]);

    const handleReinitialize = useCallback(async () => {
        Alert.alert(
            '🔄 Database Yeniden Başlat',
            'Mevcut database yeniden başlatılacak. Veriler korunacaktır.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet, Yeniden Başlat',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await resetDatabase();
                            const success = await initializeDatabase();
                            Alert.alert(
                                success ? '✅ Başarılı' : '❌ Hata',
                                success
                                    ? 'Database başarıyla yeniden başlatıldı.'
                                    : 'Database başlatılamadı.',
                                [{ text: 'Tamam' }]
                            );
                        } catch (error) {
                            Alert.alert('❌ Hata', `Yeniden başlatma başarısız: ${error}`);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    }, [resetDatabase, initializeDatabase, router]);

    const handleExport = useCallback(async () => {
        Alert.alert(
            '📤 Database Export',
            'Tüm veriler JSON olarak dışa aktarılacak. Paylaşmak ister misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet, Dışa Aktar',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const jsonData = await exportDatabase();
                            await Share.share({
                                message: jsonData,
                                title: 'CineSearch Database Export',
                            });
                        } catch (error) {
                            Alert.alert('❌ Hata', `Export başarısız: ${error}`);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Database Sıfırla',
                    headerShown: true,
                    headerBackTitle: 'Geri',
                    headerBackVisible: true,
                    headerTintColor: theme.text,
                    headerStyle: { backgroundColor: theme.card },
                    headerTitleStyle: { color: theme.text, fontWeight: '600' },
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
                            <Ionicons name="chevron-back" size={24} color={theme.text} />
                        </Pressable>
                    ),
                }}
            />

            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                    
                    {/* Header Icon */}
                    <View style={{
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: theme.primaryLight,
                        justifyContent: 'center', alignItems: 'center', marginBottom: 24
                    }}>
                        <Ionicons name="server-outline" size={40} color={theme.primary} />
                    </View>

                    {/* Title */}
                    <Text style={{
                        fontSize: 24, fontWeight: 'bold', color: theme.text,
                        marginBottom: 8, textAlign: 'center'
                    }}>
                        Database Yönetimi
                    </Text>

                    {/* Subtitle */}
                    <Text style={{
                        fontSize: 14, color: theme.textSecondary,
                        textAlign: 'center', marginBottom: 32, lineHeight: 20
                    }}>
                        Geliştirme amaçlı veritabanı işlemleri.{'\n'}Lütfen dikkatli kullanın.
                    </Text>

                    {/* Buttons Container */}
                    <View style={{ width: '100%', gap: 16, maxWidth: 320 }}>
                        
                        {/* Export Button */}
                        <Pressable
                            onPress={handleExport}
                            disabled={isLoading}
                            style={({ pressed }) => [
                                {
                                    backgroundColor: theme.primary,
                                    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12,
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
                                    shadowColor: theme.shadow,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
                                },
                                pressed && { opacity: 0.8 },
                                isLoading && { opacity: 0.6 },
                            ]}
                        >
                            <Ionicons name="download-outline" size={20} color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                                Database Export (JSON)
                            </Text>
                        </Pressable>

                        {/* Reinitialize Button */}
                        <Pressable
                            onPress={handleReinitialize}
                            disabled={isLoading}
                            style={({ pressed }) => [
                                {
                                    backgroundColor: theme.success,
                                    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12,
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
                                    shadowColor: theme.shadow,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
                                },
                                pressed && { opacity: 0.8 },
                                isLoading && { opacity: 0.6 },
                            ]}
                        >
                            <Ionicons name="refresh-outline" size={20} color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                                Database Yeniden Başlat
                            </Text>
                        </Pressable>

                        {/* Reset Button (Danger) */}
                        <Pressable
                            onPress={handleReset}
                            disabled={isLoading}
                            style={({ pressed }) => [
                                {
                                    backgroundColor: theme.error,
                                    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12,
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
                                    shadowColor: theme.shadow,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
                                },
                                pressed && { opacity: 0.8 },
                                isLoading && { opacity: 0.6 },
                            ]}
                        >
                            <Ionicons name="trash-outline" size={20} color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                                Database Sıfırla
                            </Text>
                        </Pressable>
                    </View>

                    {/* Warning Box */}
                    <View style={{
                        backgroundColor: theme.warningLight,
                        padding: 16, borderRadius: 12, marginTop: 32,
                        maxWidth: 320, width: '100%',
                    }}>
                        <Text style={{ textAlign: 'center', fontSize: 20, marginBottom: 8 }}>⚠️</Text>
                        <Text style={{
                            color: theme.warning, fontSize: 13,
                            textAlign: 'center', lineHeight: 18
                        }}>
                            Sıfırlama işlemi tüm verileri kalıcı olarak siler.{'\n'}
                            İşlem sonrası uygulamayı yeniden başlatmanız gerekir.
                        </Text>
                    </View>
                </View>
            </View>
        </>
    );
}
