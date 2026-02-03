import { MovieCard } from '@/components/movie-card';
import { Skeleton } from '@/components/skeleton';
import { Movie } from '@/config/api';
import { useMovies } from '@/hooks/use-movies';
import { useTheme } from '@/hooks/use-theme';
import { tmdbService } from '@/services/tmdb';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Keyboard, KeyboardAvoidingView, KeyboardEvent, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PADDING = 12;
const GAP = 8;
const CARD_WIDTH = (width - (PADDING * 2) - (GAP * 2)) / 2;

export default function HomeScreen() {
  const { movies: allMovies, loading, error, refresh, loadMore, hasMore } = useMovies('popular');
  const { user } = useAuthStore();
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const movies = isSearching ? searchResults : allMovies;

  useEffect(() => {
    const keyboardWillShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };

    Keyboard.addListener('keyboardWillShow', keyboardWillShow);
    Keyboard.addListener('keyboardWillHide', keyboardWillHide);

    return () => {
      Keyboard.removeAllListeners('keyboardWillShow');
      Keyboard.removeAllListeners('keyboardWillHide');
    };
  }, []);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await tmdbService.searchMovies(query);
      setSearchResults(results.results);
    } catch (err) {
      setSearchError('Arama yapılırken bir hata oluştu');
      setSearchResults([]);
    }
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchError(null);
  };

  const renderFooter = () => {
    if (isSearching) return null;
    if (!hasMore && !loading) return <Text style={styles.endText}>Tüm filmler yüklendi</Text>;
    return loading ? <Skeleton width={300} height={200} style={styles.skeletonFooter} /> : null;
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.cardWrapper}>
      <MovieCard movie={item} index={index} />
    </View>
  );

  if (error && !isSearching) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={loading && allMovies.length === 0}
              onRefresh={refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          onEndReached={!isSearching ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            loading && !isSearching ? (
              <View style={styles.skeletonGrid}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={[styles.skeletonCard, { width: CARD_WIDTH }]}>
                    <Skeleton width={CARD_WIDTH} height={220} style={{ borderRadius: 12 }} />
                  </View>
                ))}
              </View>
            ) : isSearching && searchError ? (
              <View style={styles.center}>
                <Text style={styles.error}>{searchError}</Text>
              </View>
            ) : isSearching && searchQuery ? (
              <View style={styles.center}>
                <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.noResults, { color: theme.text }]}>
                  "{searchQuery}" için sonuç bulunamadı
                </Text>
              </View>
            ) : null
          }
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />

        {/* Search Bar - Positioned above tabs */}
        <View style={styles.searchBarWrapper}>
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
                blurOnSubmit={true}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </GlassView>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    padding: PADDING,
    paddingBottom: 100,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: GAP,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  error: {
    color: '#E50914',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E50914',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  noResults: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: PADDING,
    gap: GAP,
  },
  skeletonCard: { margin: 0 },
  skeletonFooter: { alignSelf: 'center', marginVertical: 20 },
  endText: { textAlign: 'center', color: '#999', padding: 20 },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  searchBarWrapper: {
    position: 'absolute',
    bottom: 80,
    left: PADDING,
    right: PADDING,
  },
  searchBarContainer: {
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
