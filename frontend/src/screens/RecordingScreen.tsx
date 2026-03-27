import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { uploadStory, uploadStoryText, uploadStoryDocument } from '../services/api';

const CATEGORIES = ['Folklore', 'Moral', 'History', 'Personal Story', 'Ancestral Wisdom', 'Tradition', 'Legend', 'Fable', 'Anansi'];

type RecordingTab = 'audio' | 'text' | 'upload';

interface RecordingScreenProps {
  onBack: () => void;
}

const DEFAULT_META = {
  title: '',
  storytellerName: '',
  storytellerLocation: '',
  storytellerDialect: '',
  ageGroup: '',
  country: '',
  language: 'Jamaican Patois',
  theme: '',
};

export const RecordingScreen: React.FC<RecordingScreenProps> = ({ onBack }) => {
  const { colors: C } = useTheme();
  const [activeTab, setActiveTab] = useState<RecordingTab>('audio');
  const [metadata, setMetadata] = useState(DEFAULT_META);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Microphone access is required to record audio.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    setAudioUri(recording.getURI());
    setRecording(null);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setDocFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'text/plain' });
      }
    } catch {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setAudioUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const handleSubmit = async () => {
    if (!metadata.title.trim()) {
      Alert.alert('Required', 'Please enter a story title.');
      return;
    }
    const hasContent =
      (activeTab === 'audio' && audioUri) ||
      (activeTab === 'text' && storyText.trim().length >= 10) ||
      (activeTab === 'upload' && docFile);

    if (!hasContent) {
      Alert.alert('Required', 'Please provide story content based on your selected input method.');
      return;
    }

    try {
      setIsProcessing(true);
      if (activeTab === 'audio' && audioUri) {
        await uploadStory(audioUri, metadata);
      } else if (activeTab === 'upload' && docFile) {
        await uploadStoryDocument(docFile.uri, docFile.name, docFile.mimeType, metadata);
      } else {
        await uploadStoryText(storyText, metadata);
      }
      Alert.alert(
        'Story Submitted',
        'Your story has been received and is pending review. Once approved, it will appear in the Heritage Vault.',
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.error || error.message || 'Something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  };

  const setField = (field: keyof typeof metadata) => (text: string) =>
    setMetadata((prev) => ({ ...prev, [field]: text }));

  const selectedCategory = metadata.theme
    ? metadata.theme.charAt(0).toUpperCase() + metadata.theme.slice(1)
    : null;

  const tabs = [
    { id: 'audio' as const, label: 'Record Audio', icon: 'mic' as const },
    { id: 'text' as const, label: 'Type Story', icon: 'create' as const },
    { id: 'upload' as const, label: 'Upload File', icon: 'cloud-upload' as const },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text, fontFamily: fonts.epilogue.bold }]}>
          Preserve Your Story
        </Text>
        <Text style={[styles.subtitle, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
          Share your heritage with the world. Record, write, or upload your story.
        </Text>
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: C.surfaceContainer }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: C.orange },
            ]}
            onPress={() => setActiveTab(tab.id)}
            disabled={isProcessing}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#FFF' : C.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.id ? '#FFF' : C.textMuted,
                  fontFamily: activeTab === tab.id ? fonts.manrope.semibold : fonts.manrope.regular,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recording Tab Content */}
      {activeTab === 'audio' && (
        <View style={styles.recordingSection}>
          {/* Large Record Button */}
          <View style={styles.recordButtonContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isRecording ? ['#FF4444', '#CC0000'] : gradients.primary}
                  style={styles.recordButton}
                >
                  <Ionicons
                    name={isRecording ? 'stop' : audioUri ? 'checkmark' : 'mic'}
                    size={48}
                    color="#FFF"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Text style={[styles.recordingStatus, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
              {isRecording
                ? 'Recording...'
                : audioUri
                ? 'Recording Complete'
                : 'Tap to Start Recording'}
            </Text>

            {(isRecording || audioUri) && (
              <Text style={[styles.timer, { color: C.orange, fontFamily: fonts.epilogue.bold }]}>
                {formatDuration(recordingDuration)}
              </Text>
            )}

            {audioUri && !isRecording && (
              <TouchableOpacity
                style={[styles.rerecordButton, { backgroundColor: C.surfaceContainerHigh }]}
                onPress={() => {
                  setAudioUri(null);
                  setRecordingDuration(0);
                }}
              >
                <Ionicons name="refresh" size={16} color={C.textSub} />
                <Text style={[styles.rerecordText, { color: C.textSub, fontFamily: fonts.manrope.medium }]}>
                  Record Again
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Or upload audio */}
          <TouchableOpacity
            style={[styles.uploadOption, { backgroundColor: C.surfaceContainer }]}
            onPress={pickAudioFile}
            disabled={isProcessing}
          >
            <Ionicons name="folder-open-outline" size={20} color={C.textMuted} />
            <Text style={[styles.uploadOptionText, { color: C.textSub, fontFamily: fonts.manrope.medium }]}>
              Or upload an audio file
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Type Story Tab Content */}
      {activeTab === 'text' && (
        <View style={[styles.textSection, { backgroundColor: C.surfaceContainer }]}>
          <TextInput
            style={[styles.storyTextArea, { color: C.text, fontFamily: fonts.manrope.regular }]}
            placeholder="Begin telling your story here...&#10;&#10;Share your memories, traditions, and wisdom. Every word helps preserve our heritage for future generations."
            placeholderTextColor={C.textMuted}
            value={storyText}
            onChangeText={setStoryText}
            multiline
            textAlignVertical="top"
            editable={!isProcessing}
            maxLength={50000}
          />
          <Text style={[styles.charCount, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
            {storyText.length.toLocaleString()} / 50,000 characters
          </Text>
        </View>
      )}

      {/* Upload Tab Content */}
      {activeTab === 'upload' && (
        <TouchableOpacity
          style={[styles.uploadArea, { backgroundColor: C.surfaceContainer }]}
          onPress={pickDocument}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {docFile ? (
            <View style={styles.uploadedFile}>
              <View style={[styles.uploadedIcon, { backgroundColor: C.orangeGlow }]}>
                <Ionicons name="document-text" size={28} color={C.orange} />
              </View>
              <Text style={[styles.uploadedName, { color: C.text, fontFamily: fonts.manrope.semibold }]} numberOfLines={1}>
                {docFile.name}
              </Text>
              <TouchableOpacity
                style={[styles.removeFile, { backgroundColor: C.surfaceContainerHigh }]}
                onPress={() => setDocFile(null)}
              >
                <Ionicons name="close" size={16} color={C.textSub} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.uploadIcon, { backgroundColor: C.surfaceContainerHigh }]}>
                <Ionicons name="cloud-upload-outline" size={40} color={C.textMuted} />
              </View>
              <Text style={[styles.uploadTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                Drop your file here
              </Text>
              <Text style={[styles.uploadHint, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                or tap to browse
              </Text>
              <Text style={[styles.uploadFormats, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                Supports .txt, .doc, .docx
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Story Metadata */}
      <View style={[styles.metadataSection, { backgroundColor: C.surfaceContainer }]}>
        <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
          Story Details
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: C.surfaceContainerHigh, color: C.text, fontFamily: fonts.manrope.regular }]}
          placeholder="Story Title *"
          placeholderTextColor={C.textMuted}
          value={metadata.title}
          onChangeText={setField('title')}
          editable={!isProcessing}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputHalf, { backgroundColor: C.surfaceContainerHigh, color: C.text, fontFamily: fonts.manrope.regular }]}
            placeholder="Your Name"
            placeholderTextColor={C.textMuted}
            value={metadata.storytellerName}
            onChangeText={setField('storytellerName')}
            editable={!isProcessing}
          />
          <TextInput
            style={[styles.input, styles.inputHalf, { backgroundColor: C.surfaceContainerHigh, color: C.text, fontFamily: fonts.manrope.regular }]}
            placeholder="Location"
            placeholderTextColor={C.textMuted}
            value={metadata.storytellerLocation}
            onChangeText={setField('storytellerLocation')}
            editable={!isProcessing}
          />
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.inputHalf, { backgroundColor: C.surfaceContainerHigh, color: C.text, fontFamily: fonts.manrope.regular }]}
            placeholder="Dialect"
            placeholderTextColor={C.textMuted}
            value={metadata.storytellerDialect}
            onChangeText={setField('storytellerDialect')}
            editable={!isProcessing}
          />

          {/* Category Dropdown */}
          <View style={[styles.inputHalf, { zIndex: 10 }]}>
            <TouchableOpacity
              style={[styles.categoryBtn, { backgroundColor: C.surfaceContainerHigh }]}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              disabled={isProcessing}
            >
              <Text style={[styles.categoryBtnText, { color: selectedCategory ? C.text : C.textMuted, fontFamily: fonts.manrope.regular }]}>
                {selectedCategory ?? 'Theme'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={C.textSub} />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={[styles.dropdown, { backgroundColor: C.surfaceContainerHighest }]}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        cat.toLowerCase() === metadata.theme && { backgroundColor: C.orangeGlow },
                      ]}
                      onPress={() => {
                        setMetadata((prev) => ({ ...prev, theme: cat.toLowerCase() }));
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          {
                            color: cat.toLowerCase() === metadata.theme ? C.orange : C.text,
                            fontFamily: cat.toLowerCase() === metadata.theme ? fonts.manrope.semibold : fonts.manrope.regular,
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Cultural Guide AI Prompt Card */}
      <View style={[styles.aiCard, { backgroundColor: C.surfaceContainer }]}>
        <View style={[styles.aiAccent, { backgroundColor: C.orange }]} />
        <View style={styles.aiContent}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color={C.orange} />
            <Text style={[styles.aiTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
              AI-Powered Processing
            </Text>
          </View>
          <Text style={[styles.aiDescription, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
            Your story will be automatically transcribed, translated, and illustrated using our Cultural AI.
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isProcessing}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isProcessing ? [C.textMuted, C.textMuted] : gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="archive" size={20} color="#FFF" />
              <Text style={[styles.submitButtonText, { fontFamily: fonts.manrope.bold }]}>
                Submit Story
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Bottom spacing for nav bar */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  // Header
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  // Tab Selector
  tabContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  tabText: {
    fontSize: 13,
  },
  // Recording Section
  recordingSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  recordButtonContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  recordingStatus: {
    fontSize: 16,
    marginTop: spacing.lg,
  },
  timer: {
    fontSize: 32,
    marginTop: spacing.sm,
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  rerecordText: {
    fontSize: 14,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  uploadOptionText: {
    fontSize: 14,
  },
  // Text Section
  textSection: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  storyTextArea: {
    minHeight: 200,
    fontSize: 16,
    lineHeight: 24,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  // Upload Section
  uploadArea: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(139,115,85,0.3)',
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  uploadTitle: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  uploadHint: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  uploadFormats: {
    fontSize: 12,
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  uploadedIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedName: {
    flex: 1,
    fontSize: 15,
  },
  removeFile: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Metadata Section
  metadataSection: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: spacing.lg,
  },
  input: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputHalf: {
    flex: 1,
  },
  categoryBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categoryBtnText: {
    fontSize: 15,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 10,
    zIndex: 20,
  },
  dropdownItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownItemText: {
    fontSize: 15,
  },
  // AI Card
  aiCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  aiAccent: {
    width: 4,
  },
  aiContent: {
    flex: 1,
    padding: spacing.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  aiTitle: {
    fontSize: 15,
  },
  aiDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});
