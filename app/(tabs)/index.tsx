import { MovieCard } from '@/components/movie-card';
import { Skeleton } from '@/components/skeleton';
import { useMovies } from '@/hooks/use-movies';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { movies, loading, error, refresh, loadMore, hasMore } = useMovies('popular');
  const { user } = useAuthStore();
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search tab or filter current list
      console.log('Searching for:', searchQuery);
    }
  };

  const renderFooter = () => {
    if (!hasMore) return <Text style={styles.endText}>Tüm filmler yüklendi</Text>;
    return loading ? <Skeleton width={300} height={200} style={styles.skeletonFooter} /> : null;
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Merhaba, ${user?.name || 'Film Sever'}`,
          headerLargeTitle: true,
        }}
      />

      <FlatList
        data={movies}
        renderItem={({ item, index }) => <MovieCard movie={item} index={index} />}
        keyExtractor={(item, index) => item.id.toString() + index}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading && movies.length === 0} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonGrid}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} width={150} height={280} style={styles.skeletonCard} />
              ))}
            </View>
          ) : null
        }
      />

      {/* Glass Search Bar at Bottom */}
      <GlassView
        style={styles.searchBarContainer}
        glassEffectStyle="regular"
        tintColor={isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)'}
        isInteractive={true}
      >
        <View style={[styles.searchBarInner, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Film ara..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </GlassView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 8, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  error: { color: 'red', textAlign: 'center' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16 },
  skeletonCard: { margin: 8, borderRadius: 12 },
  skeletonFooter: { alignSelf: 'center', marginVertical: 20 },
  endText: { textAlign: 'center', color: '#999', padding: 20 },
  logoutButton: { marginRight: 16, padding: 4 },
  searchBarContainer: {
    position: 'absolute',
    bottom: 90, // Above tabs
    left: 20,
    right: 20,
    borderRadius: 20,
    padding: 6,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
});
