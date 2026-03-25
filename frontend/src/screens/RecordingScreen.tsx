import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme/ThemeContext';
import { uploadStory, uploadStoryText, uploadStoryDocument } from '../services/api';

const CATEGORIES = ['Folklore', 'Moral', 'History', 'Personal Story', 'Ancestral Wisdom', 'Tradition', 'Legend', 'Fable', 'Anansi'];

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
  const [metadata, setMetadata] = useState(DEFAULT_META);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  const { width } = useWindowDimensions();
  const isWide = width >= 768;

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

  const pickMediaFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.mimeType?.startsWith('audio/')) {
          setAudioUri(asset.uri);
        } else {
          setDocFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'text/plain' });
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleSubmit = async () => {
    if (!metadata.title.trim()) {
      Alert.alert('Required', 'Please enter an artifact title.');
      return;
    }
    if (!audioUri && !docFile && storyText.trim().length < 10) {
      Alert.alert('Required', 'Please record audio, upload a file, or enter at least 10 characters of story text.');
      return;
    }
    try {
      setIsProcessing(true);
      if (audioUri) {
        await uploadStory(audioUri, metadata);
      } else if (docFile) {
        await uploadStoryDocument(docFile.uri, docFile.name, docFile.mimeType, metadata);
      } else {
        await uploadStoryText(storyText, metadata);
      }
      Alert.alert('Archived!', 'Your story is being processed. Check the Heritage Vault shortly.', [
        { text: 'OK', onPress: onBack },
      ]);
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: C.text }]}>Global Command Center</Text>
        <Text style={[styles.pageSubtitle, { color: C.textSub }]}>
          Record and archive heritage using our multi-threaded synthesis engine.
        </Text>
      </View>

      <View style={[styles.columns, !isWide && styles.columnsStack]}>
        {/* Left column */}
        <View style={[styles.colMain, !isWide && styles.colFull]}>
          {/* Archive metadata */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textMuted }]}>ARCHIVE METADATA</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              placeholder="Artifact Title *"
              placeholderTextColor={C.textMuted}
              value={metadata.title}
              onChangeText={setField('title')}
              editable={!isProcessing}
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              placeholder="Storyteller Name (optional)"
              placeholderTextColor={C.textMuted}
              value={metadata.storytellerName}
              onChangeText={setField('storytellerName')}
              editable={!isProcessing}
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              placeholder="Location (e.g., Kingston, Jamaica)"
              placeholderTextColor={C.textMuted}
              value={metadata.storytellerLocation}
              onChangeText={setField('storytellerLocation')}
              editable={!isProcessing}
            />
          </View>

          {/* Oral & written record */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textMuted }]}>ORAL & WRITTEN RECORD</Text>
            <TouchableOpacity
              style={[
                styles.recordBtn,
                { backgroundColor: isRecording ? '#B52A2A' : C.orangeBtn },
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={18} color="#FFF" />
              <Text style={styles.recordBtnText}>
                {audioUri
                  ? '✓  Audio Recorded'
                  : isRecording
                  ? 'STOP RECORDING'
                  : 'START ORAL RECORD'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text },
              ]}
              placeholder="Type the story context or manually transcribe here..."
              placeholderTextColor={C.textMuted}
              value={storyText}
              onChangeText={setStoryText}
              multiline
              textAlignVertical="top"
              editable={!isProcessing}
              maxLength={50000}
            />
            {storyText.length > 0 && (
              <Text style={[styles.charCount, { color: C.textMuted }]}>
                {storyText.length} / 50,000
              </Text>
            )}
          </View>

          {/* Supplementary artifacts */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textMuted }]}>SUPPLEMENTARY ARTIFACTS</Text>
            <TouchableOpacity
              style={[styles.uploadArea, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
              onPress={pickMediaFile}
              disabled={isProcessing}
            >
              {docFile || (audioUri && !isRecording) ? (
                <View style={styles.uploadedRow}>
                  <Ionicons name="checkmark-circle" size={20} color={C.success} />
                  <Text style={[styles.uploadedName, { color: C.text }]} numberOfLines={1}>
                    {docFile?.name ?? 'Audio file ready'}
                  </Text>
                  <TouchableOpacity onPress={() => { setDocFile(null); setAudioUri(null); }}>
                    <Ionicons name="close-circle" size={17} color={C.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={28} color={C.textMuted} />
                  <Text style={[styles.uploadText, { color: C.textSub }]}>
                    Upload media (AI analyzes in background)
                  </Text>
                  <Text style={[styles.uploadHint, { color: C.textMuted }]}>
                    Audio, .txt, .doc, .docx
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Right column */}
        <View style={[styles.colSide, !isWide && styles.colFull]}>
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textMuted }]}>GLOBAL CLASSIFICATION</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              placeholder="Cultural Origin (e.g., Jamaican)"
              placeholderTextColor={C.textMuted}
              value={metadata.country}
              onChangeText={setField('country')}
              editable={!isProcessing}
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              placeholder="Archive Origin (region / community)"
              placeholderTextColor={C.textMuted}
              value={metadata.storytellerLocation}
              onChangeText={setField('storytellerLocation')}
              editable={!isProcessing}
            />

            {/* Category dropdown */}
            <View style={{ zIndex: 10 }}>
              <TouchableOpacity
                style={[styles.categoryBtn, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                disabled={isProcessing}
              >
                <Text style={[styles.categoryBtnText, { color: selectedCategory ? C.text : C.textMuted }]}>
                  {selectedCategory ?? 'Theme'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={C.textSub} />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <View style={[styles.dropdown, { backgroundColor: C.surface, borderColor: C.border }]}>
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
                          cat.toLowerCase() === metadata.theme && { backgroundColor: C.activeNav },
                        ]}
                        onPress={() => {
                          setMetadata((prev) => ({ ...prev, theme: cat.toLowerCase() }));
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: cat.toLowerCase() === metadata.theme ? C.text : C.textSub },
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

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: C.orange }, isProcessing && styles.disabled]}
              onPress={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Optimized Preservation</Text>
              )}
            </TouchableOpacity>

            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: C.success }]} />
              <Text style={[styles.statusText, { color: C.textMuted }]}>
                MULTI-THREADED ARCHIVAL ACTIVE
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textMuted }]}>DIALECT</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              placeholder="e.g., Jamaican Patois"
              placeholderTextColor={C.textMuted}
              value={metadata.storytellerDialect}
              onChangeText={setField('storytellerDialect')}
              editable={!isProcessing}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 22, paddingBottom: 40, gap: 18 },
  pageHeader: { gap: 5, marginBottom: 2 },
  pageTitle: { fontSize: 26, fontWeight: 'bold' },
  pageSubtitle: { fontSize: 13, lineHeight: 20 },
  columns: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  columnsStack: { flexDirection: 'column' },
  colMain: { flex: 1.4, gap: 14 },
  colSide: { flex: 1, gap: 14 },
  colFull: { flex: undefined, width: '100%' },
  card: { borderRadius: 14, padding: 16, gap: 11, borderWidth: 1 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  input: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, borderWidth: 1 },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 15,
  },
  recordBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  textArea: { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, minHeight: 100, borderWidth: 1 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: -4 },
  uploadArea: {
    borderRadius: 10,
    padding: 22,
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  uploadText: { fontSize: 13, textAlign: 'center' },
  uploadHint: { fontSize: 11 },
  uploadedRow: { flexDirection: 'row', alignItems: 'center', gap: 9, width: '100%' },
  uploadedName: { flex: 1, fontSize: 13 },
  categoryBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
  },
  categoryBtnText: { fontSize: 14 },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 10,
    zIndex: 20,
  },
  dropdownItem: { paddingHorizontal: 13, paddingVertical: 10 },
  dropdownItemText: { fontSize: 14 },
  submitBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 2 },
  disabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
});
