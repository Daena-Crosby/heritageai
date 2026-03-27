import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius } from '../theme/colors';
import { Story } from '../services/api';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress, variant = 'default' }) => {
  const { colors: C } = useTheme();
  const firstIllustration = story.illustrations?.[0]?.image_url;
  const storytellerName = story.storytellers?.name || 'Unknown';
  const theme = story.theme || story.story_tags?.[0]?.tags?.name || 'Heritage';
  const viewCount = story.view_count || 0;

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: C.surfaceContainer }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {firstIllustration ? (
          <Image source={{ uri: firstIllustration }} style={styles.compactImage} />
        ) : (
          <View style={[styles.compactImagePlaceholder, { backgroundColor: C.surfaceContainerHigh }]}>
            <Ionicons name="musical-notes" size={20} color={C.textMuted} />
          </View>
        )}
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]} numberOfLines={1}>
            {story.title}
          </Text>
          <Text style={[styles.compactMeta, { color: C.textMuted, fontFamily: fonts.manrope.regular }]} numberOfLines={1}>
            {storytellerName}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity
        style={[styles.featuredCard, { backgroundColor: C.surfaceContainer }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.featuredImageContainer}>
          {firstIllustration ? (
            <Image source={{ uri: firstIllustration }} style={styles.featuredImage} />
          ) : (
            <View style={[styles.featuredImagePlaceholder, { backgroundColor: C.surfaceContainerHigh }]}>
              <Ionicons name="musical-notes" size={48} color={C.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.featuredOverlay}
          />
          <View style={styles.featuredBadges}>
            <View style={[styles.badge, { backgroundColor: C.orange }]}>
              <Text style={[styles.badgeText, { fontFamily: fonts.manrope.semibold }]}>
                {theme}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="eye-outline" size={12} color="#FFF" />
              <Text style={[styles.badgeText, { fontFamily: fonts.manrope.medium }]}>
                {viewCount}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.featuredContent}>
          <Text style={[styles.featuredTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]} numberOfLines={2}>
            {story.title}
          </Text>
          <Text style={[styles.featuredMeta, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
            by {storytellerName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surfaceContainer }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {firstIllustration ? (
          <Image source={{ uri: firstIllustration }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: C.surfaceContainerHigh }]}>
            <Ionicons name="musical-notes" size={32} color={C.textMuted} />
          </View>
        )}
        <View style={styles.imageOverlayBadges}>
          <View style={[styles.badge, { backgroundColor: C.orangeGlow }]}>
            <Text style={[styles.badgeTextDark, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
              {theme}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: C.text, fontFamily: fonts.manrope.semibold }]} numberOfLines={2}>
          {story.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.storyteller, { color: C.textSub, fontFamily: fonts.manrope.regular }]} numberOfLines={1}>
            {storytellerName}
          </Text>
          <View style={styles.stats}>
            <Ionicons name="eye-outline" size={12} color={C.textMuted} />
            <Text style={[styles.statText, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
              {viewCount}
            </Text>
          </View>
        </View>
        {story.age_group && (
          <Text style={[styles.ageGroup, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
            {story.age_group}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default variant
  card: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayBadges: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyteller: {
    fontSize: 13,
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  ageGroup: {
    fontSize: 12,
    textTransform: 'capitalize',
  },

  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFF',
    textTransform: 'capitalize',
  },
  badgeTextDark: {
    fontSize: 11,
    textTransform: 'capitalize',
  },

  // Compact variant
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  compactImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  compactImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  compactMeta: {
    fontSize: 12,
  },

  // Featured variant
  featuredCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  featuredImageContainer: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 220,
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredBadges: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featuredContent: {
    padding: spacing.lg,
  },
  featuredTitle: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: spacing.xs,
  },
  featuredMeta: {
    fontSize: 14,
  },
});
