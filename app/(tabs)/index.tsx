import { MovieCard } from '@/components/movie-card';
import { Skeleton } from '@/components/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMovies } from '@/hooks/useMovies';
import { Stack, useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { movies, loading, error, refresh, loadMore, hasMore } = useMovies('popular');
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
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
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  list: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  error: { color: 'red', textAlign: 'center' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16 },
  skeletonCard: { margin: 8, borderRadius: 12 },
  skeletonFooter: { alignSelf: 'center', marginVertical: 20 },
  endText: { textAlign: 'center', color: '#999', padding: 20 },
  logoutButton: { marginRight: 16, padding: 4 }
});