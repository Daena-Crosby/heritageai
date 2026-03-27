import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { getStory, Story } from '../services/api';
import { StorybookMode } from '../components/StorybookMode';
import { VideoMode } from '../components/VideoMode';

interface StoryViewScreenProps {
  storyId: string;
  onBack: () => void;
}

export const StoryViewScreen: React.FC<StoryViewScreenProps> = ({ storyId, onBack }) => {
  const { colors: C } = useTheme();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'storybook' | 'video'>('storybook');
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    try {
      setLoading(true);
      const data = await getStory(storyId);
      setStory(data);
    } catch (error) {
      console.error('Error loading story:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.orange} />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <View style={[styles.errorIcon, { backgroundColor: C.surfaceContainer }]}>
          <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
        </View>
        <Text style={[styles.errorTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
          Story Not Found
        </Text>
        <Text style={[styles.errorText, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
          This story may have been removed or is unavailable
        </Text>
        <TouchableOpacity
          style={[styles.errorBackBtn, { backgroundColor: C.surfaceContainer }]}
          onPress={onBack}
        >
          <Text style={[styles.errorBackText, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const firstIllustration = story.illustrations?.[0]?.image_url;
  const storytellerName = story.storytellers?.name || 'Unknown Storyteller';
  const theme = story.theme || 'Heritage';
  const hasTranslation = !!story.translated_text;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          {firstIllustration ? (
            <Image source={{ uri: firstIllustration }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImagePlaceholder, { backgroundColor: C.surfaceContainerHigh }]}>
              <Ionicons name="musical-notes" size={64} color={C.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroOverlay}
          />

          {/* Tags on hero */}
          <View style={styles.heroTags}>
            <View style={[styles.tag, { backgroundColor: C.orange }]}>
              <Text style={[styles.tagText, { fontFamily: fonts.manrope.semibold }]}>
                {theme}
              </Text>
            </View>
            {story.language && (
              <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="language" size={12} color="#FFF" />
                <Text style={[styles.tagText, { fontFamily: fonts.manrope.medium }]}>
                  {story.language}
                </Text>
              </View>
            )}
          </View>

          {/* Title on hero */}
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { fontFamily: fonts.epilogue.bold }]}>
              {story.title}
            </Text>
            <Text style={[styles.heroMeta, { fontFamily: fonts.manrope.regular }]}>
              by {storytellerName}
            </Text>
          </View>
        </View>

        {/* Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: C.surfaceContainer }]}>
          {(['storybook', 'video'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.modeTab,
                mode === m && { backgroundColor: C.orange },
              ]}
              onPress={() => setMode(m)}
            >
              <Ionicons
                name={m === 'storybook' ? 'book' : 'film'}
                size={18}
                color={mode === m ? '#FFF' : C.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === m ? '#FFF' : C.textMuted,
                    fontFamily: mode === m ? fonts.manrope.semibold : fonts.manrope.regular,
                  },
                ]}
              >
                {m === 'storybook' ? 'Storybook' : 'Video'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Translation Toggle */}
        {hasTranslation && (
          <View style={[styles.translationCard, { backgroundColor: C.surfaceContainer }]}>
            <View style={styles.translationContent}>
              <Ionicons name="language" size={20} color={C.orange} />
              <View style={styles.translationText}>
                <Text style={[styles.translationTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                  Translation Available
                </Text>
                <Text style={[styles.translationSubtitle, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                  View in English
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.translationToggle,
                { backgroundColor: showTranslation ? C.orange : C.surfaceContainerHigh },
              ]}
              onPress={() => setShowTranslation(!showTranslation)}
            >
              <View
                style={[
                  styles.translationToggleThumb,
                  {
                    backgroundColor: '#FFF',
                    transform: [{ translateX: showTranslation ? 20 : 0 }],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Story Content */}
        <View style={styles.contentSection}>
          {mode === 'storybook' ? (
            <StorybookMode story={story} showTranslation={showTranslation} />
          ) : (
            <VideoMode story={story} />
          )}
        </View>

        {/* Story Text Section */}
        {story.original_text && (
          <View style={[styles.storyTextCard, { backgroundColor: C.surfaceContainer }]}>
            <View style={styles.storyTextHeader}>
              <Text style={[styles.storyTextLabel, { color: C.orange, fontFamily: fonts.manrope.bold }]}>
                {showTranslation && story.translated_text ? 'ENGLISH' : 'PATOIS'}
              </Text>
            </View>
            <Text style={[styles.storyText, { color: C.text, fontFamily: fonts.manrope.regular }]}>
              {showTranslation && story.translated_text ? story.translated_text : story.original_text}
            </Text>
          </View>
        )}

        {/* Cultural Lexicon */}
        {story.cultural_context && (
          <View style={styles.lexiconSection}>
            <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
              Cultural Lexicon
            </Text>
            <View style={styles.lexiconCards}>
              <View style={[styles.lexiconCard, { backgroundColor: C.surfaceContainer }]}>
                <View style={[styles.lexiconAccent, { backgroundColor: C.orange }]} />
                <View style={styles.lexiconContent}>
                  <Text style={[styles.lexiconTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                    Cultural Context
                  </Text>
                  <Text style={[styles.lexiconText, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
                    {story.cultural_context}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Story Info */}
        <View style={[styles.infoCard, { backgroundColor: C.surfaceContainer }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={16} color={C.textMuted} />
              <Text style={[styles.infoLabel, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                Storyteller
              </Text>
              <Text style={[styles.infoValue, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                {storytellerName}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={C.textMuted} />
              <Text style={[styles.infoLabel, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                Origin
              </Text>
              <Text style={[styles.infoValue, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                {story.storytellers?.location || 'Jamaica'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="eye-outline" size={16} color={C.textMuted} />
              <Text style={[styles.infoLabel, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                Views
              </Text>
              <Text style={[styles.infoValue, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                {story.view_count || 0}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={C.textMuted} />
              <Text style={[styles.infoLabel, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                Added
              </Text>
              <Text style={[styles.infoValue, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                {story.created_at
                  ? new Date(story.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
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
  scrollContent: {},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorBackBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  errorBackText: {
    fontSize: 14,
  },
  // Hero Section
  heroSection: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTags: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
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
  heroContent: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    color: '#FFF',
    marginBottom: spacing.xs,
  },
  heroMeta: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  // Mode Selector
  modeSelector: {
    flexDirection: 'row',
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  modeTabText: {
    fontSize: 14,
  },
  // Translation Card
  translationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  translationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  translationText: {},
  translationTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  translationSubtitle: {
    fontSize: 12,
  },
  translationToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 4,
  },
  translationToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  // Content Section
  contentSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  // Story Text Card
  storyTextCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  storyTextHeader: {
    marginBottom: spacing.md,
  },
  storyTextLabel: {
    fontSize: 11,
    letterSpacing: 1,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 26,
  },
  // Lexicon Section
  lexiconSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: spacing.md,
  },
  lexiconCards: {
    gap: spacing.md,
  },
  lexiconCard: {
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  lexiconAccent: {
    width: 4,
  },
  lexiconContent: {
    flex: 1,
    padding: spacing.lg,
  },
  lexiconTitle: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  lexiconText: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Info Card
  infoCard: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  infoItem: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
  },
});
