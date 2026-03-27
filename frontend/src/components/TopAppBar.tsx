import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius } from '../theme/colors';

interface TopAppBarProps {
  onProfilePress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  title?: string;
  user?: { id: string; email: string } | null;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onProfilePress,
  onSearchPress,
  onNotificationPress,
  showBackButton = false,
  onBackPress,
  title,
  user,
}) => {
  const { colors: C, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: C.bg,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left side - Profile button */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: C.surfaceContainer }]}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={C.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: user ? C.orangeGlow : C.surfaceContainer },
              ]}
              onPress={onProfilePress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={user ? 'person' : 'person-outline'}
                size={20}
                color={user ? C.orange : C.text}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Logo or Title */}
        <View style={styles.centerSection}>
          {title ? (
            <Text
              style={[
                styles.title,
                { color: C.text, fontFamily: fonts.manrope.semibold },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : (
            <View style={styles.logoContainer}>
              <Ionicons name="flame" size={20} color={C.orange} />
              <Text
                style={[
                  styles.logoText,
                  { color: C.text, fontFamily: fonts.epilogue.bold },
                ]}
              >
                Heritage
              </Text>
              <Text
                style={[
                  styles.logoTextItalic,
                  { color: C.orange, fontFamily: fonts.epilogue.semibold },
                ]}
              >
                AI
              </Text>
            </View>
          )}
        </View>

        {/* Right side */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: C.surfaceContainer }]}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color={C.textSub} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: C.surfaceContainer }]}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={C.textSub} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: C.surfaceContainer }]}
            onPress={toggle}
            activeOpacity={0.7}
          >
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={C.textSub} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoText: {
    fontSize: 18,
    letterSpacing: -0.5,
  },
  logoTextItalic: {
    fontSize: 18,
    fontStyle: 'italic',
    marginLeft: -2,
  },
  title: {
    fontSize: 16,
  },
});
