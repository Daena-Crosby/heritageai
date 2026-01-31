import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Story } from '../services/api';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const firstIllustration = story.illustrations?.[0]?.image_url;
  const storytellerName = story.storytellers?.name || 'Unknown';
  const theme = story.theme || story.story_tags?.[0]?.tags?.name || 'General';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {firstIllustration && (
        <Image source={{ uri: firstIllustration }} style={styles.thumbnail} />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={styles.storyteller} numberOfLines={1}>
          By {storytellerName}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.theme}>{theme}</Text>
          {story.age_group && (
            <Text style={styles.ageGroup}>{story.age_group}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  storyteller: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  theme: {
    fontSize: 12,
    color: '#8B4513',
    backgroundColor: '#F5E6D3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ageGroup: {
    fontSize: 12,
    color: '#666',
  },
});
