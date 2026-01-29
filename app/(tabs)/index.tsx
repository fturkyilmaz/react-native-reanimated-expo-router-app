import { Skeleton } from '@/components//skeleton';
import { MovieCard } from '@/components/movie-card';
import { useAuth } from '@/hooks/useAuth';
import { useMovies } from '@/hooks/useMovies';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Merhaba, ${user?.name || 'Film Sever'}`,
          headerLargeTitle: true,
          headerRight: () => (
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#E50914" />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={movies}
        renderItem={({ item, index }) => <MovieCard movie={item} index={index} />}
        keyExtractor={(item) => item.id.toString()}
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
    </View>
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