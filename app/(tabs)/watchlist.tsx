import MovieCard from '@/components/movie-card';
import { useTheme } from '@/hooks/use-theme';
import { useWatchlist } from '@/hooks/use-watchlist';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function WatchlistScreen() {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();

    const handleMoviePress = (id: number) => {
        router.push(`/(movies)/${id}`);
    };

    if (watchlist.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {t('watchlist.title')}
                    </Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="bookmark-outline" size={64} color={theme.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        {t('watchlist.emptyTitle')}
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                        {t('watchlist.emptySubtitle')}
                    </Text>
                    <Pressable
                        style={[styles.browseButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/(tabs)/')}
                    >
                        <Text style={styles.browseButtonText}>
                            {t('watchlist.browseMovies')}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>
                    {t('watchlist.title')}
                </Text>
                <Pressable onPress={clearWatchlist}>
                    <Text style={[styles.clearText, { color: theme.primary }]}>
                        {t('watchlist.clearAll')}
                    </Text>
                </Pressable>
            </View>

            <FlatList
                data={watchlist}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                            {watchlist.length} {t('watchlist.movieCount').replace('{{count}}', watchlist.length.toString())}
                        </Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <View style={styles.cardWrapper}>
                        <MovieCard
                            movie={item}
                            index={index}
                            onPress={handleMoviePress}
                            onRemove={removeFromWatchlist}
                        />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    clearText: {
        fontSize: 14,
        fontWeight: '500',
    },
    headerInfo: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    headerSubtitle: {
        fontSize: 14,
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        marginBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    browseButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
