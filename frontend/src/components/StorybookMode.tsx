import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius } from '../theme/colors';
import { Story } from '../services/api';

interface StorybookModeProps {
  story: Story;
  showTranslation?: boolean;
}

export const StorybookMode: React.FC<StorybookModeProps> = ({ story, showTranslation: externalShowTranslation }) => {
  const { colors: C } = useTheme();
  const { width } = useWindowDimensions();
  const [internalShowTranslation, setInternalShowTranslation] = useState(true);
  const [imgError, setImgError] = useState(false);

  const showTranslation = externalShowTranslation ?? internalShowTranslation;

  const translation = story.translations?.[0];
  const illustrations = story.illustrations || [];

  const originalText = translation?.original_text?.trim() || story.original_text?.trim();
  const englishText = translation?.translated_text?.trim() || story.translated_text?.trim();

  const hasOriginal = !!originalText;
  const hasEnglish = !!englishText;
  const hasBoth = hasOriginal && hasEnglish;

  const displayText = showTranslation && hasEnglish ? englishText : (originalText ?? englishText ?? '');

  // Use AI-generated synopsis if available, otherwise fallback to truncation
  const synopsis = translation?.synopsis?.trim() || (() => {
    const synopsisSource = englishText ?? originalText ?? '';
    return synopsisSource.length > 220
      ? synopsisSource.slice(0, 220).trimEnd() + '…'
      : synopsisSource;
  })();

  return (
    <View style={styles.container}>
      {/* Synopsis Card */}
      {synopsis.length > 0 && (
        <View style={[styles.card, { backgroundColor: C.surfaceContainer }]}>
          <Text style={[styles.cardLabel, { color: C.orange, fontFamily: fonts.manrope.bold }]}>
            SYNOPSIS
          </Text>
          <Text style={[styles.synopsisText, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
            {synopsis}
          </Text>
        </View>
      )}

      {/* Illustrations Gallery */}
      {illustrations.length > 0 && (
        <View style={styles.illustrationsSection}>
          <Text style={[styles.sectionLabel, { color: C.textMuted, fontFamily: fonts.manrope.bold }]}>
            AI ILLUSTRATIONS
          </Text>
          <View style={styles.illustrationsGrid}>
            {illustrations.slice(0, 4).map((ill, index) => (
              <View
                key={ill.id || index}
                style={[styles.illustrationCard, { backgroundColor: C.surfaceContainerHigh }]}
              >
                {ill.image_url && !imgError ? (
                  <Image
                    source={{ uri: ill.image_url }}
                    style={styles.illustrationImage}
                    resizeMode="cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <View style={styles.illustrationPlaceholder}>
                    <Ionicons name="image-outline" size={24} color={C.textMuted} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* No illustrations yet */}
      {illustrations.length === 0 && (
        <View style={[styles.illustrationsSection, styles.noIllustrations, { backgroundColor: C.surfaceContainer }]}>
          <Ionicons name="sparkles" size={32} color={C.textMuted} />
          <Text style={[styles.noIllustrationsTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
            Illustrations Generating
          </Text>
          <Text style={[styles.noIllustrationsText, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
            AI is creating unique artwork for this story
          </Text>
        </View>
      )}

      {/* Original Story */}
      {hasOriginal && (
        <View style={[styles.card, { backgroundColor: C.surfaceContainer }]}>
          <View style={styles.storyHeader}>
            <Text style={[styles.cardLabel, { color: C.orange, fontFamily: fonts.manrope.bold }]}>
              ORIGINAL STORY
            </Text>
            <View style={[styles.langBadge, { backgroundColor: C.orangeGlow }]}>
              <Ionicons name="mic" size={14} color={C.orange} />
              <Text style={[styles.langBadgeText, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
                {story.language || 'Patois'}
              </Text>
            </View>
          </View>

          <Text style={[styles.storyText, { color: C.text, fontFamily: fonts.manrope.regular }]}>
            {originalText}
          </Text>
        </View>
      )}

      {/* Translated (English) */}
      {hasEnglish && hasBoth && (
        <View style={[styles.card, { backgroundColor: C.surfaceContainer }]}>
          <View style={styles.storyHeader}>
            <Text style={[styles.cardLabel, { color: C.orange, fontFamily: fonts.manrope.bold }]}>
              TRANSLATED (ENGLISH)
            </Text>
            <View style={[styles.langBadge, { backgroundColor: C.orangeGlow }]}>
              <Ionicons name="language" size={14} color={C.orange} />
              <Text style={[styles.langBadgeText, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
                English
              </Text>
            </View>
          </View>

          <Text style={[styles.storyText, { color: C.text, fontFamily: fonts.manrope.regular }]}>
            {englishText}
          </Text>
        </View>
      )}

      {/* Full Story (if only one version exists) */}
      {!hasBoth && (hasOriginal || hasEnglish) && (
        <View style={[styles.card, { backgroundColor: C.surfaceContainer }]}>
          <View style={styles.storyHeader}>
            <Text style={[styles.cardLabel, { color: C.orange, fontFamily: fonts.manrope.bold }]}>
              FULL STORY
            </Text>
            {hasEnglish && (
              <View style={[styles.langBadge, { backgroundColor: C.orangeGlow }]}>
                <Ionicons name="language" size={14} color={C.orange} />
                <Text style={[styles.langBadgeText, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
                  English
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.storyText, { color: C.text, fontFamily: fonts.manrope.regular }]}>
            {displayText}
          </Text>
        </View>
      )}

      {/* Processing State */}
      {!hasOriginal && !hasEnglish && (
        <View style={[styles.card, styles.processingCard, { backgroundColor: C.surfaceContainer }]}>
          <ActivityIndicator color={C.orange} />
          <Text style={[styles.processingTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
            Processing Story
          </Text>
          <Text style={[styles.processingHint, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
            Transcription and translation are in progress. This may take a moment.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  synopsisText: {
    fontSize: 15,
    lineHeight: 24,
  },
  // Illustrations
  illustrationsSection: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginLeft: spacing.xs,
  },
  illustrationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  illustrationCard: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  illustrationPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noIllustrations: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  noIllustrationsTitle: {
    fontSize: 16,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  noIllustrationsText: {
    fontSize: 13,
    textAlign: 'center',
  },
  // Story Header
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  toggleOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  toggleText: {
    fontSize: 12,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  langBadgeText: {
    fontSize: 12,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 28,
  },
  // Processing state
  processingCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  processingTitle: {
    fontSize: 16,
    marginTop: spacing.sm,
  },
  processingHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
