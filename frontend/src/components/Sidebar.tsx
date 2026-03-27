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
import { fonts } from '../theme/fonts';

export type AppScreen = 'home' | 'dialects' | 'vault' | 'guide' | 'record' | 'moderation' | 'admin' | 'profile';

interface SidebarProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  user: { id: string; email: string; role?: string } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

type NavItem = {
  id: AppScreen;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  minRole?: 'moderator' | 'admin'; // undefined = visible to all
};

const NAV_ITEMS: NavItem[] = [
  { id: 'home',       label: 'Home',           icon: 'home-outline',      iconActive: 'home' },
  { id: 'dialects',   label: 'Dialects',        icon: 'language-outline',  iconActive: 'language' },
  { id: 'vault',      label: 'Heritage Vault',  icon: 'library-outline',   iconActive: 'library' },
  { id: 'guide',      label: 'Cultural Guide',  icon: 'compass-outline',   iconActive: 'compass' },
  { id: 'moderation', label: 'Moderation',      icon: 'shield-outline',    iconActive: 'shield',    minRole: 'moderator' },
  { id: 'admin',      label: 'Admin Panel',     icon: 'settings-outline',  iconActive: 'settings',  minRole: 'admin' },
];

const roleRank = (role?: string) => {
  if (role === 'admin') return 3;
  if (role === 'moderator') return 2;
  return 1;
};

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate, user, onSignIn, onSignOut }) => {
  const { colors: C, isDark, toggle } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  const displayName = user?.email?.split('@')[0] || 'Sign In';
  const userRank = roleRank(user?.role);
  const visibleNav = NAV_ITEMS.filter(item =>
    !item.minRole || userRank >= roleRank(item.minRole)
  );

  return (
    <View
      style={[
        styles.sidebar,
        !isWide && styles.sidebarNarrow,
        { backgroundColor: C.sidebar },
      ]}
    >
      {/* Logo */}
      <View style={[styles.logoRow, !isWide && styles.logoRowCenter]}>
        <View style={[styles.logoIcon, { backgroundColor: C.surfaceAlt }]}>
          <Ionicons name="flame" size={20} color={C.orange} />
        </View>
        {isWide && (
          <View>
            <Text style={[styles.logoText, { color: C.text, fontFamily: fonts.epilogue.bold }]}>
              Heritage AI
            </Text>
            <Text style={[styles.logoSub, { color: C.orange, fontFamily: fonts.manrope.bold }]}>
              DIGITAL ARCHIVE
            </Text>
          </View>
        )}
      </View>

      {/* Nav items */}
      <View style={styles.nav}>
        {visibleNav.map((item) => {
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
                    {
                      color: isActive ? C.text : C.textSub,
                      fontFamily: isActive ? fonts.manrope.semibold : fonts.manrope.regular,
                    },
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
          <Text style={[styles.sectionLabel, { color: C.textMuted, fontFamily: fonts.manrope.bold }]}>
            CONTRIBUTE
          </Text>
        )}
        <TouchableOpacity
          style={[styles.recordBtn, { backgroundColor: C.orange }, !isWide && styles.recordBtnNarrow]}
          onPress={() => onNavigate('record')}
        >
          <Ionicons name="add-circle" size={17} color="#FFF" />
          {isWide && (
            <Text style={[styles.recordBtnText, { fontFamily: fonts.manrope.bold }]}>
              Record Story
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      {/* Dark / Light mode toggle */}
      {isWide ? (
        <TouchableOpacity style={styles.modeToggle} onPress={toggle}>
          <View
            style={[
              styles.modeTogglePill,
              { backgroundColor: C.surfaceAlt },
            ]}
          >
            <Text style={[styles.modeToggleLabel, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={13} color={C.textSub} />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.modeToggleNarrow} onPress={toggle}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={17} color={C.textSub} />
        </TouchableOpacity>
      )}

      {/* User profile / sign-in */}
      <TouchableOpacity
        style={[
          styles.profile,
          !isWide && styles.profileCenter,
          { backgroundColor: C.surfaceAlt },
        ]}
        onPress={user ? () => onNavigate('profile') : onSignIn}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.profileAvatar,
            {
              backgroundColor: user ? C.orange : C.surfaceContainerLow,
            },
          ]}
        >
          <Ionicons name="person" size={15} color={user ? '#FFF' : C.textSub} />
        </View>
        {isWide && (
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: C.text, fontFamily: fonts.manrope.semibold }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.profileRole, { color: user ? C.orange : C.textMuted, fontFamily: fonts.manrope.bold }]}>
              {user
                ? user.role
                  ? user.role.toUpperCase()
                  : 'MEMBER'
                : 'TAP TO SIGN IN'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 180,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 14,
  },
  sidebarNarrow: {
    width: 68,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingLeft: 4,
  },
  logoRowCenter: {
    paddingLeft: 0,
    justifyContent: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
  },
  logoSub: {
    fontSize: 9,
    letterSpacing: 1.3,
  },
  nav: {
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navItemCenter: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: '100%',
  },
  navLabel: {
    fontSize: 14,
  },
  navLabelActive: {},
  contribute: {
    marginTop: 28,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    paddingLeft: 12,
    marginBottom: 4,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  recordBtnNarrow: {
    paddingHorizontal: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  recordBtnText: {
    color: '#FFF',
    fontSize: 13,
  },
  modeToggle: {
    marginBottom: 12,
  },
  modeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeToggleLabel: {
    fontSize: 11,
    flex: 1,
  },
  modeToggleNarrow: {
    marginBottom: 12,
    padding: 10,
    alignItems: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  profileCenter: {
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  profileRole: {
    fontSize: 9,
    letterSpacing: 0.6,
    marginTop: 1,
  },
});
