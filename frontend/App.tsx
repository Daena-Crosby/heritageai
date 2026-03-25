import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { Sidebar, AppScreen } from './src/components/Sidebar';
import { HomeScreen } from './src/screens/HomeScreen';
import { DialectsScreen } from './src/screens/DialectsScreen';
import { HeritageVaultScreen } from './src/screens/HeritageVaultScreen';
import { CulturalGuideScreen } from './src/screens/CulturalGuideScreen';
import { RecordingScreen } from './src/screens/RecordingScreen';
import { StoryViewScreen } from './src/screens/StoryViewScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { getAccessToken, attachAuthInterceptor, getMyProfile, logout } from './src/services/auth';

const SCREEN_LABELS: Record<AppScreen, string> = {
  home: 'HOME NAVIGATOR',
  dialects: 'TRANSLATE NAVIGATOR',
  vault: 'LIBRARY NAVIGATOR',
  guide: 'GUIDE NAVIGATOR',
  record: 'CONTRIBUTE NAVIGATOR',
};

// Inner component — can safely call useTheme() since it sits inside ThemeProvider
function AppContent() {
  const { colors: C, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeScreen, setActiveScreen] = useState<AppScreen>('home');
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  useEffect(() => {
    attachAuthInterceptor();
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const profile = await getMyProfile();
        setUser({ id: profile.id, email: profile.display_name || profile.email || profile.id });
      }
    } catch {
      // Expired / invalid — stay as guest
    } finally {
      setAuthChecked(true);
    }
  };

  const handleNavigate = (screen: AppScreen) => {
    setSelectedStoryId(null);
    setActiveScreen(screen);
  };

  const handleSignIn = () => setShowAuth(true);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          setUser(null);
        },
      },
    ]);
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'You have no new notifications.');
  };

  const handleSearch = () => {
    setSelectedStoryId(null);
    setActiveScreen('vault');
  };

  const renderContent = () => {
    if (selectedStoryId) {
      return (
        <StoryViewScreen storyId={selectedStoryId} onBack={() => setSelectedStoryId(null)} />
      );
    }
    switch (activeScreen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} onStorySelect={setSelectedStoryId} />;
      case 'dialects':
        return <DialectsScreen />;
      case 'vault':
        return <HeritageVaultScreen onStorySelect={setSelectedStoryId} />;
      case 'guide':
        return <CulturalGuideScreen />;
      case 'record':
        return <RecordingScreen onBack={() => handleNavigate('home')} />;
    }
  };

  // ── Splash ─────────────────────────────────────────
  if (!authChecked) {
    return (
      <View style={[styles.splash, { backgroundColor: C.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
        <View style={[styles.splashLogo, { backgroundColor: isDark ? '#1E1508' : '#FFF3DC' }]}>
          <Ionicons name="flame" size={36} color={C.orange} />
        </View>
        <ActivityIndicator color={C.orange} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ── Auth modal ────────────────────────────────────
  if (showAuth && !user) {
    return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
        <AuthScreen
          onAuthSuccess={(u) => { setUser(u); setShowAuth(false); }}
          onSkip={() => setShowAuth(false)}
        />
      </>
    );
  }

  // ── Main layout ───────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.sidebar} />
      <View style={styles.layout}>
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />

        <View style={styles.main}>
          {/* Top bar */}
          <View style={[styles.topBar, { backgroundColor: C.sidebar, borderBottomColor: C.border }]}>
            <Text style={[styles.topBarLabel, { color: C.textMuted }]}>
              {SCREEN_LABELS[activeScreen]}
            </Text>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.topBarIcon} onPress={handleNotifications}>
                <Ionicons name="notifications-outline" size={18} color={C.textSub} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBarIcon} onPress={handleSearch}>
                <Ionicons name="search-outline" size={18} color={C.textSub} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Screen content — KAV here uses the real safe-area inset so the
              keyboard offset is exact on every iPhone model */}
          <KeyboardAvoidingView
            style={styles.screenArea}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.top + 52}
          >
            {renderContent()}
          </KeyboardAvoidingView>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  topBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
