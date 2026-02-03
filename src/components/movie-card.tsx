/**
 * MovieCard Component
 * Displays movie information in a card format with animation
 */

import type { Movie } from '@/config/api';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/core/constants/theme';
import { haptics } from '@/core/utils/haptics';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MovieCardProps {
    movie: Movie;
    index?: number;
    onPress?: (id: number) => void;
    onRemove?: (id: number) => void;
    onAddToFavorites?: (movie: Movie) => void;
}

export const MovieCard = memo(function MovieCard({
    movie,
    index = 0,
    onPress,
    onRemove,
    onAddToFavorites
}: MovieCardProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const scale = useSharedValue(1);

    const handlePress = useCallback(() => {
        haptics.tap();
        if (onPress) {
            onPress(movie.id);
        } else {
            router.push({
                pathname: '/(movies)/[id]',
                params: { id: movie.id.toString(), item: JSON.stringify(movie) },
            });
        }
    }, [router, movie.id, onPress]);

    const handleRemove = useCallback((e: any) => {
        e.stopPropagation();
        if (onRemove) {
            haptics.tap();
            onRemove(movie.id);
        }
    }, [movie.id, onRemove]);

    const handleAddToFavorites = useCallback((e: any) => {
        e.stopPropagation();
        if (onAddToFavorites) {
            haptics.tap();
            onAddToFavorites(movie);
        }
    }, [movie, onAddToFavorites]);

    const handlePressIn = useCallback(() => {
        'worklet';
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        'worklet';
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            transform: [{ scale: scale.value }],
        };
    }, []);

    const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : `https://picsum.photos/300/450?random=${movie.id}`;

    return (
        <AnimatedPressable
            entering={FadeIn.delay(index * 50).duration(400)}
            style={[
                styles.card,
                animatedStyle,
                { backgroundColor: theme.card },
            ]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="button"
            accessibilityLabel={movie.title}
        >
            <View style={styles.posterContainer}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.poster}
                    resizeMode="cover"
                />
                <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>
                        ⭐ {movie.vote_average?.toFixed(1)}
                    </Text>
                </View>

                {/* Remove button for watchlist */}
                {onRemove && (
                    <Pressable
                        style={styles.removeButton}
                        onPress={handleRemove}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.removeButtonText}>✕</Text>
                    </Pressable>
                )}
            </View>

            <View style={styles.info}>
                <Text
                    style={[styles.title, { color: theme.text }]}
                    numberOfLines={2}
                >
                    {movie.title}
                </Text>

                <View style={styles.meta}>
                    <Text style={[styles.year, { color: theme.textSecondary }]}>
                        {movie.release_date ? movie.release_date.split('-')[0] : '2024'}
                    </Text>
                </View>
            </View>
        </AnimatedPressable>
    );
});

const styles = StyleSheet.create({
    card: {
        flex: 1,
        margin: SPACING.xs,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.medium,
        minWidth: 150,
        maxWidth: 180,
    },
    posterContainer: {
        position: 'relative',
    },
    poster: {
        width: '100%',
        height: 220,
        backgroundColor: COLORS.gray800,
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    ratingText: {
        ...TYPOGRAPHY.labelSmall,
        color: COLORS.white,
        fontWeight: '600',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    info: {
        padding: SPACING.md,
    },
    title: {
        ...TYPOGRAPHY.labelLarge,
        marginBottom: SPACING.xs,
        lineHeight: 20,
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    year: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
    },
});

export default MovieCard;
