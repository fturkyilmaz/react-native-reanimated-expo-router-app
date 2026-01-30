import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Movie {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date?: string;
}

interface MovieCardProps {
    movie: Movie;
    index: number;
}

export function MovieCard({ movie, index }: MovieCardProps) {
    const router = useRouter();
    const scale = useSharedValue(1);

    const handlePress = useCallback(() => {
        router.push({
            pathname: '/(movies)/[id]',
            params: { id: movie.id },
        });
    }, [router, movie.id]);

    const handlePressIn = useCallback(() => {
        'worklet';
        scale.value = withSpring(0.95, { damping: 10 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        'worklet';
        scale.value = withSpring(1, { damping: 10 });
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            transform: [{ scale: scale.value }],
        };
    }, []);

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

    const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : `https://picsum.photos/300/450?random=${movie.id}`;

    return (
        <AnimatedPressable
            entering={FadeIn.delay(index * 100).duration(500)}
            style={[styles.card, animatedStyle]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Image
                source={{ uri: imageUrl }}
                style={styles.poster}
                resizeMode="cover"
            />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
                <View style={styles.meta}>
                    <Text style={styles.year}>
                        {movie.release_date ? movie.release_date.split('-')[0] : '2024'}
                    </Text>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.rating}>⭐ {movie.vote_average?.toFixed(1)}</Text>
                    </View>
                </View>
            </View>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        margin: 8,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        minWidth: 150,
        maxWidth: 200,
    },
    poster: {
        width: '100%',
        height: 220,
        backgroundColor: '#f0f0f0',
    },
    info: {
        padding: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        color: '#1a1a1a',
        lineHeight: 20,
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    year: {
        color: '#666',
        fontSize: 12,
        fontWeight: '500',
    },
    ratingContainer: {
        backgroundColor: '#FFF3F3',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        color: '#E50914',
    },
});