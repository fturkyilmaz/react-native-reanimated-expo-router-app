import { Movie } from '@/config/api';
import { useFavorites } from '@/hooks/useFavorites';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
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
    const router = useRouter();
    const scrollY = useSharedValue(0);
    const movieId = parseInt(id as string);
    const [isLiked, setIsLiked] = useState(false);
    const movie = item ? JSON.parse(item as string) : null;

    const videoSource = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    const player = useVideoPlayer(videoSource, player => {
        player.loop = true;
        player.play();
    });

    const [isPlaying, setIsPlaying] = useState(player.playing);

    useEffect(() => {
        const subscription = player.addListener('playingChange', (event) => {
            setIsPlaying(event.isPlaying);
        });
        return () => subscription.remove();
    }, [player]);

    useEffect(() => {
        setIsLiked(isFavorite(movieId));
    }, [movieId, isFavorite]);

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

    // Yazı sadece poster kaybolmaya başlayınca görünsün
    const headerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [200, 300], [0, 1]),
        transform: [{
            translateY: interpolate(scrollY.value, [200, 300], [-20, 0])
        }]
    }));

    // Poster parallax ve shrink efekti
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

    // Content yukarıdan fade in
    const contentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, 100], [1, 1]),
        transform: [{
            translateY: interpolate(scrollY.value, [0, 300], [0, -50])
        }]
    }));

    const posterPaths = [
        "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", // Joker (2019)
        "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", // Interstellar
        "/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg", // The Godfather
        "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", // Avatar: The Way of Water
        "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", // John Wick: Chapter 4
        "/yF1eOkaYvwiORauRCPWznV9xVvi.jpg", // Dune: Part Two
        "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg", // Fight Club
        "/6KErczPBROQty7QoIsaa6wJYXZi.jpg", // Parasite
        "/q719jXXEzOoYaps6babgKnONONX.jpg", // Spirited Away (Studio Ghibli)
        "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", // Pulp Fiction
    ];

    const imageUrl = `https://image.tmdb.org/t/p/w500${posterPaths[movieId]}`;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header (scroll edince görünür) */}
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
                {/* Poster Container */}
                <View style={styles.posterContainer}>
                    <AnimatedImage
                        source={{ uri: imageUrl }}
                        style={[styles.poster, imageAnimatedStyle]}
                        defaultSource={require('@/assets/images/placeholder.png')}
                    />

                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', '#141414']}
                        style={styles.gradient}
                    />

                    {/* Floating Back Button */}
                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <View style={styles.backButtonCircle}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </View>
                    </Pressable>

                    {/* Floating Favorite Button - ÜSTTE */}
                    <Pressable
                        style={[styles.favoriteButton, { top: 50, right: 20 }]}
                        onPress={handleFavoritePress}
                    >
                        <View style={[styles.favoriteButtonCircle, isLiked && styles.favoriteActive]}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={24}
                                color={isLiked ? "#E50914" : "white"}
                            />
                        </View>
                    </Pressable>
                </View>

                {/* Content */}
                <Animated.View
                    entering={FadeInUp.delay(300).duration(800).springify()}
                    style={[styles.content, contentAnimatedStyle]}
                >
                    <Text style={styles.title}>Inception</Text>

                    <View style={styles.metaContainer}>
                        <Text style={styles.year}>2010</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.duration}>2s 28dk</Text>
                        <Text style={styles.dot}>•</Text>
                        <View style={styles.ratingBadge}>
                            <Text style={styles.rating}>⭐ 8.8</Text>
                        </View>
                    </View>

                    <View style={styles.genreContainer}>
                        {['Bilim Kurgu', 'Aksiyon', 'Gerilim'].map((genre, index) => (
                            <View key={index} style={styles.genreBadge}>
                                <Text style={styles.genreText}>{genre}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('movie.summary')}</Text>
                        <Text style={styles.description}>
                            Dom Cobb çok yetenekli bir hırsızdır. Uzmanlık alanı, zihnin en savunmasız olduğu rüya görme anında,
                            bilinçaltının derinliklerindeki değerli sırları çekip çıkarmak ve onları çalmaktır.{'\n\n'}
                            Cobb'un bu nadir yeteneği, onu kurumsal casusluğun tehlikeli yeni dünyasında aranan bir oyuncu yapmıştır.
                            Aynı zamanda, uluslararası bir kaçak durumuna düşürüp, bütün sevdiği şeyleri kaybetmesine sebep olmuştur.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('movie.cast')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.castScroll}>
                            {['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'].map((actor, index) => (
                                <View key={index} style={styles.castCard}>
                                    <View style={styles.castAvatar}>
                                        <Text style={styles.castInitial}>{actor[0]}</Text>
                                    </View>
                                    <Text style={styles.castName} numberOfLines={2}>{actor}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    <VideoView style={styles.video} player={player} allowsPictureInPicture />
                    <Pressable style={styles.watchButton} onPress={() => {
                        if (isPlaying) {
                            player.pause();
                        } else {
                            player.play();
                        }
                    }}>
                        <Ionicons name="play" size={20} color="white" style={styles.watchIcon} />
                        <Text style={styles.watchButtonText}>{t('movie.trailer')}</Text>
                    </Pressable>
                </Animated.View>
            </AnimatedScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141414',
    },
    scrollContent: {
        paddingBottom: 40,
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
});