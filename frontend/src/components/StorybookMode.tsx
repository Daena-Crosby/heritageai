import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Story } from '../services/api';

interface StorybookModeProps {
  story: Story;
}

export const StorybookMode: React.FC<StorybookModeProps> = ({ story }) => {
  const { colors: C } = useTheme();
  const { width } = useWindowDimensions();
  const [showTranslation, setShowTranslation] = useState(true);
  const [imgError, setImgError] = useState(false);

  const translation = story.translations?.[0];
  const illustrations = story.illustrations || [];
  const heroImage = !imgError ? illustrations[0]?.image_url : undefined;

  const originalText = translation?.original_text?.trim();
  const englishText = translation?.translated_text?.trim();

  const hasOriginal = !!originalText;
  const hasEnglish = !!englishText;
  const hasBoth = hasOriginal && hasEnglish;

  // Text shown in the full-story section
  const displayText = showTranslation && hasEnglish ? englishText : (originalText ?? englishText ?? '');

  // Synopsis — first 220 chars of the English text (fall back to original)
  const synopsisSource = englishText ?? originalText ?? '';
  const synopsis = synopsisSource.length > 220
    ? synopsisSource.slice(0, 220).trimEnd() + '…'
    : synopsisSource;

  const meta = [
    story.theme && { icon: 'pricetag-outline' as const, label: story.theme.toUpperCase() },
    story.country && { icon: 'earth-outline' as const, label: story.country },
    story.language && { icon: 'language-outline' as const, label: story.language },
  ].filter(Boolean) as { icon: keyof typeof Ionicons.glyphMap; label: string }[];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero illustration ── */}
      {heroImage ? (
        <Image
          source={{ uri: heroImage }}
          style={[styles.hero, { width: width - 32 }]}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View
          style={[
            styles.heroPlaceholder,
            { width: width - 32, backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <Ionicons name="image-outline" size={38} color={C.textMuted} />
          <Text style={[styles.heroPlaceholderTitle, { color: C.textMuted }]}>
            {illustrations.length === 0 ? 'Illustration generating…' : 'Image unavailable'}
          </Text>
          {illustrations.length === 0 && (
            <Text style={[styles.heroPlaceholderHint, { color: C.textMuted }]}>
              AI illustration will appear once processing completes
            </Text>
          )}
        </View>
      )}

      {/* ── Metadata chips ── */}
      {meta.length > 0 && (
        <View style={styles.metaRow}>
          {meta.map(({ icon, label }) => (
            <View key={label} style={[styles.chip, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Ionicons name={icon} size={12} color={C.orange} />
              <Text style={[styles.chipText, { color: C.textSub }]}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Synopsis ── */}
      {synopsis.length > 0 && (
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.cardLabel, { color: C.orange }]}>SYNOPSIS</Text>
          <Text style={[styles.synopsisText, { color: C.textSub }]}>{synopsis}</Text>
        </View>
      )}

      {/* ── Full story text with translate toggle ── */}
      {(hasOriginal || hasEnglish) ? (
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.storyHeader}>
            <Text style={[styles.cardLabel, { color: C.orange }]}>FULL STORY</Text>

            {/* Toggle — only shown when both original and English exist */}
            {hasBoth && (
              <View style={[styles.toggle, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                <TouchableOpacity
                  style={[styles.toggleOption, !showTranslation && { backgroundColor: C.orange }]}
                  onPress={() => setShowTranslation(false)}
                >
                  <Text style={[styles.toggleText, { color: !showTranslation ? '#FFF' : C.textSub }]}>
                    Original
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, showTranslation && { backgroundColor: C.orange }]}
                  onPress={() => setShowTranslation(true)}
                >
                  <Text style={[styles.toggleText, { color: showTranslation ? '#FFF' : C.textSub }]}>
                    English
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Label when only English exists (no original stored) */}
            {!hasBoth && hasEnglish && (
              <View style={[styles.langBadge, { backgroundColor: C.activeNav }]}>
                <Ionicons name="language-outline" size={11} color={C.orange} />
                <Text style={[styles.langBadgeText, { color: C.orange }]}>English</Text>
              </View>
            )}
          </View>

          <Text style={[styles.storyText, { color: C.text }]}>{displayText}</Text>
        </View>
      ) : (
        /* Nothing processed yet */
        <View style={[styles.card, styles.processingCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <ActivityIndicator color={C.orange} />
          <Text style={[styles.processingTitle, { color: C.textSub }]}>Processing story…</Text>
          <Text style={[styles.processingHint, { color: C.textMuted }]}>
            Transcription and translation are still running. Check back in a moment.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  hero: {
    height: 220,
    borderRadius: 14,
    alignSelf: 'center',
  },
  heroPlaceholder: {
    height: 220,
    borderRadius: 14,
    alignSelf: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  heroPlaceholderTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  heroPlaceholderHint: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  synopsisText: { fontSize: 14, lineHeight: 22 },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleOption: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  toggleText: { fontSize: 12, fontWeight: '600' },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  storyText: { fontSize: 15, lineHeight: 26 },
  processingCard: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  processingTitle: { fontSize: 15, fontWeight: '600' },
  processingHint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
