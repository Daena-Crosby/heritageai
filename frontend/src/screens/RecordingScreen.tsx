import React, { useState, useRef } from 'react';
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
import { uploadStory } from '../services/api';

export const RecordingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metadata, setMetadata] = useState({
    title: '',
    storytellerName: '',
    storytellerLocation: '',
    storytellerDialect: '',
    ageGroup: '',
    country: 'Jamaica',
    language: 'Jamaican Patois',
    theme: '',
  });

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    setRecordingUri(uri);
    setRecording(null);
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setRecordingUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking file', err);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const handleUpload = async () => {
    if (!recordingUri) {
      Alert.alert('Error', 'Please record or upload an audio file');
      return;
    }

    if (!metadata.title.trim()) {
      Alert.alert('Error', 'Please enter a story title');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await uploadStory(recordingUri, metadata);
      Alert.alert('Success', 'Story uploaded and processed successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload story');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Record New Story</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Audio Recording</Text>

        <View style={styles.recordingContainer}>
          {!recordingUri ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.recordButton, isRecording && styles.recordingButton]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                <Text style={styles.buttonText}>
                  {isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.orText}>OR</Text>

              <TouchableOpacity
                style={[styles.button, styles.uploadButton]}
                onPress={pickAudioFile}
                disabled={isProcessing}
              >
                <Text style={styles.buttonText}>📁 Upload Audio File</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.audioSelected}>
              <Text style={styles.audioSelectedText}>✓ Audio file selected</Text>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setRecordingUri(null)}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Story Information</Text>

        <TextInput
          style={styles.input}
          placeholder="Story Title *"
          value={metadata.title}
          onChangeText={(text) => setMetadata({ ...metadata, title: text })}
          editable={!isProcessing}
        />

        <TextInput
          style={styles.input}
          placeholder="Storyteller Name"
          value={metadata.storytellerName}
          onChangeText={(text) => setMetadata({ ...metadata, storytellerName: text })}
          editable={!isProcessing}
        />

        <TextInput
          style={styles.input}
          placeholder="Location"
          value={metadata.storytellerLocation}
          onChangeText={(text) => setMetadata({ ...metadata, storytellerLocation: text })}
          editable={!isProcessing}
        />

        <TextInput
          style={styles.input}
          placeholder="Dialect (e.g., Jamaican Patois)"
          value={metadata.storytellerDialect}
          onChangeText={(text) => setMetadata({ ...metadata, storytellerDialect: text })}
          editable={!isProcessing}
        />

        <TextInput
          style={styles.input}
          placeholder="Age Group (e.g., children, teens, general)"
          value={metadata.ageGroup}
          onChangeText={(text) => setMetadata({ ...metadata, ageGroup: text })}
          editable={!isProcessing}
        />

        <TextInput
          style={styles.input}
          placeholder="Theme (e.g., folklore, moral, anansi)"
          value={metadata.theme}
          onChangeText={(text) => setMetadata({ ...metadata, theme: text })}
          editable={!isProcessing}
        />

        <TouchableOpacity
          style={[styles.button, styles.submitButton, isProcessing && styles.disabledButton]}
          onPress={handleUpload}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Upload & Process Story</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  recordingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
    minWidth: 200,
  },
  recordButton: {
    backgroundColor: '#8B4513',
  },
  recordingButton: {
    backgroundColor: '#DC143C',
  },
  uploadButton: {
    backgroundColor: '#4A90E2',
  },
  submitButton: {
    backgroundColor: '#8B4513',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    marginVertical: 12,
    color: '#666',
    fontSize: 14,
  },
  audioSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginVertical: 8,
  },
  audioSelectedText: {
    color: '#2E7D32',
    fontSize: 16,
    marginRight: 12,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8B4513',
    borderRadius: 4,
  },
  changeButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
