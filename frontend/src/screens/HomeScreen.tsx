import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StoryCard } from '../components/StoryCard';
import { getStories, searchStories, Story } from '../services/api';

interface HomeScreenProps {
  navigation: any;
  user?: { id: string; email: string } | null;
  onLoginPress?: () => void;
  onLogout?: () => void;
}

const THEMES = ['folklore', 'moral', 'anansi', 'history', 'tradition', 'legend', 'fable'];
const AGE_GROUPS = ['children', 'teens', 'general'];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, user, onLoginPress, onLogout }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState<string | null>(null);

  // Load stories whenever filters change
  useEffect(() => {
    if (searchQuery.trim()) return; // don't override active search
    loadStories();
  }, [themeFilter, ageFilter]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await getStories({
        theme: themeFilter ?? undefined,
        age_group: ageFilter ?? undefined,
      });
      setStories(data);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        setLoading(true);
        const results = await searchStories(query);
        setStories(results);
      } catch (error) {
        console.error('Error searching stories:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Search cleared — reload with current filters
      loadStories();
    }
  }, [themeFilter, ageFilter]);

  const toggleTheme = (t: string) => {
    setThemeFilter(prev => prev === t ? null : t);
    setSearchQuery('');
  };

  const toggleAge = (a: string) => {
    setAgeFilter(prev => prev === a ? null : a);
    setSearchQuery('');
  };

  const clearAllFilters = () => {
    setThemeFilter(null);
    setAgeFilter(null);
    setSearchQuery('');
  };

  const hasActiveFilter = themeFilter || ageFilter || searchQuery.trim();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>HeritageAI</Text>
            <Text style={styles.subtitle}>Preserving Jamaican Stories</Text>
          </View>
          <TouchableOpacity
            style={styles.authButton}
            onPress={user ? onLogout : onLoginPress}
          >
            <Text style={styles.authButtonText}>
              {user ? '👤 Sign Out' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stories..."
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Theme row */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Theme</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, themeFilter === t && styles.chipActive]}
                  onPress={() => toggleTheme(t)}
                >
                  <Text style={[styles.chipText, themeFilter === t && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Age group row */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Age</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {AGE_GROUPS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, ageFilter === a && styles.chipActive]}
                  onPress={() => toggleAge(a)}
                >
                  <Text style={[styles.chipText, ageFilter === a && styles.chipTextActive]}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Clear filters */}
          {hasActiveFilter && (
            <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
              <Text style={styles.clearButtonText}>✕ Clear filters</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Story list */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StoryCard
              story={item}
              onPress={() => navigation.navigate('StoryView', { storyId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {hasActiveFilter ? 'No stories match these filters.' : 'No stories yet. Be the first to add one!'}
              </Text>
              {hasActiveFilter && (
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={styles.clearLinkText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Recording')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const BROWN = '#8B4513';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: { padding: 20, paddingTop: 60, backgroundColor: BROWN },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#F5E6D3' },
  authButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  authButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  searchContainer: { padding: 12, backgroundColor: '#FFF' },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    maxHeight: 120,
    paddingBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    width: 40,
    textTransform: 'uppercase',
  },
  chipScroll: { paddingRight: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0E8E0',
    borderWidth: 1,
    borderColor: '#D0B090',
  },
  chipActive: { backgroundColor: BROWN, borderColor: BROWN },
  chipText: { color: '#666', fontSize: 13 },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  clearButton: { paddingHorizontal: 16, paddingBottom: 6 },
  clearButtonText: { color: BROWN, fontSize: 13 },
  listContent: { padding: 16, paddingBottom: 80 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
  clearLinkText: { color: BROWN, fontSize: 14, textDecorationLine: 'underline' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BROWN,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { fontSize: 32, color: '#FFF', fontWeight: 'bold' },
});
