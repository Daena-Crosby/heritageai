import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Audio } from 'expo-av';
import { Story, getProcessingStatus, ProcessingJob } from '../services/api';

interface VideoModeProps {
  story: Story;
}

const STEP_LABELS: Record<string, string> = {
  transcription: 'Transcribing audio...',
  translation: 'Translating to English...',
  subtitles: 'Generating subtitles...',
  themes: 'Detecting themes...',
  illustrations: 'Creating illustrations...',
  video: 'Assembling video...',
};

export const VideoMode: React.FC<VideoModeProps> = ({ story }) => {
  const videoRef = useRef<Video>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<ProcessingJob | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioFile = story.media?.find((m) => m.type === 'audio');
  const videoFile = story.media?.find((m) => m.type === 'video');
  const translation = story.translations?.[0];
  const subtitles = translation?.subtitles || [];
  const firstIllustration = story.illustrations?.[0]?.image_url;

  // Poll processing status until video is ready
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const job = await getProcessingStatus(story.id);
        setProcessing(job);
        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setLoading(false);
        }
      } catch {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setLoading(false);
      }
    }, 4000);
  }, [story.id]);

  useEffect(() => {
    const init = async () => {
      // If video already exists, no need to poll
      if (videoFile) {
        setLoading(false);
        return;
      }
      // Check processing status
      try {
        const job = await getProcessingStatus(story.id);
        setProcessing(job);
        if (job.status === 'completed' || job.status === 'failed') {
          setLoading(false);
        } else {
          // Still processing — start polling and load audio for now
          startPolling();
          await loadAudio();
        }
      } catch {
        setLoading(false);
        await loadAudio();
      }
    };
    init();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      sound?.unloadAsync();
    };
  }, [story.id]);

  const loadAudio = async () => {
    if (!audioFile) return;
    try {
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioFile.file_url },
        { shouldPlay: false }
      );
      setSound(audioSound);
      audioSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          const currentTime = (status.positionMillis ?? 0) / 1000;
          const subtitle = subtitles.find(
            (s) => currentTime >= s.start && currentTime <= s.end
          );
          setCurrentSubtitle(subtitle?.text || '');
          setIsPlaying(status.isPlaying);
        }
      });
    } catch (err) {
      console.error('Error loading audio:', err);
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
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  // ============================
  // Loading / processing state
  // ============================
  if (loading) {
    const step = processing?.current_step;
    const pct = processing?.progress_pct ?? 0;
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.processingLabel}>
          {step ? STEP_LABELS[step] ?? 'Processing...' : 'Loading...'}
        </Text>
        {pct > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
        )}
      </View>
    );
  }

  // ============================
  // Video ready — native player
  // ============================
  if (videoFile) {
    return (
      <View style={styles.container}>
        <Video
          ref={videoRef}
          source={{ uri: videoFile.file_url }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded) setIsPlaying(status.isPlaying);
          }}
        />
        {translation && (
          <ScrollView style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Story Translation</Text>
            <Text style={styles.infoText}>{translation.translated_text}</Text>
          </ScrollView>
        )}
      </View>
    );
  }

  // ============================
  // Video not yet ready — audio + illustration + subtitles
  // ============================
  const showError = processing?.status === 'failed';

  return (
    <View style={styles.container}>
      <View style={styles.illustrationContainer}>
        {firstIllustration ? (
          <Image
            source={{ uri: firstIllustration }}
            style={styles.illustration}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.illustrationPlaceholder}>
            <Text style={styles.placeholderIcon}>🎶</Text>
          </View>
        )}

        {currentSubtitle ? (
          <View style={styles.subtitleOverlay}>
            <Text style={styles.subtitleText}>{currentSubtitle}</Text>
          </View>
        ) : null}

        {processing?.status === 'processing' && (
          <View style={styles.processingBadge}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.processingBadgeText}>
              {processing.current_step ? STEP_LABELS[processing.current_step] ?? 'Processing...' : 'Video generating...'}
            </Text>
          </View>
        )}
      </View>

      {showError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Video generation failed — playing audio only.</Text>
        </View>
      )}

      {audioFile && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayback}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸  Pause' : '▶  Play'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {translation && (
        <ScrollView style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Story Translation</Text>
          <Text style={styles.infoText}>{translation.translated_text}</Text>
        </ScrollView>
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
    backgroundColor: '#1a1a1a',
    gap: 16,
  },
  processingLabel: {
    color: '#CCC',
    fontSize: 15,
    marginTop: 8,
  },
  progressBar: {
    width: '60%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 3,
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  illustrationContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  illustrationPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
  },
  subtitleOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 12,
    borderRadius: 8,
  },
  subtitleText: {
    color: '#FFF',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
  processingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139,69,19,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  processingBadgeText: {
    color: '#FFF',
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: '#B71C1C',
    padding: 10,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#FFF',
    fontSize: 13,
  },
  controls: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    maxHeight: 180,
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  infoTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 21,
  },
});
