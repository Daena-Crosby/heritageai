import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Epilogue_400Regular,
  Epilogue_500Medium,
  Epilogue_600SemiBold,
  Epilogue_700Bold,
  Epilogue_800ExtraBold,
} from '@expo-google-fonts/epilogue';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { BottomNavBar, AppScreen } from './src/components/BottomNavBar';
import { TopAppBar } from './src/components/TopAppBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { DialectsScreen } from './src/screens/DialectsScreen';
import { HeritageVaultScreen } from './src/screens/HeritageVaultScreen';
import { CulturalGuideScreen } from './src/screens/CulturalGuideScreen';
import { RecordingScreen } from './src/screens/RecordingScreen';
import { StoryViewScreen } from './src/screens/StoryViewScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ModerationScreen } from './src/screens/ModerationScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { getAccessToken, attachAuthInterceptor, getMyProfile, logout } from './src/services/auth';

const SCREEN_TITLES: Record<AppScreen, string | null> = {
  home: null, // Shows logo
  dialects: 'Dialect Translator',
  vault: 'Heritage Vault',
  guide: 'Cultural Guide',
  record: 'Record Story',
  moderation: 'Moderation',
  admin: 'Admin Panel',
  profile: 'My Profile',
};

// Inner component — can safely call useTheme() since it sits inside ThemeProvider
function AppContent() {
  const { colors: C, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; role: 'user' | 'moderator' | 'admin' } | null>(null);
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
        setUser({
          id: profile.id,
          email: profile.display_name || profile.email || profile.id,
          role: profile.role ?? 'user',
        });
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
          setActiveScreen('home');
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
      case 'moderation':
        return <ModerationScreen />;
      case 'admin':
        return <AdminScreen currentUserId={user?.id ?? ''} />;
      case 'profile':
        return (
          <ProfileScreen
            userId={user?.id ?? ''}
            userEmail={user?.email}
            onSignOut={handleSignOut}
            onStorySelect={setSelectedStoryId}
            onNavigate={handleNavigate}
          />
        );
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
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Top App Bar */}
      <TopAppBar
        title={SCREEN_TITLES[activeScreen] ?? undefined}
        onProfilePress={() => {
          if (user) {
            handleNavigate('profile');
          } else {
            handleSignIn();
          }
        }}
        onSearchPress={handleSearch}
        onNotificationPress={handleNotifications}
        showBackButton={!!selectedStoryId}
        onBackPress={() => setSelectedStoryId(null)}
        user={user}
      />

      {/* Screen content */}
      <KeyboardAvoidingView
        style={styles.screenArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 60}
      >
        {renderContent()}
      </KeyboardAvoidingView>

      {/* Bottom Navigation Bar */}
      {!selectedStoryId && (
        <BottomNavBar
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          user={user}
        />
      )}
    </View>
  );
}

export default function App() {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Epilogue_400Regular,
    Epilogue_500Medium,
    Epilogue_600SemiBold,
    Epilogue_700Bold,
    Epilogue_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0603' }}>
        <ActivityIndicator size="large" color="#FF6B2C" />
      </View>
    );
  }

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
  screenArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
