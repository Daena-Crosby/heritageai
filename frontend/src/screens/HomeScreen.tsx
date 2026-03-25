import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getStories, Story } from '../services/api';
import { AppScreen } from '../components/Sidebar';

interface HomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onStorySelect: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onStorySelect }) => {
  const { colors: C } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await getStories({});
      setStories(data);
    } catch {
      // silent fail — empty state handles it
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Hero banner */}
      <View style={[styles.hero, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.heroLabel, { color: C.orange }]}>GLOBAL COMMUNITY FEED</Text>
        <Text style={[styles.heroTitle, { color: C.text }]}>
          The Shared Ancestral{'\n'}Vault
        </Text>
        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={[styles.heroBtnPrimary, { backgroundColor: C.orange }]}
            onPress={() => onNavigate('vault')}
          >
            <Text style={styles.heroBtnPrimaryText}>Explore Shared Vault</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroBtnSecondary, { borderColor: C.borderLight }]}
            onPress={() => onNavigate('record')}
          >
            <Text style={[styles.heroBtnSecondaryText, { color: C.text }]}>Archive Your Voice</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Two-column layout */}
      <View style={[styles.columns, !isWide && styles.columnsStack]}>
        {/* Left — Recent contributions */}
        <View style={[styles.colMain, !isWide && styles.colFull]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: C.text }]}>
                Recent Global Contributions
              </Text>
              <Text style={[styles.sectionSub, { color: C.textMuted }]}>
                REAL-TIME PRESERVATION FROM ACROSS THE WORLD
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate('vault')}>
              <Text style={[styles.viewAllLink, { color: C.orange }]}>View All Archives →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={[styles.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <ActivityIndicator color={C.orange} />
            </View>
          ) : stories.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: C.surfaceAlt }]}>
                <Ionicons name="mic" size={32} color={C.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: C.textSub }]}>
                The Global Vault is Quiet
              </Text>
              <TouchableOpacity onPress={() => onNavigate('record')}>
                <Text style={[styles.emptyLink, { color: C.orange }]}>
                  Record First Shared Memory
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.storyList, { backgroundColor: C.surface, borderColor: C.border }]}>
              {stories.slice(0, 6).map((story, i) => (
                <TouchableOpacity
                  key={story.id}
                  style={[
                    styles.storyRow,
                    { borderBottomColor: C.border },
                    i === Math.min(stories.length, 6) - 1 && styles.storyRowLast,
                  ]}
                  onPress={() => onStorySelect(story.id)}
                >
                  <View style={[styles.storyRowIcon, { backgroundColor: C.orangeGlow }]}>
                    <Ionicons name="mic" size={14} color={C.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storyRowTitle, { color: C.text }]} numberOfLines={1}>
                      {story.title}
                    </Text>
                    <Text style={[styles.storyRowMeta, { color: C.textSub }]}>
                      {story.storytellers?.name || 'Unknown'} · {story.theme || 'Heritage'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Right — Vault analytics */}
        <View style={[styles.colSide, !isWide && styles.colFull]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Vault Analytics</Text>

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsCardHeader}>
              <View style={styles.analyticsIcon}>
                <Ionicons name="people" size={20} color={C.orange} />
              </View>
              <Ionicons name="globe-outline" size={40} color="rgba(245,166,35,0.15)" />
            </View>
            <Text style={styles.analyticsCardTitle}>Shared Identity</Text>
            <Text style={styles.analyticsCardBody}>
              By sharing our stories, we create a global tapestry of human history. This app enables
              every user to witness the cinematic legacy of others, fostering universal understanding.
            </Text>
            <View style={styles.analyticsQuote}>
              <Text style={styles.analyticsQuoteText}>
                "Our voices are stronger when they are shared."
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: C.orange }]}
              onPress={() => onNavigate('vault')}
            >
              <Text style={styles.joinBtnText}>Join the Circle →</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { num: String(stories.length), label: 'Stories' },
              { num: '1', label: 'Culture' },
              { num: 'AI', label: 'Powered' },
            ].map((s) => (
              <View
                key={s.label}
                style={[styles.statBox, { backgroundColor: C.surface, borderColor: C.border }]}
              >
                <Text style={[styles.statNum, { color: C.orange }]}>{s.num}</Text>
                <Text style={[styles.statLabel, { color: C.textSub }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  hero: {
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  heroTitle: { fontSize: 32, fontWeight: 'bold', lineHeight: 40, marginBottom: 20 },
  heroButtons: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  heroBtnPrimary: { borderRadius: 24, paddingHorizontal: 22, paddingVertical: 12 },
  heroBtnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  heroBtnSecondary: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 1,
  },
  heroBtnSecondaryText: { fontWeight: '600', fontSize: 14 },
  columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  columnsStack: { flexDirection: 'column' },
  colMain: { flex: 1.6, gap: 12 },
  colSide: { flex: 1, gap: 12 },
  colFull: { flex: undefined, width: '100%' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  sectionSub: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
  viewAllLink: { fontSize: 13, fontWeight: '600' },
  emptyCard: {
    borderRadius: 12,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptyLink: { fontSize: 13, textDecorationLine: 'underline' },
  storyList: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderBottomWidth: 1,
  },
  storyRowLast: { borderBottomWidth: 0 },
  storyRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRowTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  storyRowMeta: { fontSize: 11 },
  analyticsCard: {
    backgroundColor: '#3D1A07',
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  analyticsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  analyticsIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: 'rgba(245,166,35,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsCardTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  analyticsCardBody: { color: '#D4A88A', fontSize: 13, lineHeight: 20 },
  analyticsQuote: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 11,
  },
  analyticsQuoteText: { color: '#E8C49A', fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  joinBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  joinBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNum: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
});
