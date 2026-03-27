import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';

export type AppScreen = 'home' | 'dialects' | 'vault' | 'guide' | 'record' | 'moderation' | 'admin' | 'profile';

interface BottomNavBarProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  user: { id: string; email: string; role?: string } | null;
}

type NavItem = {
  id: AppScreen;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { id: 'vault', label: 'Vault', icon: 'library-outline', iconActive: 'library' },
  { id: 'record', label: 'Record', icon: 'mic-outline', iconActive: 'mic' },
  { id: 'guide', label: 'Guide', icon: 'compass-outline', iconActive: 'compass' },
  { id: 'dialects', label: 'Translate', icon: 'language-outline', iconActive: 'language' },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeScreen,
  onNavigate,
  user,
}) => {
  const { colors: C, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const renderNavItem = (item: NavItem) => {
    const isActive = activeScreen === item.id;
    const isRecordButton = item.id === 'record';

    if (isRecordButton) {
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.recordButtonContainer}
          onPress={() => onNavigate(item.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recordButton}
          >
            <Ionicons name="mic" size={26} color="#FFFFFF" />
          </LinearGradient>
          <Text
            style={[
              styles.recordLabel,
              { color: C.orange, fontFamily: fonts.manrope.semibold },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.navItem}
        onPress={() => onNavigate(item.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.navIconContainer,
            isActive && { backgroundColor: C.orangeGlow },
          ]}
        >
          <Ionicons
            name={isActive ? item.iconActive : item.icon}
            size={22}
            color={isActive ? C.orange : C.textMuted}
          />
        </View>
        <Text
          style={[
            styles.navLabel,
            {
              color: isActive ? C.orange : C.textMuted,
              fontFamily: isActive ? fonts.manrope.semibold : fonts.manrope.regular,
            },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const navContent = (
    <View style={[styles.navContent, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {NAV_ITEMS.map(renderNavItem)}
    </View>
  );

  // Use BlurView on iOS for glassmorphism, fallback to solid on Android
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.blurContainer, { borderColor: C.glassBorder }]}
        >
          {navContent}
        </BlurView>
      </View>
    );
  }

  // Android fallback
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.solidContainer,
          {
            backgroundColor: C.glass,
            borderColor: C.glassBorder,
          },
        ]}
      >
        {navContent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurContainer: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  solidContainer: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  navIconContainer: {
    width: 44,
    height: 32,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  recordButtonContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: -28,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});
