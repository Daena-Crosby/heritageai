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
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { getStories, searchStories, Story } from '../services/api';
import { StoryCard } from '../components/StoryCard';

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: 'apps' as const },
  { id: 'folklore', label: 'Folklore', icon: 'book' as const },
  { id: 'moral', label: 'Moral', icon: 'heart' as const },
  { id: 'personal', label: 'Personal', icon: 'person' as const },
  { id: 'history', label: 'History', icon: 'time' as const },
  { id: 'ancestral', label: 'Ancestral', icon: 'people' as const },
  { id: 'tradition', label: 'Tradition', icon: 'flame' as const },
  { id: 'legend', label: 'Legend', icon: 'star' as const },
  { id: 'fable', label: 'Fable', icon: 'leaf' as const },
  { id: 'anansi', label: 'Anansi', icon: 'bug' as const },
] as const;

type FilterId = (typeof FILTER_TABS)[number]['id'];

const CATEGORY_ICONS = [
  { id: 'family', icon: 'people', label: 'Family', color: '#FF6B6B' },
  { id: 'folklore', icon: 'book', label: 'Folklore', color: '#4ECDC4' },
  { id: 'recipes', icon: 'restaurant', label: 'Recipes', color: '#FFE66D' },
  { id: 'history', icon: 'time', label: 'History', color: '#95E1D3' },
];

interface HeritageVaultScreenProps {
  onStorySelect: (id: string) => void;
}

export const HeritageVaultScreen: React.FC<HeritageVaultScreenProps> = ({ onStorySelect }) => {
  const { colors: C } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { width } = useWindowDimensions();
  const numColumns = viewMode === 'grid' ? (width >= 900 ? 3 : width >= 600 ? 2 : 1) : 1;

  useEffect(() => {
    if (searchQuery.trim()) return;
    loadStories();
  }, [activeFilter]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const theme = activeFilter === 'all' ? undefined : activeFilter;
      const data = await getStories({ theme });
      setStories(data);
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        try {
          setLoading(true);
          const results = await searchStories(query);
          setStories(results);
        } catch {
          setStories([]);
        } finally {
          setLoading(false);
        }
      } else {
        loadStories();
      }
    },
    [activeFilter]
  );

  const handleFilterChange = (f: FilterId) => {
    setActiveFilter(f);
    setSearchQuery('');
  };

  const totalStories = stories.length;
  const featuredStory = stories[0];

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Hero */}
        <View style={[styles.statsHero, { backgroundColor: C.surfaceContainer }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: C.orange, fontFamily: fonts.epilogue.bold }]}>
                {totalStories}
              </Text>
              <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
                Stories
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.outlineVariant }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: C.orange, fontFamily: fonts.epilogue.bold }]}>
                {FILTER_TABS.length - 1}
              </Text>
              <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
                Categories
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.outlineVariant }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: C.orange, fontFamily: fonts.epilogue.bold }]}>
                AI
              </Text>
              <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
                Powered
              </Text>
            </View>
          </View>
        </View>

        {/* Search Box */}
        <View style={[styles.searchContainer, { backgroundColor: C.surfaceContainer }]}>
          <Ionicons name="search" size={20} color={C.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: C.text, fontFamily: fonts.manrope.regular }]}
            placeholder="Search stories, themes, storytellers..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Quick Links */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
            Browse by Category
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_ICONS.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: C.surfaceContainer }]}
                onPress={() => handleFilterChange(cat.id as FilterId)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}20` }]}>
                  <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                </View>
                <Text style={[styles.categoryLabel, { color: C.text, fontFamily: fonts.manrope.medium }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterPill,
                activeFilter === f.id
                  ? { backgroundColor: C.orange }
                  : { backgroundColor: C.surfaceContainer },
              ]}
              onPress={() => handleFilterChange(f.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={f.icon as any}
                size={14}
                color={activeFilter === f.id ? '#FFF' : C.textMuted}
              />
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color: activeFilter === f.id ? '#FFF' : C.textSub,
                    fontFamily: activeFilter === f.id ? fonts.manrope.semibold : fonts.manrope.medium,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View Mode Toggle & Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
            {totalStories} {totalStories === 1 ? 'story' : 'stories'} found
          </Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'grid' && { backgroundColor: C.surfaceContainerHigh }]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={18} color={viewMode === 'grid' ? C.orange : C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'list' && { backgroundColor: C.surfaceContainerHigh }]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={18} color={viewMode === 'list' ? C.orange : C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Story */}
        {featuredStory && !searchQuery && activeFilter === 'all' && (
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
              Featured Artifact
            </Text>
            <StoryCard story={featuredStory} onPress={() => onStorySelect(featuredStory.id)} variant="featured" />
          </View>
        )}

        {/* Stories Grid/List */}
        <View style={styles.storiesSection}>
          <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
            {searchQuery ? 'Search Results' : 'Recent Treasures'}
          </Text>

          {loading ? (
            <View style={[styles.loadingContainer, { backgroundColor: C.surfaceContainer }]}>
              <ActivityIndicator color={C.orange} size="large" />
            </View>
          ) : stories.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: C.surfaceContainer }]}>
              <View style={[styles.emptyIcon, { backgroundColor: C.surfaceContainerHigh }]}>
                <Ionicons name="archive-outline" size={48} color={C.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
                No Stories Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                {activeFilter !== 'all'
                  ? `No stories with theme "${activeFilter}" yet.`
                  : searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'Be the first to add a story!'}
              </Text>
              {(activeFilter !== 'all' || searchQuery.trim()) && (
                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: C.surfaceContainerHigh }]}
                  onPress={() => {
                    handleFilterChange('all');
                    setSearchQuery('');
                  }}
                >
                  <Text style={[styles.clearButtonText, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={[styles.storiesGrid, viewMode === 'list' && styles.storiesList]}>
              {stories.slice(searchQuery || activeFilter !== 'all' ? 0 : 1).map((story) => (
                <View
                  key={story.id}
                  style={[
                    styles.storyCardWrapper,
                    viewMode === 'grid' && numColumns > 1 && { width: `${100 / numColumns}%` },
                  ]}
                >
                  <StoryCard
                    story={story}
                    onPress={() => onStorySelect(story.id)}
                    variant={viewMode === 'list' ? 'compact' : 'default'}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing for nav bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  // Stats Hero
  statsHero: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  // Categories
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    fontSize: 12,
  },
  // Filter Pills
  filterScroll: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  filterPillText: {
    fontSize: 13,
  },
  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultsCount: {
    fontSize: 14,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  viewToggleBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  // Featured Section
  featuredSection: {
    marginBottom: spacing.xl,
  },
  // Stories Section
  storiesSection: {
    marginBottom: spacing.lg,
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  storiesList: {
    flexDirection: 'column',
  },
  storyCardWrapper: {
    padding: spacing.xs,
  },
  // Loading & Empty States
  loadingContainer: {
    height: 200,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  clearButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  clearButtonText: {
    fontSize: 14,
  },
});
