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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getStories, searchStories, Story } from '../services/api';
import { StoryCard } from '../components/StoryCard';

// All known theme values — lowercase to match DB storage
const FILTER_TABS = [
  { id: 'all', label: 'ALL' },
  { id: 'folklore', label: 'FOLKLORE' },
  { id: 'moral', label: 'MORAL' },
  { id: 'personal', label: 'PERSONAL' },
  { id: 'history', label: 'HISTORY' },
  { id: 'ancestral', label: 'ANCESTRAL' },
  { id: 'tradition', label: 'TRADITION' },
  { id: 'legend', label: 'LEGEND' },
  { id: 'fable', label: 'FABLE' },
  { id: 'anansi', label: 'ANANSI' },
] as const;

type FilterId = (typeof FILTER_TABS)[number]['id'];

interface HeritageVaultScreenProps {
  onStorySelect: (id: string) => void;
}

export const HeritageVaultScreen: React.FC<HeritageVaultScreenProps> = ({ onStorySelect }) => {
  const { colors: C } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1;

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

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Page header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: C.text }]}>Heritage Vault</Text>
            <Text style={[styles.subtitle, { color: C.textSub }]}>
              A permanent collection of global voices.
            </Text>
          </View>
          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Ionicons name="search" size={16} color={C.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: C.text }]}
              placeholder="Search traditions..."
              placeholderTextColor={C.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={16} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter tabs — scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterBtn,
                activeFilter === f.id && { backgroundColor: C.orange },
              ]}
              onPress={() => handleFilterChange(f.id)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  { color: activeFilter === f.id ? '#FFF' : C.textSub },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.orange} size="large" />
        </View>
      ) : stories.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: C.surface }]}>
            <Ionicons name="archive-outline" size={48} color={C.textMuted} />
          </View>
          <Text style={[styles.emptyText, { color: C.textMuted }]}>VAULT EMPTY</Text>
          <Text style={[styles.emptyHint, { color: C.textSub }]}>
            {activeFilter !== 'all'
              ? `No stories with theme "${activeFilter}" yet.`
              : 'No stories archived yet.'}
          </Text>
          {(activeFilter !== 'all' || searchQuery.trim()) && (
            <TouchableOpacity onPress={() => handleFilterChange('all')}>
              <Text style={[styles.clearLink, { color: C.orange }]}>Show all stories</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={stories}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <View style={[styles.cardWrapper, { width: `${100 / numColumns}%` as any }]}>
              <StoryCard story={item} onPress={() => onStorySelect(item.id)} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 14,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 13 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    minWidth: 200,
    flex: 1,
    maxWidth: 320,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterScroll: {
    paddingBottom: 14,
    gap: 8,
    paddingRight: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  filterBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyText: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  clearLink: { fontSize: 13, textDecorationLine: 'underline', marginTop: 4 },
  listContent: { padding: 16, paddingTop: 20 },
  cardWrapper: { padding: 8 },
});
