import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { StoryViewScreen } from './src/screens/StoryViewScreen';
import { RecordingScreen } from './src/screens/RecordingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { getAccessToken, attachAuthInterceptor, getMyProfile } from './src/services/auth';

const Stack = createStackNavigator();

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Attach token interceptors once at startup
    attachAuthInterceptor();
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const profile = await getMyProfile();
        setUser({ id: profile.id, email: profile.display_name || profile.id });
      }
    } catch {
      // Token expired or invalid — clear silently, user stays as guest
    } finally {
      setAuthChecked(true);
    }
  };

  if (!authChecked) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  if (showAuth && !user) {
    return (
      <AuthScreen
        onAuthSuccess={(u) => {
          setUser(u);
          setShowAuth(false);
        }}
        onSkip={() => setShowAuth(false)}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home">
          {(props) => (
            <HomeScreen
              {...props}
              user={user}
              onLoginPress={() => setShowAuth(true)}
              onLogout={() => setUser(null)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="StoryView" component={StoryViewScreen} />
        <Stack.Screen name="Recording" component={RecordingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
});
