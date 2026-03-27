import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { getStories, Story } from '../services/api';
import { AppScreen } from '../components/BottomNavBar';

interface HomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onStorySelect: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onStorySelect }) => {
  const { colors: C } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

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

  const featuredStory = stories[0];
  const recentStories = stories.slice(1, 5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[C.surfaceContainer, C.bg]}
          style={styles.heroGradient}
        >
          <Text style={[styles.heroLabel, { color: C.orange, fontFamily: fonts.manrope.bold }]}>
            PRESERVE YOUR LEGACY
          </Text>
          <Text style={[styles.heroTitle, { color: C.text, fontFamily: fonts.epilogue.bold }]}>
            Every Story{'\n'}Deserves to{'\n'}be Told
          </Text>
          <Text style={[styles.heroSubtitle, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
            Capture, preserve, and share the voices of your ancestors
            with AI-powered storytelling.
          </Text>

          {/* CTA Buttons */}
          <View style={styles.heroButtons}>
            <TouchableOpacity
              onPress={() => onNavigate('record')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Ionicons name="mic" size={18} color="#FFF" />
                <Text style={[styles.primaryButtonText, { fontFamily: fonts.manrope.bold }]}>
                  Start Recording
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: C.surfaceContainerHigh }]}
              onPress={() => onNavigate('vault')}
              activeOpacity={0.7}
            >
              <Ionicons name="library-outline" size={18} color={C.text} />
              <Text style={[styles.secondaryButtonText, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                Explore Vault
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Featured Story Section */}
      {featuredStory && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
              Featured Story
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.featuredCard, { backgroundColor: C.surfaceContainer }]}
            onPress={() => onStorySelect(featuredStory.id)}
            activeOpacity={0.8}
          >
            {/* Featured Image Placeholder */}
            <View style={[styles.featuredImage, { backgroundColor: C.surfaceContainerHigh }]}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.featuredImageOverlay}
              />
              <Ionicons name="musical-notes" size={48} color={C.textMuted} style={styles.featuredImageIcon} />
              {/* Tags */}
              <View style={styles.featuredTags}>
                <View style={[styles.tag, { backgroundColor: C.orange }]}>
                  <Text style={[styles.tagText, { fontFamily: fonts.manrope.semibold }]}>
                    {featuredStory.theme || 'Heritage'}
                  </Text>
                </View>
                <View style={[styles.tag, { backgroundColor: C.surfaceContainerHighest }]}>
                  <Ionicons name="eye-outline" size={12} color={C.textSub} />
                  <Text style={[styles.tagText, { color: C.textSub, fontFamily: fonts.manrope.medium }]}>
                    {featuredStory.view_count || 0}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.featuredContent}>
              <Text style={[styles.featuredTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]} numberOfLines={2}>
                {featuredStory.title}
              </Text>
              <Text style={[styles.featuredMeta, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                by {featuredStory.storytellers?.name || 'Unknown Storyteller'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Stories Bento Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
            Recent Stories
          </Text>
          <TouchableOpacity onPress={() => onNavigate('vault')}>
            <Text style={[styles.seeAllLink, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={[styles.loadingContainer, { backgroundColor: C.surfaceContainer }]}>
            <ActivityIndicator color={C.orange} size="large" />
          </View>
        ) : recentStories.length === 0 && !featuredStory ? (
          <View style={[styles.emptyState, { backgroundColor: C.surfaceContainer }]}>
            <View style={[styles.emptyIcon, { backgroundColor: C.surfaceContainerHigh }]}>
              <Ionicons name="library-outline" size={32} color={C.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
              No Stories Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
              Be the first to preserve your heritage
            </Text>
            <TouchableOpacity
              onPress={() => onNavigate('record')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButton}
              >
                <Text style={[styles.emptyButtonText, { fontFamily: fonts.manrope.bold }]}>
                  Record First Story
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.bentoGrid, !isWide && styles.bentoGridMobile]}>
            {recentStories.map((story, index) => (
              <TouchableOpacity
                key={story.id}
                style={[
                  styles.bentoCard,
                  { backgroundColor: C.surfaceContainer },
                  index === 0 && isWide && styles.bentoCardLarge,
                ]}
                onPress={() => onStorySelect(story.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.bentoImagePlaceholder, { backgroundColor: C.surfaceContainerHigh }]}>
                  <Ionicons
                    name={story.audio_url ? 'mic' : 'document-text'}
                    size={24}
                    color={C.textMuted}
                  />
                </View>
                <View style={styles.bentoContent}>
                  <View style={[styles.bentoTag, { backgroundColor: C.orangeGlow }]}>
                    <Text style={[styles.bentoTagText, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
                      {story.theme || 'Heritage'}
                    </Text>
                  </View>
                  <Text
                    style={[styles.bentoTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}
                    numberOfLines={2}
                  >
                    {story.title}
                  </Text>
                  <Text style={[styles.bentoMeta, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                    {story.storytellers?.name || 'Unknown'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'language' as const, label: 'Translate', screen: 'dialects' as AppScreen },
            { icon: 'compass' as const, label: 'Guide', screen: 'guide' as AppScreen },
            { icon: 'library' as const, label: 'Vault', screen: 'vault' as AppScreen },
          ].map((action) => (
            <TouchableOpacity
              key={action.screen}
              style={[styles.quickActionCard, { backgroundColor: C.surfaceContainer }]}
              onPress={() => onNavigate(action.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: C.orangeGlow }]}>
                <Ionicons name={action.icon} size={22} color={C.orange} />
              </View>
              <Text style={[styles.quickActionLabel, { color: C.text, fontFamily: fonts.manrope.medium }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Banner */}
      <View style={[styles.statsBanner, { backgroundColor: C.surfaceContainer }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: C.orange, fontFamily: fonts.epilogue.bold }]}>
            {stories.length}
          </Text>
          <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
            Stories
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
        <View style={[styles.statDivider, { backgroundColor: C.outlineVariant }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: C.orange, fontFamily: fonts.epilogue.bold }]}>
            JA
          </Text>
          <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
            Culture
          </Text>
        </View>
      </View>

      {/* Bottom spacing for nav bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  // Hero Section
  heroSection: {
    marginBottom: spacing.xl,
  },
  heroGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 42,
    lineHeight: 48,
    marginBottom: spacing.lg,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  secondaryButtonText: {
    fontSize: 15,
  },
  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
  },
  seeAllLink: {
    fontSize: 14,
  },
  // Featured Card
  featuredCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  featuredImage: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredImageIcon: {
    opacity: 0.5,
  },
  featuredTags: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 12,
    color: '#FFF',
  },
  featuredContent: {
    padding: spacing.lg,
  },
  featuredTitle: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  featuredMeta: {
    fontSize: 14,
  },
  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bentoGridMobile: {
    flexDirection: 'column',
  },
  bentoCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  bentoCardLarge: {
    flex: 2,
  },
  bentoImagePlaceholder: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoContent: {
    padding: spacing.md,
  },
  bentoTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  bentoTagText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bentoTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  bentoMeta: {
    fontSize: 12,
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
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
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
    marginBottom: spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: 13,
  },
  // Stats Banner
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
});
