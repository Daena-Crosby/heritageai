import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Story } from '../services/api';

interface VideoModeProps {
  story: Story;
}

export const VideoMode: React.FC<VideoModeProps> = ({ story }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const audioFile = story.media?.find((m) => m.type === 'audio');
  const videoFile = story.media?.find((m) => m.type === 'video');
  const translation = story.translations?.[0];
  const subtitles = translation?.subtitles || [];
  const firstIllustration = story.illustrations?.[0]?.image_url;

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadAudio = async () => {
    try {
      if (!audioFile) {
        setLoading(false);
        return;
      }

      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioFile.file_url },
        { shouldPlay: false }
      );

      setSound(audioSound);
      setLoading(false);

      // Update subtitles based on playback position
      audioSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.positionMillis) {
          const currentTime = status.positionMillis / 1000;
          const subtitle = subtitles.find(
            (s) => currentTime >= s.start && currentTime <= s.end
          );
          setCurrentSubtitle(subtitle?.text || '');
          setIsPlaying(status.isPlaying);
        }
      });
    } catch (error) {
      console.error('Error loading audio:', error);
      setLoading(false);
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
      await sound.pauseAsync();
      } else {
      await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  if (!audioFile && !videoFile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No media available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {firstIllustration ? (
          <View style={styles.imageContainer}>
            <Text style={styles.imagePlaceholder}>📖</Text>
            <Text style={styles.imageNote}>Illustration would appear here</Text>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Text style={styles.imagePlaceholder}>🎬</Text>
            <Text style={styles.imageNote}>Video would appear here</Text>
          </View>
        )}

        {currentSubtitle ? (
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleText}>{currentSubtitle}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayback}
          disabled={!sound}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </Text>
        </TouchableOpacity>
      </View>

      {translation && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Story Translation</Text>
          <Text style={styles.infoText}>{translation.translated_text}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  imagePlaceholder: {
    fontSize: 80,
    marginBottom: 16,
  },
  imageNote: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.7,
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
  },
  subtitleText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  controls: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    maxHeight: 200,
  },
  infoTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FFF',
  },
});
