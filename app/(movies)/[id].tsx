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
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
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
    const parsedId = Array.isArray(id) ? id[0] : id;
    const movieId = parseInt(parsedId as string, 10);
    const [isLiked, setIsLiked] = useState(false);
    const [isInWL, setIsInWL] = useState(false);
    const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
    const [trailer, setTrailer] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);

    // Parse movie from navigation params
    const movie: Movie | null = item ? JSON.parse(item as string) : null;

    useEffect(() => {
        const checkStatus = async () => {
            const effectiveId = Number.isNaN(movieId) ? movie?.id ?? movieDetails?.id : movieId;
            if (effectiveId) {
                const liked = await isFavorite(effectiveId);
                const inWL = await isInWatchlist(effectiveId);
                setIsLiked(liked);
                setIsInWL(inWL);
            }
        };
        checkStatus();
    }, [movieId, movie?.id, movieDetails?.id, isFavorite, isInWatchlist]);

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

    const buildMoviePayload = (): Movie | null => {
        const source = movie || movieDetails;
        if (!source) return null;
        const effectiveId = Number.isNaN(movieId) ? source.id : movieId;
        if (!effectiveId) return null;

        return {
            id: effectiveId,
            title: source.title,
            poster_path: source.poster_path,
            vote_average: source.vote_average,
            overview: source.overview || '',
            backdrop_path: source.backdrop_path || null,
            release_date: source.release_date || '',
            genre_ids: 'genre_ids' in source ? source.genre_ids || [] : [],
        };
    };

    const handleFavoritePress = () => {
        const movieNew = buildMoviePayload();
        if (!movieNew) {
            console.warn('[MovieDetail] Movie data not ready for favorite');
            return;
        }

        console.log(movieNew);
        toggleFavorite(movieNew);
        setIsLiked(!isLiked);
    };

    const handleWatchlistPress = () => {
        const movieNew = buildMoviePayload();
        if (!movieNew) {
            console.warn('[MovieDetail] Movie data not ready for watchlist');
            return;
        }

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
            <View style={{ flex: 1, backgroundColor: '#141414', minHeight: 900 }}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 16 }}>Yükleniyor...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#141414', minHeight: 900 }}>
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View style={[
                {
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
                headerAnimatedStyle
            ]}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>{t('movie.details')}</Text>
            </Animated.View>

            <AnimatedScrollView
                onScroll={(e) => {
                    scrollY.value = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 500 }}
            >
                <View style={{ height: '65%', width: '100%', position: 'relative' }}>
                    <AnimatedImage
                        source={{ uri: backdropUrl || imageUrl }}
                        style={[
                            { width: '100%', height: '100%', resizeMode: 'cover' },
                            imageAnimatedStyle
                        ]}
                        defaultSource={require('@/assets/images/placeholder.png')}
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', '#141414']}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
                    />

                    <Pressable
                        style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}
                        onPress={() => router.back()}
                    >
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </View>
                    </Pressable>

                    <Pressable
                        style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}
                        onPress={handleFavoritePress}
                        hitSlop={20}
                    >
                        <View style={[
                            { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
                            isLiked && { backgroundColor: 'white' }
                        ]}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={24}
                                color={isLiked ? "#E50914" : "white"}
                            />
                        </View>
                    </Pressable>

                    <Pressable
                        style={{ position: 'absolute', top: 100, right: 20, zIndex: 10 }}
                        onPress={handleWatchlistPress}
                    >
                        <View style={[
                            { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
                            isInWL && { backgroundColor: 'white' }
                        ]}>
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
                    style={[
                        { paddingHorizontal: 20, marginTop: -30 },
                        contentAnimatedStyle
                    ]}
                >
                    <Text style={{ color: 'white', fontSize: 32, fontWeight: '800', marginBottom: 12, letterSpacing: -0.5 }}>{title}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                        <Text style={{ color: '#b3b3b3', fontSize: 15, fontWeight: '600' }}>{year}</Text>
                        <Text style={{ color: '#666', fontSize: 15, fontWeight: 'bold' }}>•</Text>
                        <Text style={{ color: '#b3b3b3', fontSize: 15 }}>{runtime}</Text>
                        <Text style={{ color: '#666', fontSize: 15, fontWeight: 'bold' }}>•</Text>
                        <View style={{ backgroundColor: '#E50914', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>⭐ {rating}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                        {genres.slice(0, 3).map((genre) => (
                            <View key={genre.id} style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                                <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>{genre.name}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>{t('movie.summary')}</Text>
                        <Text style={{ color: '#b3b3b3', fontSize: 15, lineHeight: 22 }}>
                            {overview || 'Bu film için bir açıklama bulunmuyor.'}
                        </Text>
                    </View>

                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Fragman</Text>
                        {trailer ? (
                            <Pressable
                                style={{ width: '100%', height: 250, borderRadius: 12, overflow: 'hidden', position: 'relative' }}
                                onPress={() => {
                                    const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
                                    WebBrowser.openBrowserAsync(youtubeUrl);
                                }}
                            >
                                <Image
                                    source={{ uri: tmdbService.getYouTubeThumbnail(trailer.key) }}
                                    style={{ width: '100%', height: 250, borderRadius: 12 }}
                                />
                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                    <Ionicons name="play-circle" size={64} color="white" />
                                </View>
                                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.7)' }}>
                                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{trailer.name}</Text>
                                </View>
                            </Pressable>
                        ) : (
                            <View style={{ width: '100%', height: 250, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <Ionicons name="film" size={48} color="#666" />
                                <Text style={{ color: '#666', fontSize: 14, marginTop: 8 }}>Fragman bulunamadı</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </AnimatedScrollView>
        </View>
    );
}
