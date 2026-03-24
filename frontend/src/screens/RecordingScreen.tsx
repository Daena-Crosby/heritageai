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
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { uploadStory, uploadStoryText, uploadStoryDocument } from '../services/api';

type InputTab = 'audio' | 'document' | 'text';

const DEFAULT_METADATA = {
  title: '',
  storytellerName: '',
  storytellerLocation: '',
  storytellerDialect: '',
  ageGroup: '',
  country: 'Jamaica',
  language: 'Jamaican Patois',
  theme: '',
};

export const RecordingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [tab, setTab] = useState<InputTab>('audio');
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  // Document state
  const [docFile, setDocFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  // Text state
  const [storyText, setStoryText] = useState('');

  // ============================
  // Audio recording
  // ============================
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
    } catch (err) {
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

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setAudioUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  // ============================
  // Document picker
  // ============================
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
        setDocFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'text/plain',
        });
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // ============================
  // Submit
  // ============================
  const handleSubmit = async () => {
    if (!metadata.title.trim()) {
      Alert.alert('Required', 'Please enter a story title.');
      return;
    }

    if (tab === 'audio' && !audioUri) {
      Alert.alert('Required', 'Please record or select an audio file.');
      return;
    }
    if (tab === 'document' && !docFile) {
      Alert.alert('Required', 'Please select a document file.');
      return;
    }
    if (tab === 'text' && storyText.trim().length < 10) {
      Alert.alert('Required', 'Please enter at least 10 characters of story text.');
      return;
    }

    try {
      setIsProcessing(true);

      if (tab === 'audio') {
        await uploadStory(audioUri!, metadata);
      } else if (tab === 'document') {
        await uploadStoryDocument(docFile!.uri, docFile!.name, docFile!.mimeType, metadata);
      } else {
        await uploadStoryText(storyText, metadata);
      }

      Alert.alert('Success!', 'Your story is being processed. Check back shortly for illustrations and translation.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.error || error.message || 'Something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  };

  const meta = (field: keyof typeof metadata) => ({
    value: metadata[field],
    onChangeText: (text: string) => setMetadata({ ...metadata, [field]: text }),
    editable: !isProcessing,
    style: styles.input,
  });

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Story</Text>
      </View>

      {/* Input type tabs */}
      <View style={styles.tabs}>
        {(['audio', 'document', 'text'] as InputTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            disabled={isProcessing}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'audio' ? '🎤 Audio' : t === 'document' ? '📄 Document' : '✏️ Type Story'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>

        {/* ====== AUDIO TAB ====== */}
        {tab === 'audio' && (
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Audio Recording</Text>
            <Text style={styles.hint}>Record your voice or upload an audio file (mp3, m4a, wav, ogg)</Text>

            {!audioUri ? (
              <>
                <TouchableOpacity
                  style={[styles.button, isRecording ? styles.stopButton : styles.recordButton]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                >
                  <Text style={styles.buttonText}>
                    {isRecording ? '⏹  Stop Recording' : '🎤  Start Recording'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.orText}>— OR —</Text>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={pickAudioFile}
                  disabled={isProcessing}
                >
                  <Text style={styles.buttonText}>📁  Upload Audio File</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.selectedFile}>
                <Text style={styles.selectedFileText}>✓  Audio ready</Text>
                <TouchableOpacity onPress={() => setAudioUri(null)}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ====== DOCUMENT TAB ====== */}
        {tab === 'document' && (
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Upload Document</Text>
            <Text style={styles.hint}>Supported formats: .txt, .doc, .docx (max 10MB)</Text>

            {!docFile ? (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={pickDocument}
                disabled={isProcessing}
              >
                <Text style={styles.buttonText}>📄  Choose File</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.selectedFile}>
                <Text style={styles.selectedFileText} numberOfLines={1}>✓  {docFile.name}</Text>
                <TouchableOpacity onPress={() => setDocFile(null)}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ====== TEXT TAB ====== */}
        {tab === 'text' && (
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Type Your Story</Text>
            <Text style={styles.hint}>Write or paste the full story text below</Text>
            <TextInput
              style={styles.storyTextInput}
              placeholder="Once upon a time in Jamaica..."
              value={storyText}
              onChangeText={setStoryText}
              multiline
              numberOfLines={12}
              textAlignVertical="top"
              editable={!isProcessing}
              maxLength={50000}
            />
            <Text style={styles.charCount}>{storyText.length} / 50,000 characters</Text>
          </View>
        )}

        {/* ====== STORY INFO (shared) ====== */}
        <Text style={styles.sectionTitle}>Story Information</Text>

        <TextInput placeholder="Story Title *" {...meta('title')} />
        <TextInput placeholder="Storyteller Name" {...meta('storytellerName')} />
        <TextInput placeholder="Location (e.g., Kingston, Jamaica)" {...meta('storytellerLocation')} />

        {tab === 'audio' && (
          <TextInput placeholder="Dialect (e.g., Jamaican Patois)" {...meta('storytellerDialect')} />
        )}

        <Text style={styles.fieldLabel}>Age Group</Text>
        <View style={styles.chipRow}>
          {['children', 'teens', 'general'].map((ag) => (
            <TouchableOpacity
              key={ag}
              style={[styles.chip, metadata.ageGroup === ag && styles.chipActive]}
              onPress={() => setMetadata({ ...metadata, ageGroup: metadata.ageGroup === ag ? '' : ag })}
              disabled={isProcessing}
            >
              <Text style={[styles.chipText, metadata.ageGroup === ag && styles.chipTextActive]}>
                {ag.charAt(0).toUpperCase() + ag.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput placeholder="Language (e.g., Jamaican Patois, English)" {...meta('language')} />
        <TextInput placeholder="Theme (e.g., folklore, anansi, moral)" {...meta('theme')} />
        <TextInput placeholder="Country" {...meta('country')} />

        <TouchableOpacity
          style={[styles.button, styles.submitButton, isProcessing && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator color="#FFF" />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              {tab === 'audio' ? '🚀  Upload & Process Story' :
               tab === 'document' ? '🚀  Process Document' :
               '🚀  Save & Illustrate Story'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.processingNote}>
          AI processing takes 1-3 minutes. Illustrations and translation will be generated automatically.
        </Text>
      </View>
    </ScrollView>
  );
};

const BROWN = '#8B4513';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: { padding: 16, paddingTop: 60, backgroundColor: BROWN },
  backButton: { fontSize: 16, color: '#F5E6D3', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: BROWN },
  tabText: { fontSize: 13, color: '#888' },
  tabTextActive: { color: BROWN, fontWeight: 'bold' },
  content: { padding: 16 },
  inputSection: { marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 6 },
  hint: { fontSize: 13, color: '#888', marginBottom: 14 },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 6,
  },
  recordButton: { backgroundColor: BROWN },
  stopButton: { backgroundColor: '#DC143C' },
  secondaryButton: { backgroundColor: '#4A90E2' },
  submitButton: { backgroundColor: BROWN, marginTop: 28 },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  processingRow: { flexDirection: 'row', alignItems: 'center' },
  orText: { textAlign: 'center', color: '#999', marginVertical: 10, fontSize: 13 },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginVertical: 6,
  },
  selectedFileText: { color: '#2E7D32', fontSize: 15, flex: 1, marginRight: 10 },
  changeText: { color: BROWN, fontSize: 14, fontWeight: '600' },
  storyTextInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 220,
    lineHeight: 22,
  },
  charCount: { fontSize: 12, color: '#AAA', textAlign: 'right', marginTop: 4, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fieldLabel: { fontSize: 14, color: '#555', marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0E8E0',
    borderWidth: 1,
    borderColor: '#D0B090',
  },
  chipActive: { backgroundColor: BROWN, borderColor: BROWN },
  chipText: { color: '#666', fontSize: 14 },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  processingNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 30,
    lineHeight: 18,
  },
});
