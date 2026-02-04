import { Movie, MovieDetails, Video } from '@/config/api';
import { useFavorites } from '@/hooks/use-favorites';
import { useWatchlist } from '@/hooks/use-watchlist';
import { tmdbService } from '@/services/tmdb';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Extrapolate,
    FadeInUp,
    interpolate,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function MovieDetail() {
    const { t } = useTranslation();
    const { id, item } = useLocalSearchParams();
    const { toggleFavorite, isFavorite } = useFavorites();
    const { toggleWatchlist, isInWatchlist } = useWatchlist();
    const router = useRouter();
    const scrollY = useSharedValue(0);
    const movieId = parseInt(id as string);
    const [isLiked, setIsLiked] = useState(false);
    const [isInWL, setIsInWL] = useState(false);
    const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
    const [trailer, setTrailer] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);

    // Parse movie from navigation params
    const movie: Movie | null = item ? JSON.parse(item as string) : null;

    // const videoSource = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    // const player = useVideoPlayer(videoSource, player => {
    //     player.loop = true;
    //     player.play();
    // });

    // const [isPlaying, setIsPlaying] = useState(player.playing);

    // useEffect(() => {
    //     const subscription = player.addListener('playingChange', (event) => {
    //         setIsPlaying(event.isPlaying);
    //     });
    //     return () => subscription.remove();
    // }, [player]);

    useEffect(() => {
        if (movieId) {
            setIsLiked(isFavorite(movieId));
            setIsInWL(isInWatchlist(movieId));
        }
    }, [movieId, isFavorite, isInWatchlist]);

    // Fetch movie details and videos
    useEffect(() => {
        const fetchData = async () => {
            if (!movieId) return;
            try {
                setLoading(true);
                const [details, videos] = await Promise.all([
                    tmdbService.getMovieDetails(movieId),
                    tmdbService.getMovieVideos(movieId)
                ]);
                setMovieDetails(details);

                // Find the first trailer (official, YouTube)
                const officialTrailer = videos.results.find(
                    v => v.type === 'Trailer' && v.site === 'YouTube' && v.official
                );
                const anyTrailer = videos.results.find(
                    v => v.type === 'Trailer' && v.site === 'YouTube'
                );
                setTrailer(officialTrailer || anyTrailer || null);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [movieId]);

    const handleFavoritePress = () => {
        if (!movie) return;

        const movieNew: Movie = {
            id: movieId,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            overview: movie.overview || '',
            backdrop_path: movie.backdrop_path || null,
            release_date: movie.release_date || '',
            genre_ids: movie.genre_ids || [],
        };

        toggleFavorite(movieNew);
        setIsLiked(!isLiked);
    };

    const handleWatchlistPress = () => {
        if (!movie) return;

        const movieNew: Movie = {
            id: movieId,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            overview: movie.overview || '',
            backdrop_path: movie.backdrop_path || null,
            release_date: movie.release_date || '',
            genre_ids: movie.genre_ids || [],
        };

        toggleWatchlist(movieNew);
        setIsInWL(!isInWL);
    };

    const headerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [50, 150], [0, 1]),
        transform: [{
            translateY: interpolate(scrollY.value, [50, 150], [-10, 0])
        }]
    }));

    const imageAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(scrollY.value, [0, 300], [0, 100], Extrapolate.CLAMP)
            },
            {
                scale: interpolate(scrollY.value, [-200, 0, 300], [1.5, 1, 0.8])
            }
        ],
        opacity: interpolate(scrollY.value, [0, 200, 300], [1, 0.8, 0])
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, 100], [1, 1]),
        transform: [{
            translateY: interpolate(scrollY.value, [0, 300], [0, -50])
        }]
    }));

    // Get image URL from movie or fallback
    const imageUrl = movie?.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : movieDetails?.poster_path
            ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Image';

    // Get backdrop URL
    const backdropUrl = movie?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : movieDetails?.backdrop_path
            ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`
            : null;

    // Get year from release date
    const year = movie?.release_date
        ? movie.release_date.split('-')[0]
        : movieDetails?.release_date
            ? movieDetails.release_date.split('-')[0]
            : '2024';

    // Get runtime
    const runtime = movieDetails?.runtime
        ? `${Math.floor(movieDetails.runtime / 60)}s ${movieDetails.runtime % 60}dk`
        : '2s 0dk';

    // Get rating
    const rating = movie?.vote_average
        ? movie.vote_average.toFixed(1)
        : movieDetails?.vote_average
            ? movieDetails.vote_average.toFixed(1)
            : '0.0';

    // Get title
    const title = movie?.title || movieDetails?.title || 'Film';

    // Get overview
    const overview = movie?.overview || movieDetails?.overview || '';

    // Get genres
    const genres = movieDetails?.genres || [];

    if (loading && !movieDetails) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View style={[styles.header, headerAnimatedStyle]}>
                <Text style={styles.headerTitle} numberOfLines={1}>{t('movie.details')}</Text>
            </Animated.View>

            <AnimatedScrollView
                onScroll={(e) => {
                    scrollY.value = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.posterContainer}>
                    <AnimatedImage
                        source={{ uri: backdropUrl || imageUrl }}
                        style={[styles.poster, imageAnimatedStyle]}
                        defaultSource={require('@/assets/images/placeholder.png')}
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', '#141414']}
                        style={styles.gradient}
                    />

                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <View style={styles.backButtonCircle}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </View>
                    </Pressable>

                    <Pressable
                        style={[styles.favoriteButton, { top: 50, right: 20 }]}
                        onPress={handleFavoritePress}
                        hitSlop={20}
                    >
                        <View style={[styles.favoriteButtonCircle, isLiked && styles.favoriteActive]}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={24}
                                color={isLiked ? "#E50914" : "white"}
                            />
                        </View>
                    </Pressable>

                    <Pressable
                        style={[styles.watchlistButton, { top: 100, right: 20 }]}
                        onPress={handleWatchlistPress}
                    >
                        <View style={[styles.watchlistButtonCircle, isInWL && styles.watchlistActive]}>
                            <Ionicons
                                name={isInWL ? "bookmark" : "bookmark-outline"}
                                size={24}
                                color={isInWL ? "#E50914" : "white"}
                            />
                        </View>
                    </Pressable>
                </View>

                <Animated.View
                    entering={FadeInUp.delay(300).duration(800).springify()}
                    style={[styles.content, contentAnimatedStyle]}
                >
                    <Text style={styles.title}>{title}</Text>

                    <View style={styles.metaContainer}>
                        <Text style={styles.year}>{year}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.duration}>{runtime}</Text>
                        <Text style={styles.dot}>•</Text>
                        <View style={styles.ratingBadge}>
                            <Text style={styles.rating}>⭐ {rating}</Text>
                        </View>
                    </View>

                    <View style={styles.genreContainer}>
                        {genres.slice(0, 3).map((genre, index) => (
                            <View key={index} style={styles.genreBadge}>
                                <Text style={styles.genreText}>{genre.name}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('movie.summary')}</Text>
                        <Text style={styles.description}>
                            {overview || 'Bu film için bir açıklama bulunmuyor.'}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Fragman</Text>
                        {trailer ? (
                            <Pressable
                                style={styles.trailerContainer}
                                onPress={() => {
                                    const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
                                    WebBrowser.openBrowserAsync(youtubeUrl);
                                }}
                            >
                                <Image
                                    source={{ uri: tmdbService.getYouTubeThumbnail(trailer.key) }}
                                    style={styles.trailerThumbnail}
                                />
                                <View style={styles.playButtonOverlay}>
                                    <Ionicons name="play-circle" size={64} color="white" />
                                </View>
                                <View style={styles.trailerLabel}>
                                    <Text style={styles.trailerTitle}>{trailer.name}</Text>
                                </View>
                            </Pressable>
                        ) : (
                            <View style={[styles.video, styles.noVideo]}>
                                <Ionicons name="film" size={48} color="#666" />
                                <Text style={styles.noVideoText}>Fragman bulunamadı</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </AnimatedScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141414',
        minHeight: 900,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
    },
    scrollContent: {
        paddingBottom: 500,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 90,
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        zIndex: 100,
        justifyContent: 'flex-end',
        paddingBottom: 10,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    posterContainer: {
        height: '65%',
        width: '100%',
        position: 'relative',
    },
    poster: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    video: {
        width: '100%',
        height: 250,
        borderRadius: 12,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteButton: {
        position: 'absolute',
        zIndex: 10,
    },
    favoriteButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteActive: {
        backgroundColor: 'white',
    },
    watchlistButton: {
        position: 'absolute',
        zIndex: 10,
    },
    watchlistButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    watchlistActive: {
        backgroundColor: 'white',
    },
    content: {
        paddingHorizontal: 20,
        marginTop: -30,
    },
    title: {
        color: 'white',
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    year: {
        color: '#b3b3b3',
        fontSize: 15,
        fontWeight: '600',
    },
    dot: {
        color: '#666',
        fontSize: 15,
        fontWeight: 'bold',
    },
    duration: {
        color: '#b3b3b3',
        fontSize: 15,
    },
    ratingBadge: {
        backgroundColor: '#E50914',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    rating: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    genreContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    genreBadge: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    genreText: {
        color: '#e5e5e5',
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    description: {
        color: '#b3b3b3',
        fontSize: 15,
        lineHeight: 24,
        letterSpacing: 0.3,
    },
    castScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    castCard: {
        alignItems: 'center',
        marginRight: 16,
        width: 80,
    },
    castAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#404040',
    },
    castInitial: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    castName: {
        color: '#b3b3b3',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
    watchButton: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 4,
        marginTop: 8,
    },
    watchIcon: {
        color: 'black',
        marginRight: 8,
    },
    watchButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '700',
    },
    noVideo: {
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        height: 200,
        borderRadius: 12,
    },
    noVideoText: {
        color: '#666',
        marginTop: 12,
        fontSize: 14,
    },
    trailerContainer: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    trailerThumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    playButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    trailerLabel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    trailerTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
