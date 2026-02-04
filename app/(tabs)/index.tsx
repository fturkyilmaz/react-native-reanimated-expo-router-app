import { MovieCard } from '@/components/movie-card';
import { Skeleton } from '@/components/skeleton';
import { useMovies } from '@/hooks/use-movies';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { Stack } from 'expo-router';
import { Dimensions, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PADDING = 12;
const GAP = 8;
const CARD_WIDTH = (width - (PADDING * 2) - (GAP * 2)) / 2;

export default function HomeScreen() {
  const { movies: allMovies, loading, error, refresh, loadMore, hasMore } = useMovies('popular');
  const { user } = useAuthStore();
  const { theme } = useTheme();

  const renderFooter = () => {
    if (!hasMore && !loading) return <Text style={styles.endText}>Tüm filmler yüklendi</Text>;
    return loading ? <Skeleton width={300} height={200} style={styles.skeletonFooter} /> : null;
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.cardWrapper}>
      <MovieCard movie={item} index={index} />
    </View>
  );

  if (error) {
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
            headerShown: Platform.OS === 'ios',
            title: `Merhaba, ${user?.name || 'Film Sever'}`,
            headerLargeTitle: true,
          }}
        />

        <FlatList
          data={allMovies}
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            loading ? (
              <View style={styles.skeletonGrid}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={[styles.skeletonCard, { width: CARD_WIDTH }]}>
                    <Skeleton width={CARD_WIDTH} height={220} style={{ borderRadius: 12 }} />
                  </View>
                ))}
              </View>
            ) : null
          }
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
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
});
