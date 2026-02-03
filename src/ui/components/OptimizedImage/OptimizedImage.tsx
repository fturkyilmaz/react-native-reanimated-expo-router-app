/**
 * OptimizedImage Component
 * Wrapper around expo-image with automatic caching and optimization
 */

import { Image as ExpoImage, ImageStyle } from 'expo-image';
import React, { memo } from 'react';
import { StyleProp } from 'react-native';

type CachePolicy = 'none' | 'memory' | 'disk' | 'memory-disk';

interface OptimizedImageProps {
    /** Image source URI */
    uri: string | null | undefined;
    /** Image style */
    style?: StyleProp<ImageStyle>;
    /** Cache policy */
    cachePolicy?: CachePolicy;
    /** Transition duration in ms */
    transition?: number;
    /** Blur amount for placeholder (1-100) */
    placeholderBlur?: number;
    /** Accessibility label */
    alt?: string;
    /** Content fit mode */
    contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage = memo(function OptimizedImage({
    uri,
    style,
    cachePolicy = 'memory-disk',
    transition = 300,
    placeholderBlur = 20,
    alt = 'Image',
    contentFit = 'cover',
}: OptimizedImageProps) {
    const source = uri ? { uri } : require('@/assets/images/placeholder.png');

    return (
        <ExpoImage
            source={source as any}
            style={style as StyleProp<ImageStyle>}
            contentFit={contentFit}
            transition={transition}
            cachePolicy={cachePolicy}
            accessibilityLabel={alt}
        />
    );
});

interface MoviePosterProps {
    /** Movie poster path */
    posterPath: string | null;
    /** Movie title for accessibility */
    alt?: string;
    /** Image style */
    style?: StyleProp<ImageStyle>;
    /** Size preset */
    size?: 'small' | 'medium' | 'large' | 'original';
}

export function MoviePoster({
    posterPath,
    alt = 'Movie poster',
    style,
    size = 'medium',
}: MoviePosterProps) {
    const sizes = {
        small: 92,
        medium: 154,
        large: 220,
        original: 500,
    };

    const imageUrl = posterPath
        ? `https://image.tmdb.org/t/p/w${sizes[size]}${posterPath}`
        : null;

    return (
        <OptimizedImage
            uri={imageUrl}
            alt={alt}
            style={[{ width: sizes[size], height: sizes[size] * 1.5 }, style as StyleProp<ImageStyle>]}
            cachePolicy="memory-disk"
            transition={400}
        />
    );
}

export default OptimizedImage;
