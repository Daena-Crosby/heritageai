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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { login, register, AuthUser } from '../services/auth';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.logoGradient}
          >
            <View style={[styles.logoInner, { backgroundColor: C.bg }]}>
              <Ionicons name="flame" size={36} color={C.orange} />
            </View>
          </LinearGradient>
          <Text style={[styles.logoText, { color: C.text, fontFamily: fonts.epilogue.bold }]}>
            Heritage AI
          </Text>
          <Text style={[styles.logoSub, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
            Preserve your cultural legacy
          </Text>
        </View>

        {/* Auth Card */}
        <View style={[styles.card, { backgroundColor: C.surfaceContainer }]}>
          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: C.surfaceContainerHigh }]}>
            {(['login', 'register'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.tab,
                  mode === m && { backgroundColor: C.orange },
                ]}
                onPress={() => {
                  setMode(m);
                  setError(null);
                  setSuccessMsg(null);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: mode === m ? '#FFF' : C.textSub,
                      fontFamily: mode === m ? fonts.manrope.semibold : fonts.manrope.regular,
                    },
                  ]}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Display Name (Register only) */}
          {mode === 'register' && (
            <View style={[styles.inputWrapper, { backgroundColor: C.surfaceContainerHigh }]}>
              <Ionicons name="person-outline" size={18} color={C.textMuted} />
              <TextInput
                style={[styles.input, { color: C.text, fontFamily: fonts.manrope.regular }]}
                placeholder="Display name (optional)"
                placeholderTextColor={C.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email */}
          <View style={[styles.inputWrapper, { backgroundColor: C.surfaceContainerHigh }]}>
            <Ionicons name="mail-outline" size={18} color={C.textMuted} />
            <TextInput
              style={[styles.input, { color: C.text, fontFamily: fonts.manrope.regular }]}
              placeholder="Email address"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrapper, { backgroundColor: C.surfaceContainerHigh }]}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} />
            <TextInput
              style={[styles.input, { color: C.text, fontFamily: fonts.manrope.regular }]}
              placeholder="Password (min. 8 characters)"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Error/Success Messages */}
          {error && (
            <View style={[styles.msgBox, { backgroundColor: `${C.error}15` }]}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={[styles.msgText, { color: C.error, fontFamily: fonts.manrope.medium }]}>
                {error}
              </Text>
            </View>
          )}
          {successMsg && (
            <View style={[styles.msgBox, { backgroundColor: `${C.success}15` }]}>
              <Ionicons name="checkmark-circle" size={18} color={C.success} />
              <Text style={[styles.msgText, { color: C.success, fontFamily: fonts.manrope.medium }]}>
                {successMsg}
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={loading ? [C.textMuted, C.textMuted] : gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, loading && styles.disabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[styles.submitBtnText, { fontFamily: fonts.manrope.bold }]}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={[styles.skipText, { color: C.textSub, fontFamily: fonts.manrope.medium }]}>
            Continue as guest
          </Text>
          <Ionicons name="arrow-forward" size={16} color={C.textSub} />
        </TouchableOpacity>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: 'mic', text: 'Record stories' },
            { icon: 'language', text: 'Translate dialects' },
            { icon: 'sparkles', text: 'AI-powered' },
          ].map((feature, index) => (
            <View key={index} style={[styles.featureItem, { backgroundColor: C.surfaceContainer }]}>
              <Ionicons name={feature.icon as any} size={20} color={C.orange} />
              <Text style={[styles.featureText, { color: C.textSub, fontFamily: fonts.manrope.medium }]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  // Logo
  logoArea: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    padding: 4,
    marginBottom: spacing.md,
  },
  logoInner: {
    flex: 1,
    borderRadius: borderRadius.xl - 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
  },
  logoSub: {
    fontSize: 15,
  },
  // Card
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabText: {
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing.lg,
  },
  msgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  msgText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  submitBtn: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
  },
  // Skip
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: 14,
  },
  // Features
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  featureText: {
    fontSize: 13,
  },
});
