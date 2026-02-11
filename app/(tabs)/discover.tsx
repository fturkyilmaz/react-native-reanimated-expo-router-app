import { MovieCard } from '@/components/movie-card';
import { Movie } from '@/config/api';
import { useTheme } from '@/hooks/use-theme';
import { useGenreList, useNowPlayingMovies, useSearchMovies, useTopRatedMovies, useUpcomingMovies } from '@/hooks/useMoviesQuery';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Keyboard, KeyboardAvoidingView, KeyboardEvent, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PADDING = 12;
const GAP = 8;
const CARD_WIDTH = (width - (PADDING * 2) - (GAP * 2)) / 2;

type TabType = 'popular' | 'top_rated' | 'now_playing' | 'upcoming' | 'search';

const TAB_CONFIG = [
    { key: 'popular', label: '🔥 Popüler', icon: 'flame' },
    { key: 'top_rated', label: '⭐ En İyi', icon: 'star' },
    { key: 'now_playing', label: '🎬 Vizyonda', icon: 'play-circle' },
    { key: 'upcoming', label: '📅 Yaklaşan', icon: 'calendar' },
] as const;

export default function DiscoverScreen() {
    const { theme, isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('top_rated');
    const [searchQuery, setSearchQuery] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [searchResults, setSearchResults] = useState<Movie[]>([]);
    const [inSearchMode, setInSearchMode] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

    // Queries
    const { data: genres } = useGenreList();
    const { data: topRatedData, isLoading: topRatedLoading, refetch: refetchTopRated, hasNextPage: topRatedHasMore, fetchNextPage: fetchTopRated } = useTopRatedMovies();
    const { data: nowPlayingData, isLoading: nowPlayingLoading, refetch: refetchNowPlaying, hasNextPage: nowPlayingHasMore, fetchNextPage: fetchNowPlaying } = useNowPlayingMovies();
    const { data: upcomingData, isLoading: upcomingLoading, refetch: refetchUpcoming, hasNextPage: upcomingHasMore, fetchNextPage: fetchUpcoming } = useUpcomingMovies();
    const { data: searchData, isLoading: searchLoading } = useSearchMovies(searchQuery);

    // Get movies based on active tab
    const getMovies = () => {
        switch (activeTab) {
            case 'top_rated':
                return topRatedData?.pages.flatMap(page => page.results) || [];
            case 'now_playing':
                return nowPlayingData?.pages.flatMap(page => page.results) || [];
            case 'upcoming':
                return upcomingData?.pages.flatMap(page => page.results) || [];
            case 'search':
                return searchResults;
            default:
                return topRatedData?.pages.flatMap(page => page.results) || [];
        }
    };

    const isLoading = () => {
        switch (activeTab) {
            case 'top_rated':
                return topRatedLoading;
            case 'now_playing':
                return nowPlayingLoading;
            case 'upcoming':
                return upcomingLoading;
            case 'search':
                return searchLoading;
            default:
                return topRatedLoading;
        }
    };

    const hasMore = () => {
        switch (activeTab) {
            case 'top_rated':
                return topRatedHasMore;
            case 'now_playing':
                return nowPlayingHasMore;
            case 'upcoming':
                return upcomingHasMore;
            default:
                return false;
        }
    };

    const loadMore = () => {
        switch (activeTab) {
            case 'top_rated':
                fetchTopRated();
                break;
            case 'now_playing':
                fetchNowPlaying();
                break;
            case 'upcoming':
                fetchUpcoming();
                break;
        }
    };

    const refresh = () => {
        switch (activeTab) {
            case 'top_rated':
                refetchTopRated();
                break;
            case 'now_playing':
                refetchNowPlaying();
                break;
            case 'upcoming':
                refetchUpcoming();
                break;
        }
    };

    // Search effect
    useEffect(() => {
        if (searchData?.results) {
            setSearchResults(searchData.results);
        }
    }, [searchData]);

    // Keyboard handlers
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

    const handleSearch = useCallback(() => {
        if (searchQuery.trim()) {
            setActiveTab('search');
            setInSearchMode(true);
        }
    }, [searchQuery]);

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setInSearchMode(false);
        setActiveTab('top_rated');
    };

    const handleMoviePress = (movie: Movie) => {
        // Navigate to movie detail
        import('expo-router').then(({ router }) => {
            router.push({
                pathname: '/(movies)/[id]',
                params: {
                    id: movie.id.toString(),
                    item: JSON.stringify(movie),
                },
            });
        });
    };

    const renderMovieItem = ({ item, index }: { item: Movie; index: number }) => (
        <View style={styles.cardWrapper}>
            <MovieCard movie={item} index={index} onPress={() => handleMoviePress(item)} />
        </View>
    );

    const renderFooter = () => {
        if (inSearchMode) return null;
        if (!hasMore() && !isLoading()) return <Text style={styles.endText}>Tüm filmler yüklendi</Text>;
        return null;
    };

    const movies = getMovies();
    const loading = isLoading();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'ios' ? 0 : 20 }]}>
            <Stack.Screen
                options={{
                    headerShown: Platform.OS === 'ios',
                    title: 'Keşfet',
                    headerLargeTitle: true,
                }}
            />

            {/* Tab Bar */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBar}
                contentContainerStyle={styles.tabBarContent}
            >
                {TAB_CONFIG.map((tab, index) => (
                    <Pressable
                        key={tab.key}
                        style={[
                            styles.tabButton,
                            activeTab === tab.key && styles.tabButtonActive,
                            index === 0 && styles.tabFirst,
                        ]}
                        onPress={() => {
                            setActiveTab(tab.key as TabType);
                            if (searchQuery) clearSearch();
                        }}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={16}
                            color={activeTab === tab.key ? 'white' : theme.textSecondary}
                            style={styles.tabIcon}
                        />
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.key && styles.tabTextActive,
                        ]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Genre Chips */}
            {genres?.genres && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.genreContainer}
                    contentContainerStyle={styles.genreContent}
                >
                    {genres.genres.slice(0, 10).map((genre) => (
                        <Pressable
                            key={genre.id}
                            style={[
                                styles.genreChip,
                                selectedGenre === genre.id && styles.genreChipActive,
                            ]}
                            onPress={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                        >
                            <Text style={[
                                styles.genreText,
                                selectedGenre === genre.id && styles.genreTextActive,
                            ]}>
                                {genre.name}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Search Bar - GlassView on iOS, normal on Android */}
                <View style={styles.searchBarWrapper}>
                    {Platform.OS === 'ios' ? (
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
                                    testID="search-input"
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
                    ) : (
                        <View style={[styles.searchBarInnerAndroid, {
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        }]}>
                            <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                testID="search-input"
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
                    )}
                </View>

                <FlatList
                    testID="movies-flatlist"
                    data={movies}
                    renderItem={renderMovieItem}
                    keyExtractor={(item, index) => `${item?.id}-${index}`}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.list}
                    keyboardDismissMode="on-drag"
                    refreshControl={
                        <RefreshControl
                            refreshing={loading && movies.length === 0}
                            onRefresh={refresh}
                            tintColor={theme.primary}
                            colors={[theme.primary]}
                        />
                    }
                    onEndReached={!inSearchMode ? loadMore : undefined}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        loading ? (
                            <View style={styles.skeletonGrid}>
                                {[...Array(6)].map((_, i) => (
                                    <View key={i} style={[styles.skeletonCard, { width: CARD_WIDTH }]}>
                                        <View style={[styles.skeleton, { width: CARD_WIDTH, height: 220 }]} />
                                    </View>
                                ))}
                            </View>
                        ) : inSearchMode && searchQuery ? (
                            <View style={styles.center}>
                                <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
                                <Text style={[styles.noResults, { color: theme.text }]}>
                                    "{searchQuery}" için sonuç bulunamadı
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.center}>
                                <Ionicons name="film-outline" size={48} color={theme.textSecondary} />
                                <Text style={[styles.noResults, { color: theme.text }]}>
                                    Film bulunamadı
                                </Text>
                            </View>
                        )
                    }
                    initialNumToRender={6}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={true}
                    showsVerticalScrollIndicator={false}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBar: {
        flexGrow: 0,
        marginBottom: 8,
    },
    tabBarContent: {
        paddingHorizontal: 12,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabButtonActive: {
        backgroundColor: '#E50914',
    },
    tabFirst: {
        marginLeft: 0,
    },
    tabIcon: {
        marginRight: 6,
    },
    tabText: {
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: 'white',
    },
    genreContainer: {
        flexGrow: 0,
        marginBottom: 8,
    },
    genreContent: {
        paddingHorizontal: 12,
    },
    genreChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        marginRight: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    genreChipActive: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    genreText: {
        color: '#ccc',
        fontSize: 13,
        fontWeight: '500',
    },
    genreTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    searchBarWrapper: {
        paddingHorizontal: 12,
        paddingBottom: 8,
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
    searchBarInnerAndroid: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginHorizontal: 12,
        marginVertical: 8,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 0,
    },
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
        padding: 20,
        marginTop: 40,
    },
    noResults: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    endText: {
        textAlign: 'center',
        color: '#999',
        padding: 20,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        marginBottom: 8,
    },
    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: PADDING,
        gap: GAP,
    },
    skeletonCard: {
        margin: 0,
    },
    skeleton: {
        backgroundColor: '#333',
        borderRadius: 12,
    },
});
