import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { translateDialect } from '../services/api';

const DIALECTS = [
  'Jamaican Patois',
  'Trinidadian Slang',
  'Nigerian Pidgin',
  'Louisiana Creole',
  'Haitian Kreyòl',
];

const DIALECT_NOTES: Record<string, string> = {
  'Jamaican Patois':
    'Jamaican Patois (Patwa) blends West African languages — primarily Twi, Akan, and Yoruba — with English. It is the mother tongue of most Jamaicans.',
  'Trinidadian Slang':
    'Trinidadian Creole English mixes English with French Creole, Hindi, Yoruba, and Twi influences, reflecting the island\'s diverse colonial history.',
  'Nigerian Pidgin':
    'Nigerian Pidgin (Naijá) is an English-based creole spoken by over 75 million Nigerians, with deep roots in West African trade languages.',
  'Louisiana Creole':
    'Louisiana Creole is a French-based creole language developed by enslaved Africans in Louisiana, closely related to Haitian Kreyòl.',
  'Haitian Kreyòl':
    'Haitian Kreyòl is a French-based creole with West African, Spanish, and Taíno influences, spoken by ~11 million people in Haiti.',
};

export const DialectsScreen: React.FC = () => {
  const { colors: C } = useTheme();
  const [selectedDialect, setSelectedDialect] = useState('Jamaican Patois');
  const [inputText, setInputText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setTranslation(null);
    setError(null);
    try {
      const result = await translateDialect(inputText.trim(), selectedDialect);
      setTranslation(result.translation);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Translation failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasResult = translation !== null || error !== null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header row */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>Dialect Agent</Text>
          <Text style={[styles.subtitle, { color: C.textSub }]}>LINGUISTIC ETYMOLOGY EXPLORER</Text>
        </View>

        {/* Source dropdown */}
        <View style={[styles.dropdownWrapper, { zIndex: 20 }]}>
          <Text style={[styles.sourceLabel, { color: C.textMuted }]}>SOURCE</Text>
          <TouchableOpacity
            style={[styles.dropdownBtn, { backgroundColor: C.surface, borderColor: C.orange }]}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={[styles.dropdownBtnText, { color: C.text }]}>{selectedDialect}</Text>
            <Ionicons name="chevron-down" size={14} color={C.text} />
          </TouchableOpacity>
          {showDropdown && (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: C.surface, borderColor: C.border },
              ]}
            >
              {DIALECTS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dropdownItem,
                    d === selectedDialect && { backgroundColor: C.activeNav },
                  ]}
                  onPress={() => {
                    setSelectedDialect(d);
                    setShowDropdown(false);
                    setTranslation(null);
                    setError(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      { color: d === selectedDialect ? C.text : C.textSub },
                      d === selectedDialect && styles.dropdownItemTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Dialect note */}
      <View style={[styles.dialectNote, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="information-circle-outline" size={16} color={C.orange} />
        <Text style={[styles.dialectNoteText, { color: C.textSub }]}>
          {DIALECT_NOTES[selectedDialect]}
        </Text>
      </View>

      {/* Main layout */}
      <View style={[styles.columns, !isWide && styles.columnsStack]}>
        {/* Input panel */}
        <View style={[styles.inputPanel, !isWide && styles.colFull]}>
          <Text style={[styles.panelLabel, { color: C.textMuted }]}>
            INPUT ({selectedDialect.toUpperCase()})
          </Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: C.surface, borderColor: C.border, color: C.text },
            ]}
            placeholder={`Enter text in ${selectedDialect}...`}
            placeholderTextColor={C.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.translateBtn,
              { backgroundColor: C.orangeBtn },
              (!inputText.trim() || loading) && styles.btnDisabled,
            ]}
            onPress={handleTranslate}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="language" size={17} color="#FFF" />
                <Text style={styles.translateBtnText}>Translate to English</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Result panel */}
        <View
          style={[
            styles.resultPanel,
            { backgroundColor: C.surface, borderColor: C.border },
            !isWide && styles.colFull,
          ]}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={C.orange} size="large" />
              <Text style={[styles.loadingText, { color: C.textSub }]}>
                Translating…{'\n'}
                <Text style={[styles.loadingHint, { color: C.textMuted }]}>
                  Model may take 20–30 s to warm up
                </Text>
              </Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={36} color={C.error} />
              <Text style={[styles.errorTitle, { color: C.error }]}>Translation Error</Text>
              <Text style={[styles.errorMsg, { color: C.textSub }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryBtn, { borderColor: C.border }]}
                onPress={handleTranslate}
              >
                <Text style={[styles.retryText, { color: C.orange }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : translation !== null ? (
            <View style={styles.translationResult}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={20} color={C.success} />
                <Text style={[styles.resultTitle, { color: C.text }]}>English Translation</Text>
              </View>
              <Text style={[styles.translationText, { color: C.text }]}>{translation}</Text>

              {/* Dialect note section */}
              <View style={[styles.etymologyBox, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                <Text style={[styles.etymologyLabel, { color: C.orange }]}>
                  DIALECT ORIGIN
                </Text>
                <Text style={[styles.etymologyText, { color: C.textSub }]}>
                  {DIALECT_NOTES[selectedDialect]}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.center}>
              <View style={[styles.awaitingIcon, { backgroundColor: C.surfaceAlt }]}>
                <Ionicons name="flask-outline" size={36} color={C.textMuted} />
              </View>
              <Text style={[styles.awaitingTitle, { color: C.textSub }]}>Awaiting Input</Text>
              <Text style={[styles.awaitingSub, { color: C.textMuted }]}>
                ENTER HERITAGE TEXT TO ACTIVATE THE AGENT
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40, gap: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5 },
  sourceLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  dropdownWrapper: { position: 'relative', minWidth: 180 },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  dropdownBtnText: { fontSize: 14, fontWeight: '600' },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 10,
    zIndex: 30,
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11 },
  dropdownItemText: { fontSize: 14 },
  dropdownItemTextActive: { fontWeight: '600' },
  dialectNote: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  dialectNoteText: { flex: 1, fontSize: 13, lineHeight: 20 },
  columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  columnsStack: { flexDirection: 'column' },
  colFull: { flex: undefined, width: '100%' },
  inputPanel: { flex: 1.2, gap: 12 },
  panelLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  textArea: {
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    minHeight: 220,
    borderWidth: 1,
    lineHeight: 24,
  },
  translateBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnDisabled: { opacity: 0.45 },
  translateBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  resultPanel: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 320,
    overflow: 'hidden',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 28 },
  loadingText: { fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 24 },
  loadingHint: { fontSize: 12, fontWeight: '400' },
  errorTitle: { fontSize: 16, fontWeight: '700' },
  errorMsg: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  retryText: { fontSize: 14, fontWeight: '600' },
  awaitingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  awaitingTitle: { fontSize: 16, fontWeight: '600' },
  awaitingSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  translationResult: { padding: 20, gap: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultTitle: { fontSize: 16, fontWeight: 'bold' },
  translationText: { fontSize: 16, lineHeight: 26, fontWeight: '400' },
  etymologyBox: { borderRadius: 10, padding: 14, gap: 8, borderWidth: 1 },
  etymologyLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  etymologyText: { fontSize: 13, lineHeight: 20 },
});
