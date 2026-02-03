/**
 * Video Player Component
 * 
 * Provides video playback using expo-video library.
 * 
 * Usage:
 * <VideoPlayer uri="https://example.com/trailer.mp4" />
 */

import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

interface VideoPlayerProps {
    uri: string;
    autoPlay?: boolean;
    loop?: boolean;
    style?: View['props']['style'];
}

export function VideoPlayer({
    uri,
    autoPlay = false,
    loop = false,
    style,
}: VideoPlayerProps) {
    const player = useVideoPlayer(uri, (player) => {
        if (autoPlay) {
            player.play();
        }
        if (loop) {
            player.loop = true;
        }
    });

    return (
        <View style={[styles.container, style]}>
            <VideoView
                player={player}
                style={styles.video}
                allowsFullscreen
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000000',
        borderRadius: 8,
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
});
