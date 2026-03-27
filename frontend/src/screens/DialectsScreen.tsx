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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { translateDialect } from '../services/api';

const DIALECTS = [
  { id: 'Jamaican Patois', icon: '🇯🇲' },
  { id: 'Trinidadian Slang', icon: '🇹🇹' },
  { id: 'Nigerian Pidgin', icon: '🇳🇬' },
  { id: 'Louisiana Creole', icon: '🇺🇸' },
  { id: 'Haitian Kreyòl', icon: '🇭🇹' },
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

  const selectedDialectData = DIALECTS.find(d => d.id === selectedDialect);

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
          Dialect Translator
        </Text>
        <Text style={[styles.subtitle, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
          Translate cultural dialects to English with AI
        </Text>
      </View>

      {/* Dialect Selector */}
      <View style={[styles.dialectSelector, { backgroundColor: C.surfaceContainer }]}>
        <Text style={[styles.selectorLabel, { color: C.textMuted, fontFamily: fonts.manrope.bold }]}>
          SOURCE DIALECT
        </Text>
        <View style={styles.dialectPills}>
          {DIALECTS.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.dialectPill,
                selectedDialect === d.id
                  ? { backgroundColor: C.orange }
                  : { backgroundColor: C.surfaceContainerHigh },
              ]}
              onPress={() => {
                setSelectedDialect(d.id);
                setTranslation(null);
                setError(null);
              }}
            >
              <Text style={styles.dialectEmoji}>{d.icon}</Text>
              <Text
                style={[
                  styles.dialectPillText,
                  {
                    color: selectedDialect === d.id ? '#FFF' : C.textSub,
                    fontFamily: selectedDialect === d.id ? fonts.manrope.semibold : fonts.manrope.regular,
                  },
                ]}
                numberOfLines={1}
              >
                {d.id.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dialect Info Card */}
      <View style={[styles.infoCard, { backgroundColor: C.surfaceContainer }]}>
        <View style={[styles.infoAccent, { backgroundColor: C.orange }]} />
        <View style={styles.infoContent}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={18} color={C.orange} />
            <Text style={[styles.infoTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
              About {selectedDialect}
            </Text>
          </View>
          <Text style={[styles.infoText, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
            {DIALECT_NOTES[selectedDialect]}
          </Text>
        </View>
      </View>

      {/* Input Section */}
      <View style={[styles.inputSection, { backgroundColor: C.surfaceContainer }]}>
        <Text style={[styles.inputLabel, { color: C.textMuted, fontFamily: fonts.manrope.bold }]}>
          ENTER TEXT IN {selectedDialect.toUpperCase()}
        </Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: C.surfaceContainerHigh, color: C.text, fontFamily: fonts.manrope.regular }]}
          placeholder={`Type or paste ${selectedDialect} text here...`}
          placeholderTextColor={C.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          onPress={handleTranslate}
          disabled={!inputText.trim() || loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={!inputText.trim() || loading ? [C.textMuted, C.textMuted] : gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.translateBtn, (!inputText.trim() || loading) && styles.btnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="language" size={20} color="#FFF" />
                <Text style={[styles.translateBtnText, { fontFamily: fonts.manrope.bold }]}>
                  Translate to English
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Result Section */}
      <View style={[styles.resultSection, { backgroundColor: C.surfaceContainer }]}>
        {loading ? (
          <View style={styles.resultCenter}>
            <ActivityIndicator color={C.orange} size="large" />
            <Text style={[styles.loadingText, { color: C.textSub, fontFamily: fonts.manrope.medium }]}>
              Translating...
            </Text>
            <Text style={[styles.loadingHint, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
              AI model may take 20-30s to warm up
            </Text>
          </View>
        ) : error ? (
          <View style={styles.resultCenter}>
            <View style={[styles.errorIcon, { backgroundColor: `${C.error}20` }]}>
              <Ionicons name="alert-circle" size={32} color={C.error} />
            </View>
            <Text style={[styles.errorTitle, { color: C.error, fontFamily: fonts.manrope.semibold }]}>
              Translation Error
            </Text>
            <Text style={[styles.errorMsg, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: C.surfaceContainerHigh }]}
              onPress={handleTranslate}
            >
              <Ionicons name="refresh" size={16} color={C.orange} />
              <Text style={[styles.retryText, { color: C.orange, fontFamily: fonts.manrope.semibold }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : translation !== null ? (
          <View style={styles.translationResult}>
            <View style={styles.resultHeader}>
              <View style={[styles.successIcon, { backgroundColor: `${C.success}20` }]}>
                <Ionicons name="checkmark-circle" size={24} color={C.success} />
              </View>
              <Text style={[styles.resultTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                English Translation
              </Text>
            </View>
            <Text style={[styles.translationText, { color: C.text, fontFamily: fonts.manrope.regular }]}>
              {translation}
            </Text>
          </View>
        ) : (
          <View style={styles.resultCenter}>
            <View style={[styles.awaitingIcon, { backgroundColor: C.surfaceContainerHigh }]}>
              <Ionicons name="sparkles" size={32} color={C.textMuted} />
            </View>
            <Text style={[styles.awaitingTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
              Ready to Translate
            </Text>
            <Text style={[styles.awaitingSub, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
              Enter text above to see the AI translation
            </Text>
          </View>
        )}
      </View>

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
  // Dialect Selector
  dialectSelector: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  selectorLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  dialectPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dialectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  dialectEmoji: {
    fontSize: 16,
  },
  dialectPillText: {
    fontSize: 13,
  },
  // Info Card
  infoCard: {
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  infoAccent: {
    width: 4,
  },
  infoContent: {
    flex: 1,
    padding: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Input Section
  inputSection: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  textArea: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 150,
    marginBottom: spacing.lg,
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  translateBtnText: {
    color: '#FFF',
    fontSize: 15,
  },
  // Result Section
  resultSection: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 200,
  },
  resultCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    marginTop: spacing.sm,
  },
  loadingHint: {
    fontSize: 13,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
  },
  errorMsg: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  retryText: {
    fontSize: 14,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  awaitingIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  awaitingTitle: {
    fontSize: 18,
  },
  awaitingSub: {
    fontSize: 14,
    textAlign: 'center',
  },
  translationResult: {
    gap: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultTitle: {
    fontSize: 16,
  },
  translationText: {
    fontSize: 16,
    lineHeight: 26,
  },
});
