import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { Story, getProcessingStatus, ProcessingJob } from '../services/api';

interface VideoModeProps {
  story: Story;
}

const STEP_LABELS: Record<string, string> = {
  transcription: 'Transcribing audio',
  translation: 'Translating to English',
  subtitles: 'Generating subtitles',
  themes: 'Detecting themes',
  illustrations: 'Creating illustrations',
  video: 'Assembling video',
};

export const VideoMode: React.FC<VideoModeProps> = ({ story }) => {
  const { colors: C } = useTheme();
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
      if (videoFile) {
        setLoading(false);
        return;
      }
      try {
        const job = await getProcessingStatus(story.id);
        setProcessing(job);
        if (job.status === 'completed' || job.status === 'failed') {
          setLoading(false);
        } else {
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

  // Loading state
  if (loading) {
    const step = processing?.current_step;
    const pct = processing?.progress_pct ?? 0;
    return (
      <View style={[styles.centerContainer, { backgroundColor: C.surfaceContainer }]}>
        <View style={[styles.loadingIcon, { backgroundColor: C.orangeGlow }]}>
          <ActivityIndicator size="large" color={C.orange} />
        </View>
        <Text style={[styles.loadingTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
          {step ? STEP_LABELS[step] ?? 'Processing' : 'Loading'}
        </Text>
        {pct > 0 && (
          <View style={[styles.progressBar, { backgroundColor: C.surfaceContainerHigh }]}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${pct}%` }]}
            />
          </View>
        )}
        <Text style={[styles.loadingHint, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
          This may take a few moments
        </Text>
      </View>
    );
  }

  // Show error message if video generation failed
  if (processing?.status === 'completed' && processing.error_message?.includes('Video generation failed')) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: C.surfaceContainer }]}>
        <Ionicons name="alert-circle" size={48} color={C.orange} />
        <Text style={[styles.errorTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
          Video Not Available
        </Text>
        <Text style={[styles.errorText, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
          Video generation encountered an error. This story is available in audio-only mode.
        </Text>
        <Text style={[styles.errorDetail, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
          {processing.error_message}
        </Text>
      </View>
    );
  }

  // Video ready
  if (videoFile) {
    return (
      <View style={[styles.videoContainer, { backgroundColor: C.surfaceContainer }]}>
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
      </View>
    );
  }

  // Audio-only mode
  const showError = processing?.status === 'failed';

  return (
    <View style={styles.audioContainer}>
      {/* Audio Player Card */}
      <View style={[styles.playerCard, { backgroundColor: C.surfaceContainer }]}>
        {/* Illustration */}
        <View style={[styles.artworkContainer, { backgroundColor: C.surfaceContainerHigh }]}>
          {firstIllustration ? (
            <Image
              source={{ uri: firstIllustration }}
              style={styles.artwork}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="musical-notes" size={48} color={C.textMuted} />
          )}

          {currentSubtitle ? (
            <View style={styles.subtitleOverlay}>
              <Text style={[styles.subtitleText, { fontFamily: fonts.manrope.medium }]}>
                {currentSubtitle}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Processing Badge */}
        {processing?.status === 'processing' && (
          <View style={[styles.processingBadge, { backgroundColor: C.surfaceContainerHigh }]}>
            <ActivityIndicator size="small" color={C.orange} />
            <Text style={[styles.processingBadgeText, { color: C.text, fontFamily: fonts.manrope.medium }]}>
              {processing.current_step ? STEP_LABELS[processing.current_step] : 'Video generating'}
            </Text>
          </View>
        )}

        {/* Error Badge */}
        {showError && (
          <View style={[styles.errorBadge, { backgroundColor: `${C.error}20` }]}>
            <Ionicons name="warning" size={16} color={C.error} />
            <Text style={[styles.errorBadgeText, { color: C.error, fontFamily: fonts.manrope.medium }]}>
              Video generation failed — playing audio
            </Text>
          </View>
        )}

        {/* Play Button */}
        {audioFile && (
          <TouchableOpacity onPress={togglePlayback} activeOpacity={0.9}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.playButton}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color="#FFF"
                style={isPlaying ? {} : { marginLeft: 4 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* No Audio */}
        {!audioFile && (
          <View style={styles.noAudio}>
            <Text style={[styles.noAudioText, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
              No audio available for this story
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Loading State
  centerContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 18,
  },
  loadingHint: {
    fontSize: 13,
  },
  progressBar: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Error State
  errorContainer: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorDetail: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  // Video Mode
  videoContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  video: {
    flex: 1,
  },
  // Audio Mode
  audioContainer: {},
  playerCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },
  artworkContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  subtitleOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  subtitleText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  processingBadgeText: {
    fontSize: 13,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  errorBadgeText: {
    fontSize: 13,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  noAudio: {
    padding: spacing.lg,
  },
  noAudioText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
