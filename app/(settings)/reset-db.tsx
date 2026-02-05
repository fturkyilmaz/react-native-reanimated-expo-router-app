/**
 * Reset Database Screen
 * Development tool to reset the SQLite database
 */
import { useCallback } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { initializeDatabase, resetDatabase } from '../../src/db/database';

export default function ResetDatabaseScreen() {
    const handleReset = useCallback(async () => {
        Alert.alert(
            'Database Reset',
            'Bu işlem mevcut verileri silecek. Devam etmek istiyor musunuz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet, Sıfırla',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await resetDatabase();
                            Alert.alert(
                                'Başarılı',
                                'Database sıfırlandı. Uygulamayı kapatıp yeniden başlatın.',
                                [{ text: 'Tamam' }]
                            );
                        } catch (error) {
                            Alert.alert('Hata', `Sıfırlama başarısız: ${error}`);
                        }
                    },
                },
            ]
        );
    }, []);

    const handleReinitialize = useCallback(async () => {
        Alert.alert(
            'Database Yeniden Başlat',
            'Mevcut database yeniden başlatılacak (veriler korunacak).',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet, Yeniden Başlat',
                    onPress: async () => {
                        try {
                            await resetDatabase();
                            const success = await initializeDatabase();
                            Alert.alert(
                                success ? 'Başarılı' : 'Hata',
                                success
                                    ? 'Database yeniden başlatıldı.'
                                    : 'Database başlatılamadı.'
                            );
                        } catch (error) {
                            Alert.alert('Hata', `Yeniden başlatma başarısız: ${error}`);
                        }
                    },
                },
            ]
        );
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
                Database Yönetimi
            </Text>

            <TouchableOpacity
                onPress={handleReinitialize}
                style={{
                    backgroundColor: '#4CAF50',
                    padding: 15,
                    borderRadius: 10,
                    width: '80%',
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Database Yeniden Başlat</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleReset}
                style={{
                    backgroundColor: '#f44336',
                    padding: 15,
                    borderRadius: 10,
                    width: '80%',
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Database Sıfırla (Veriler Silinir)</Text>
            </TouchableOpacity>

            <Text style={{ marginTop: 20, color: '#666', textAlign: 'center' }}>
                Not: Sıfırlama sonrası uygulamayı kapatıp yeniden başlatın.
            </Text>
        </View>
    );
}
