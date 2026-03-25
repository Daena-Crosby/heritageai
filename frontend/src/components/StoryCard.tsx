import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Story } from '../services/api';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const { colors: C } = useTheme();
  const firstIllustration = story.illustrations?.[0]?.image_url;
  const storytellerName = story.storytellers?.name || 'Unknown';
  const theme = story.theme || story.story_tags?.[0]?.tags?.name || 'General';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {firstIllustration ? (
        <Image source={{ uri: firstIllustration }} style={[styles.thumbnail, { backgroundColor: C.surfaceAlt }]} />
      ) : (
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: C.surfaceAlt }]}>
          <Ionicons name="image-outline" size={28} color={C.textMuted} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={[styles.storyteller, { color: C.textSub }]} numberOfLines={1}>
          By {storytellerName}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.themeBadge, { backgroundColor: C.orangeGlow, borderColor: 'rgba(245,166,35,0.25)' }]}>
            <Text style={[styles.themeText, { color: C.orange }]}>{theme}</Text>
          </View>
          {story.age_group && (
            <Text style={[styles.ageGroup, { color: C.textMuted }]}>{story.age_group}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 4,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbnail: { width: '100%', height: 160 },
  thumbnailPlaceholder: {
    width: '100%',
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 13, gap: 5 },
  title: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  storyteller: { fontSize: 12 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  themeBadge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  themeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  ageGroup: { fontSize: 11, textTransform: 'capitalize' },
});
