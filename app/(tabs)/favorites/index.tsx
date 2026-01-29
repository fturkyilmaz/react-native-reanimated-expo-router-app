import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MovieCard } from '../../../components/movie-card';
import { useFavorites } from '../../../hooks/useFavorites';

export default function FavoritesScreen() {
    const { favorites, removeFavorite } = useFavorites();

    if (favorites.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Stack.Screen options={{ title: 'Favorilerim' }} />
                <Ionicons name="heart-outline" size={80} color="#ccc" />
                <Text style={styles.emptyTitle}>Henüz Favori Yok</Text>
                <Text style={styles.emptyText}>
                    Beğendiğin filmleri burada görmek için kalp ikonuna tıkla
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: `Favorilerim (${favorites.length})` }} />

            <FlatList
                data={favorites}
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeIn.delay(index * 50)}>
                        <MovieCard movie={item} index={index} />
                    </Animated.View>
                )}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.list}
                columnWrapperStyle={styles.columnWrapper}
                ListHeaderComponent={
                    <Text style={styles.headerText}>
                        {favorites.length} film favorilerinde
                    </Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    list: {
        padding: 8,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    headerText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        marginHorizontal: 8,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f8f9fa',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});