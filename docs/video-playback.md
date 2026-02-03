# Video Playback

## Overview

CineSearch includes a video playback component for playing movie trailers and video content using the `expo-video` library.

## Usage

### Basic Video Player

```tsx
import { VideoPlayer } from '@/ui/components/VideoPlayer/VideoPlayer';

<VideoPlayer 
  uri="https://example.com/trailer.mp4"
/>
```

### With Auto-Play

```tsx
<VideoPlayer 
  uri="https://example.com/trailer.mp4"
  autoPlay={true}
  loop={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `uri` | `string` | Required | URL of the video to play |
| `autoPlay` | `boolean` | `false` | Whether to auto-play the video |
| `loop` | `boolean` | `false` | Whether to loop the video |
| `style` | `ViewStyle` | Optional | Custom styles for the container |

## Examples

### Movie Trailer

```tsx
import { VideoPlayer } from '@/ui/components/VideoPlayer/VideoPlayer';

export function MovieTrailer({ trailerUrl }: { trailerUrl: string }) {
  return (
    <VideoPlayer 
      uri={trailerUrl}
      autoPlay={false}
      loop={true}
      style={styles.trailer}
    />
  );
}

const styles = StyleSheet.create({
  trailer: {
    marginTop: 16,
    borderRadius: 12,
  },
});
```

### Auto-Playing Preview

```tsx
<VideoPlayer 
  uri="https://example.com/preview.mp4"
  autoPlay={true}
  style={styles.preview}
/>
```

## Installation

The video player uses `expo-video` which is included in Expo SDK. No additional installation is required.

```bash
# Already included in Expo SDK
npx expo install expo-video
```

## Architecture

```
src/ui/components/VideoPlayer/
├── VideoPlayer.tsx      # Main video player component
└── README.md            # This file
```

## Features

- **Native Controls**: Built-in playback controls (play, pause, seek, volume)
- **Fullscreen Mode**: Tap to enter fullscreen viewing
- **Auto-Play**: Optional automatic playback on mount
- **Looping**: Optional video looping
- **Responsive**: Adapts to container width with 16:9 aspect ratio

## Performance Considerations

1. **Lazy Loading**: Video is not loaded until the component mounts
2. **Memory Management**: Native video player handles memory efficiently
3. **Network**: Videos are streamed, not downloaded completely

## Accessibility

- Video player has built-in accessibility labels
- Fullscreen mode respects device rotation settings
- Playback controls are accessible to assistive technologies

## Troubleshooting

### Video Not Loading

Ensure the video URL is valid and accessible:

```typescript
// Check URL format
const videoUrl = 'https://example.com/video.mp4';

// Test URL is accessible
const response = await fetch(videoUrl, { method: 'HEAD' });
if (!response.ok) {
  console.warn('Video URL not accessible');
}
```

### Fullscreen Not Working

Fullscreen requires the component to be in a properly sized container:

```tsx
// Ensure container has defined dimensions
<View style={{ width: '100%' }}>
  <VideoPlayer uri="..." />
</View>
```

## Related Files

- [`src/ui/components/VideoPlayer/VideoPlayer.tsx`](../src/ui/components/VideoPlayer/VideoPlayer.tsx) - Component source
- [`src/features/movies/`](../../src/features/movies/) - Movie feature using video player
