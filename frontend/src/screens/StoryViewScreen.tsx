import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
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
        <Ionicons name="alert-circle-outline" size={40} color={C.textMuted} />
        <Text style={[styles.errorText, { color: C.textSub }]}>Story not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.sidebar, borderBottomColor: C.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={17} color={C.textSub} />
          <Text style={[styles.backText, { color: C.textSub }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
          {story.title}
        </Text>
        <View style={{ width: 56 }} />
      </View>

      {/* Mode selector */}
      <View style={[styles.modeBar, { backgroundColor: C.sidebar, borderBottomColor: C.border }]}>
        {(['storybook', 'video'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeTab, mode === m && { borderBottomColor: C.orange }]}
            onPress={() => setMode(m)}
          >
            <Ionicons
              name={m === 'storybook' ? 'book-outline' : 'film-outline'}
              size={15}
              color={mode === m ? C.orange : C.textSub}
            />
            <Text
              style={[
                styles.modeTabText,
                { color: mode === m ? C.orange : C.textSub },
                mode === m && styles.modeTabTextActive,
              ]}
            >
              {m === 'storybook' ? 'Storybook' : 'Video'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'storybook' ? <StorybookMode story={story} /> : <VideoMode story={story} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingTop: 18,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 56 },
  backText: { fontSize: 14 },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  modeBar: { flexDirection: 'row', borderBottomWidth: 1 },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabText: { fontSize: 14 },
  modeTabTextActive: { fontWeight: '600' },
});
