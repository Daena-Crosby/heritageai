import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { getStory, Story } from '../services/api';
import { StorybookMode } from '../components/StorybookMode';
import { VideoMode } from '../components/VideoMode';

export const StoryViewScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { storyId } = route.params;
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'storybook' | 'video'>('storybook');

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Story not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {story.title}
        </Text>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'storybook' && styles.modeButtonActive]}
          onPress={() => setMode('storybook')}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === 'storybook' && styles.modeButtonTextActive,
            ]}
          >
            📖 Storybook
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}
          onPress={() => setMode('video')}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === 'video' && styles.modeButtonTextActive,
            ]}
          >
            🎬 Video
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'storybook' ? (
        <StorybookMode story={story} />
      ) : (
        <VideoMode story={story} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#8B4513',
  },
  backButton: {
    fontSize: 16,
    color: '#F5E6D3',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modeButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeButtonActive: {
    borderBottomColor: '#8B4513',
  },
  modeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#8B4513',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});
