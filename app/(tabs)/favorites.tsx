import { useTheme } from '@/hooks/use-theme';
import { useFavorites } from '@/hooks/useFavorites';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
    Dimensions,
    FlatList,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeInUp,
    FadeOut,
    Layout
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FavoritesScreen() {
    const { favorites, removeFavorite } = useFavorites();
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();

    const handleRemove = useCallback((id: number) => {
        removeFavorite(id);
    }, [removeFavorite]);

    const navigateToDetail = (movieId: number) => {
        router.push({
            pathname: '/(movies)/[id]',
            params: { id: movieId },
        });
    };

    if (favorites.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                <Stack.Screen options={{ headerShown: false }} />

                <View style={styles.emptyContent}>
                    <Animated.View
                        entering={FadeInUp.duration(800)}
                        style={styles.emptyIconWrapper}
                    >
                        <View style={[styles.emptyIconContainer, { backgroundColor: theme.primaryLight }]}>
                            <Ionicons name="film-outline" size={80} color={theme.primary} />
                            <View style={styles.heartBadge}>
                                <Ionicons name="heart" size={24} color="white" />
                            </View>
                        </View>
                    </Animated.View>

                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        Henüz Favori Yok
                    </Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        Beğendiğiniz filmleri buraya eklemek için{'\n'}
                        kalp ikonuna dokunun
                    </Text>

                    <Pressable
                        style={styles.exploreButton}
                        onPress={() => router.push('/(tabs)')}
                    >
                        <LinearGradient
                            colors={['#E50914', '#b20710']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Ionicons name="compass" size={20} color="white" />
                            <Text style={styles.buttonText}>Keşfetmeye Başla</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Favorilerim',
                    headerStyle: { backgroundColor: theme.card },
                    headerTintColor: theme.text,
                    headerTitleStyle: { fontWeight: '700', color: theme.text },
                    headerShadowVisible: false,
                    headerRight: () => (
                        <View style={[styles.headerBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.badgeText}>{favorites.length}</Text>
                        </View>
                    ),
                }}
            />

            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>
                            Favorilerim
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                            {favorites.length} film favorilerinizde
                        </Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <Animated.View
                        entering={FadeInUp.delay(index * 80).duration(400)}
                        exiting={FadeOut.duration(200)}
                        layout={Layout.springify()}
                        style={styles.cardContainer}
                    >
                        <AnimatedPressable
                            style={[
                                styles.card,
                                {
                                    backgroundColor: theme.card,
                                    shadowColor: theme.shadow
                                }
                            ]}
                            onPress={() => navigateToDetail(item.id)}
                            layout={Layout.springify()}
                        >
                            <ImageBackground
                                source={{
                                    uri: item.poster_path
                                        ? item.poster_path
                                        : `https://picsum.photos/seed/movie${item.id}/300/450`
                                }}
                                style={styles.poster}
                                imageStyle={styles.posterImage}
                            >
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={styles.posterGradient}
                                />

                                <View style={styles.cardContent}>
                                    <Text style={styles.movieTitle} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                    <View style={styles.ratingContainer}>
                                        <Ionicons name="star" size={14} color="#FFD700" />
                                        <Text style={styles.rating}>{item.vote_average}</Text>
                                    </View>
                                </View>

                                {/* Silme butonu */}
                                <Pressable
                                    style={styles.removeButton}
                                    onPress={() => handleRemove(item.id)}
                                    hitSlop={10}
                                >
                                    <View style={[
                                        styles.removeCircle,
                                        { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }
                                    ]}>
                                        <Ionicons
                                            name="close"
                                            size={18}
                                            color={theme.primary}
                                        />
                                    </View>
                                </Pressable>
                            </ImageBackground>
                        </AnimatedPressable>
                    </Animated.View>
                )}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    headerInfo: {
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    cardContainer: {
        width: (width - 48) / 2,
        marginBottom: 16,
    },
    card: {
        width: '100%',
        aspectRatio: 2 / 3,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    poster: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    posterImage: {
        borderRadius: 16,
    },
    posterGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    cardContent: {
        padding: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    movieTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
    },
    removeCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },

    // Boş state stilleri
    emptyContainer: {
        flex: 1,
    },
    emptyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIconWrapper: {
        marginBottom: 24,
    },
    emptyIconContainer: {
        position: 'relative',
        borderRadius: 50,
        padding: 20,
    },
    heartBadge: {
        position: 'absolute',
        bottom: -5,
        right: -10,
        backgroundColor: '#E50914',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E50914',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    exploreButton: {
        width: '100%',
        maxWidth: 280,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#E50914',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    headerBadge: {
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});