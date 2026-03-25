import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { login, register } from '../services/auth';

interface AuthScreenProps {
  onAuthSuccess: (user: { id: string; email: string }) => void;
  onSkip: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onSkip }) => {
  const { colors: C } = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(email.trim(), password);
        onAuthSuccess(user);
      } else {
        await register(email.trim(), password, displayName.trim() || undefined);
        setSuccessMsg('Account created! Please verify your email, then sign in.');
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={[styles.logoIcon, { backgroundColor: C.surfaceAlt }]}>
            <Ionicons name="flame" size={28} color={C.orange} />
          </View>
          <Text style={[styles.logoText, { color: C.text }]}>Heritage AI</Text>
          <Text style={[styles.logoSub, { color: C.orange }]}>DIGITAL ARCHIVE</Text>
        </View>

        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={[styles.tabs, { borderBottomColor: C.border }]}>
            {(['login', 'register'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && { borderBottomColor: C.orange }]}
                onPress={() => { setMode(m); setError(null); setSuccessMsg(null); }}
              >
                <Text style={[styles.tabText, { color: mode === m ? C.orange : C.textSub }, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'register' && (
            <View style={[styles.inputWrapper, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
              <Ionicons name="person-outline" size={16} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="Display name (optional)"
                placeholderTextColor={C.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={[styles.inputWrapper, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
            <Ionicons name="mail-outline" size={16} color={C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: C.text }]}
              placeholder="Email address"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: C.text }]}
              placeholder="Password (min. 8 characters)"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && (
            <View style={[styles.msgBox, { backgroundColor: `${C.error}15` }]}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={[styles.msgText, { color: C.error }]}>{error}</Text>
            </View>
          )}
          {successMsg && (
            <View style={[styles.msgBox, { backgroundColor: `${C.success}15` }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color={C.success} />
              <Text style={[styles.msgText, { color: C.success }]}>{successMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: C.orange }, loading && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={[styles.skipText, { color: C.textSub }]}>
            Continue as guest — browse stories
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20 },
  logoArea: { alignItems: 'center', gap: 6 },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: { fontSize: 26, fontWeight: 'bold' },
  logoSub: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  card: { borderRadius: 16, padding: 22, borderWidth: 1, gap: 12 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 4 },
  tab: {
    flex: 1,
    paddingBottom: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabText: { fontSize: 14 },
  tabTextActive: { fontWeight: '700' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 13,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, paddingVertical: 13 },
  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, padding: 10 },
  msgText: { fontSize: 13, flex: 1 },
  submitBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 2 },
  disabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontSize: 13, textDecorationLine: 'underline' },
});
