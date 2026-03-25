import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export type AppScreen = 'home' | 'dialects' | 'vault' | 'guide' | 'record';

interface SidebarProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  user: { id: string; email: string } | null;
}

const NAV_ITEMS: {
  id: AppScreen;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { id: 'dialects', label: 'Dialects', icon: 'language-outline', iconActive: 'language' },
  { id: 'vault', label: 'Heritage Vault', icon: 'library-outline', iconActive: 'library' },
  { id: 'guide', label: 'Cultural Guide', icon: 'compass-outline', iconActive: 'compass' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate, user }) => {
  const { colors: C, isDark, toggle } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  const displayName = user?.email?.split('@')[0] || 'Archivist';

  return (
    <View
      style={[
        styles.sidebar,
        !isWide && styles.sidebarNarrow,
        { backgroundColor: C.sidebar, borderRightColor: C.border },
      ]}
    >
      {/* Logo */}
      <View style={[styles.logoRow, !isWide && styles.logoRowCenter]}>
        <View style={[styles.logoIcon, { backgroundColor: isDark ? '#1E1508' : '#FFF3DC' }]}>
          <Ionicons name="flame" size={18} color={C.orange} />
        </View>
        {isWide && (
          <View>
            <Text style={[styles.logoText, { color: C.text }]}>Heritage AI</Text>
            <Text style={[styles.logoSub, { color: C.orange }]}>DIGITAL ARCHIVE</Text>
          </View>
        )}
      </View>

      {/* Nav items */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                !isWide && styles.navItemCenter,
                isActive && { backgroundColor: C.activeNav },
              ]}
              onPress={() => onNavigate(item.id)}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={19}
                color={isActive ? C.orange : C.textSub}
              />
              {isWide && (
                <Text
                  style={[
                    styles.navLabel,
                    { color: isActive ? C.text : C.textSub },
                    isActive && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contribute */}
      <View style={styles.contribute}>
        {isWide && (
          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>CONTRIBUTE</Text>
        )}
        <TouchableOpacity
          style={[styles.recordBtn, { backgroundColor: C.orange }, !isWide && styles.recordBtnNarrow]}
          onPress={() => onNavigate('record')}
        >
          <Ionicons name="add-circle" size={17} color="#FFF" />
          {isWide && <Text style={styles.recordBtnText}>Record Story</Text>}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      {/* Dark / Light mode toggle */}
      {isWide ? (
        <TouchableOpacity style={styles.modeToggle} onPress={toggle}>
          <View
            style={[
              styles.modeTogglePill,
              { backgroundColor: C.surfaceAlt, borderColor: C.border },
            ]}
          >
            <Text style={[styles.modeToggleLabel, { color: C.textSub }]}>
              {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
            </Text>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={13} color={C.textSub} />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.modeToggleNarrow} onPress={toggle}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={17} color={C.textSub} />
        </TouchableOpacity>
      )}

      {/* User profile */}
      <View
        style={[
          styles.profile,
          !isWide && styles.profileCenter,
          { borderTopColor: C.border },
        ]}
      >
        <View style={[styles.profileAvatar, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
          <Ionicons name="person" size={15} color={C.textSub} />
        </View>
        {isWide && (
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: C.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.profileRole, { color: C.textMuted }]}>VERIFIED MEMBER</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 175,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 12,
    borderRightWidth: 1,
  },
  sidebarNarrow: {
    width: 62,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    paddingLeft: 4,
  },
  logoRowCenter: {
    paddingLeft: 0,
    justifyContent: 'center',
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoSub: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  nav: {
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navItemCenter: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: '100%',
  },
  navLabel: {
    fontSize: 14,
  },
  navLabelActive: {
    fontWeight: '600',
  },
  contribute: {
    marginTop: 24,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingLeft: 10,
    marginBottom: 2,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  recordBtnNarrow: {
    paddingHorizontal: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  recordBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modeToggle: {
    marginBottom: 10,
  },
  modeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
  },
  modeToggleLabel: {
    fontSize: 10,
    flex: 1,
  },
  modeToggleNarrow: {
    marginBottom: 10,
    padding: 8,
    alignItems: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  profileCenter: {
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  profileName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  profileRole: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
