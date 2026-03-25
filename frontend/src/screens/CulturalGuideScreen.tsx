import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
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
    'Greetings! I am your Heritage AI guide. Ask me anything about cultural traditions, linguistic roots, or the secret history of world dialects. How can I assist you today?',
};

export const CulturalGuideScreen: React.FC = () => {
  const { colors: C } = useTheme();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for the API (exclude the initial AI greeting from history)
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>Heritage AI Guide</Text>
          <Text style={[styles.subtitle, { color: C.textSub }]}>
            CONVERSATIONAL ANTHROPOLOGY EXPERTISE
          </Text>
        </View>
        <View style={styles.activeUsers}>
          {[C.orange, '#4A9EF5', '#A855F7'].map((color, i) => (
            <View
              key={i}
              style={[styles.avatarDot, { backgroundColor: color, marginLeft: i === 0 ? 0 : -8 }]}
            />
          ))}
          <Text style={[styles.activeCount, { color: C.textSub }]}>+1k</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}
          >
            {msg.role === 'ai' && (
              <View
                style={[styles.aiAvatar, { backgroundColor: C.surface, borderColor: C.border }]}
              >
                <Ionicons name="leaf" size={15} color={C.orange} />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                msg.role === 'user'
                  ? [styles.bubbleUser, { backgroundColor: C.activeNav }]
                  : [styles.bubbleAi, { backgroundColor: C.surface, borderColor: C.border }],
              ]}
            >
              <Text style={[styles.bubbleText, { color: C.text }]}>{msg.content}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.msgRow}>
            <View style={[styles.aiAvatar, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Ionicons name="leaf" size={15} color={C.orange} />
            </View>
            <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble, { backgroundColor: C.surface, borderColor: C.border }]}>
              <ActivityIndicator size="small" color={C.textSub} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputRow, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        <TextInput
          style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
          placeholder="Ask about cultural history, Patois origins, or African heritage..."
          placeholderTextColor={C.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: C.orange },
            (!input.trim() || loading) && styles.sendBtnDisabled,
          ]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={17} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 3 },
  subtitle: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },
  activeUsers: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  activeCount: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  messages: { flex: 1 },
  messagesContent: { padding: 18, gap: 14, paddingBottom: 6 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  msgRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  bubble: { maxWidth: '78%', borderRadius: 14, padding: 13 },
  bubbleAi: { borderWidth: 1, borderTopLeftRadius: 4 },
  bubbleUser: { borderTopRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  typingBubble: { paddingHorizontal: 16, paddingVertical: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
});
