import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { getCulturalGuide } from '../services/api';

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'ai',
  content:
    'Welcome! I\'m your Heritage AI guide. Ask me anything about Jamaican cultural traditions, Patois origins, African heritage, or the history of Caribbean dialects. How can I help you today?',
};

const SUGGESTED_PROMPTS = [
  'What are the origins of Jamaican Patois?',
  'Tell me about Anansi stories',
  'What is the history of Reggae music?',
  'Explain Jamaican food traditions',
];

export const CulturalGuideScreen: React.FC = () => {
  const { colors: C } = useTheme();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: messageText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const history = updatedMessages
        .filter((m) => !(m.id === '0' && m.role === 'ai'))
        .map((m) => ({
          role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
          content: m.content,
        }));

      const { reply } = await getCulturalGuide(history);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errText =
        err?.response?.data?.error || err?.message || 'The guide is unavailable. Please try again.';
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: errText.toLowerCase().includes('warming up')
          ? 'The AI model is warming up — please wait 20–30 seconds and try again.'
          : `Sorry, I couldn't respond right now. ${errText}`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const showSuggestions = messages.length === 1;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}
          >
            {msg.role === 'ai' && (
              <View style={[styles.aiAvatar, { backgroundColor: C.orangeGlow }]}>
                <Ionicons name="sparkles" size={16} color={C.orange} />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                msg.role === 'user'
                  ? [styles.bubbleUser, { backgroundColor: C.orange }]
                  : [styles.bubbleAi, { backgroundColor: C.surfaceContainer }],
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  {
                    color: msg.role === 'user' ? '#FFF' : C.text,
                    fontFamily: fonts.manrope.regular,
                  },
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Suggested Prompts */}
        {showSuggestions && (
          <View style={styles.suggestionsSection}>
            <Text style={[styles.suggestionsLabel, { color: C.textMuted, fontFamily: fonts.manrope.semibold }]}>
              SUGGESTIONS
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionChip, { backgroundColor: C.surfaceContainer }]}
                  onPress={() => sendMessage(prompt)}
                >
                  <Text style={[styles.suggestionText, { color: C.text, fontFamily: fonts.manrope.medium }]}>
                    {prompt}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.msgRow}>
            <View style={[styles.aiAvatar, { backgroundColor: C.orangeGlow }]}>
              <Ionicons name="sparkles" size={16} color={C.orange} />
            </View>
            <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble, { backgroundColor: C.surfaceContainer }]}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, { backgroundColor: C.textMuted }]} />
                <View style={[styles.typingDot, { backgroundColor: C.textMuted }]} />
                <View style={[styles.typingDot, { backgroundColor: C.textMuted }]} />
              </View>
            </View>
          </View>
        )}

        {/* Bottom spacing for nav bar */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: C.surfaceContainer }]}>
        <View style={[styles.inputRow, { backgroundColor: C.surfaceContainerHigh }]}>
          <TextInput
            style={[styles.input, { color: C.text, fontFamily: fonts.manrope.regular }]}
            placeholder="Ask about heritage, culture, traditions..."
            placeholderTextColor={C.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={!input.trim() || loading ? [C.textMuted, C.textMuted] : gradients.primary}
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            >
              <Ionicons name="send" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={[styles.disclaimer, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
          AI responses may not always be accurate. Verify important information.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  msgRowUser: {
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  bubbleAi: {
    borderTopLeftRadius: spacing.xs,
  },
  bubbleUser: {
    borderTopRightRadius: spacing.xs,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 24,
  },
  typingBubble: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
  },
  // Suggestions
  suggestionsSection: {
    marginTop: spacing.md,
  },
  suggestionsLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: 48,
  },
  suggestions: {
    gap: spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  // Input
  inputContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + 80,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
