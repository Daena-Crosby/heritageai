import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/fonts';
import { spacing, borderRadius, gradients } from '../theme/colors';
import { getMyStories, updateMyProfile, Story, ModerationStatus } from '../services/api';
import { getMyProfile } from '../services/auth';
import { AppScreen } from '../components/BottomNavBar';

interface ProfileScreenProps {
  userId: string;
  userEmail?: string;
  onSignOut: () => void;
  onStorySelect: (id: string) => void;
  onNavigate?: (screen: AppScreen) => void;
}

type Role = 'user' | 'moderator' | 'admin';

const ROLE_CONFIG: Record<Role, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  user:      { color: '#4A9EF5', label: 'Member', icon: 'person' },
  moderator: { color: '#A855F7', label: 'Moderator', icon: 'shield-checkmark' },
  admin:     { color: '#F5A623', label: 'Administrator', icon: 'star' },
};

const STATUS_CONFIG: Record<ModerationStatus, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  approved: { color: '#27AE60', icon: 'checkmark-circle' },
  pending:  { color: '#F5A623', icon: 'time' },
  rejected: { color: '#C0392B', icon: 'close-circle' },
};

function memberDuration(createdAt: string): string {
  const ms    = Date.now() - new Date(createdAt).getTime();
  const days  = Math.floor(ms / 86_400_000);
  if (days < 1)   return 'Today';
  if (days < 30)  return `${days} day${days !== 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userId,
  userEmail,
  onSignOut,
  onStorySelect,
  onNavigate,
}) => {
  const { colors: C } = useTheme();

  const [profile, setProfile]   = useState<any>(null);
  const [stories, setStories]   = useState<Story[]>([]);
  const [loading, setLoading]   = useState(true);

  const [editing, setEditing]         = useState(false);
  const [draftName, setDraftName]     = useState('');
  const [draftBio, setDraftBio]       = useState('');
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getMyProfile(), getMyStories()]);
      setProfile(p);
      setStories(s);
      setDraftName(p.display_name ?? '');
      setDraftBio(p.bio ?? '');
    } catch {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        display_name: draftName.trim() || undefined,
        bio:          draftBio.trim()  || undefined,
      });
      setProfile((prev: any) => ({ ...prev, ...updated }));
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftName(profile?.display_name ?? '');
    setDraftBio(profile?.bio ?? '');
    setEditing(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator color={C.orange} size="large" />
      </View>
    );
  }

  const role        = (profile?.role ?? 'user') as Role;
  const roleConfig  = ROLE_CONFIG[role];
  const emailFallback = userEmail ? userEmail.split('@')[0] : 'Archivist';
  const displayName = profile?.display_name || emailFallback;
  const avatarText  = initials(displayName) || '?';
  const createdAt   = profile?.created_at;

  const approvedCount = stories.filter(s => s.moderation_status === 'approved').length;
  const pendingCount  = stories.filter(s => s.moderation_status === 'pending').length;
  const totalHours    = Math.round(stories.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 3600 * 10) / 10;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Profile Header Card */}
      <View style={[styles.profileCard, { backgroundColor: C.surfaceContainer }]}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.avatarGradient}
          >
            <View style={[styles.avatar, { backgroundColor: C.surfaceContainer }]}>
              <Text style={[styles.avatarText, { color: C.orange, fontFamily: fonts.epilogue.bold }]}>
                {avatarText}
              </Text>
            </View>
          </LinearGradient>
          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.color }]}>
            <Ionicons name={roleConfig.icon} size={12} color="#FFF" />
          </View>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              style={[styles.nameInput, { backgroundColor: C.surfaceContainerHigh, color: C.text, fontFamily: fonts.manrope.medium }]}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Display name"
              placeholderTextColor={C.textMuted}
              maxLength={50}
            />
            <TextInput
              style={[styles.bioInput, { backgroundColor: C.surfaceContainerHigh, color: C.text, fontFamily: fonts.manrope.regular }]}
              value={draftBio}
              onChangeText={setDraftBio}
              placeholder="Write a short bio..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: C.surfaceContainerHigh }]}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <Text style={[styles.editBtnText, { color: C.textSub, fontFamily: fonts.manrope.semibold }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.saveBtn}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={[styles.saveBtnText, { fontFamily: fonts.manrope.semibold }]}>
                      Save
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: C.text, fontFamily: fonts.epilogue.bold }]}>
                {displayName}
              </Text>
              <TouchableOpacity
                style={[styles.editIconBtn, { backgroundColor: C.surfaceContainerHigh }]}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="pencil" size={14} color={C.textSub} />
              </TouchableOpacity>
            </View>

            <View style={[styles.roleTag, { backgroundColor: `${roleConfig.color}20` }]}>
              <Ionicons name={roleConfig.icon} size={14} color={roleConfig.color} />
              <Text style={[styles.roleTagText, { color: roleConfig.color, fontFamily: fonts.manrope.semibold }]}>
                {roleConfig.label}
              </Text>
            </View>

            {profile?.bio ? (
              <Text style={[styles.bio, { color: C.textSub, fontFamily: fonts.manrope.regular }]}>
                {profile.bio}
              </Text>
            ) : (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={[styles.bioPlaceholder, { color: C.orange, fontFamily: fonts.manrope.medium }]}>
                  + Add a bio
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Stats Boxes */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: C.surfaceContainer }]}>
          <Ionicons name="book" size={24} color={C.orange} />
          <Text style={[styles.statNumber, { color: C.text, fontFamily: fonts.epilogue.bold }]}>
            {approvedCount}
          </Text>
          <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
            Stories Preserved
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: C.surfaceContainer }]}>
          <Ionicons name="time" size={24} color={C.orange} />
          <Text style={[styles.statNumber, { color: C.text, fontFamily: fonts.epilogue.bold }]}>
            {totalHours}h
          </Text>
          <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: fonts.manrope.medium }]}>
            Hours Recorded
          </Text>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={[styles.section, { backgroundColor: C.surfaceContainer }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
            Recent Activities
          </Text>
          {pendingCount > 0 && (
            <View style={[styles.pendingBadge, { backgroundColor: '#F5A62320' }]}>
              <Text style={[styles.pendingBadgeText, { color: '#F5A623', fontFamily: fonts.manrope.bold }]}>
                {pendingCount} pending
              </Text>
            </View>
          )}
        </View>

        {stories.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: C.surfaceContainerHigh }]}>
              <Ionicons name="mic-outline" size={32} color={C.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
              No stories yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
              Start preserving your heritage
            </Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {stories.slice(0, 5).map((story) => {
              const status = (story.moderation_status ?? 'pending') as ModerationStatus;
              const statusConfig = STATUS_CONFIG[status];
              return (
                <TouchableOpacity
                  key={story.id}
                  style={styles.activityItem}
                  onPress={() => status === 'approved' ? onStorySelect(story.id) : undefined}
                  activeOpacity={status === 'approved' ? 0.7 : 1}
                >
                  <View style={[styles.activityIcon, { backgroundColor: `${statusConfig.color}20` }]}>
                    <Ionicons name={statusConfig.icon} size={18} color={statusConfig.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]} numberOfLines={1}>
                      {story.title}
                    </Text>
                    <Text style={[styles.activityMeta, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                      {story.created_at ? formatDate(story.created_at) : ''}
                      {story.theme ? ` · ${story.theme}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: `${statusConfig.color}15` }]}>
                    <Text style={[styles.statusPillText, { color: statusConfig.color, fontFamily: fonts.manrope.semibold }]}>
                      {status}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Quick Access Card - The Vault */}
      <TouchableOpacity
        style={[styles.vaultCard, { backgroundColor: C.surfaceContainer }]}
        activeOpacity={0.8}
      >
        <View style={styles.vaultContent}>
          <View style={[styles.vaultIcon, { backgroundColor: C.orangeGlow }]}>
            <Ionicons name="library" size={28} color={C.orange} />
          </View>
          <View style={styles.vaultText}>
            <Text style={[styles.vaultTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
              The Vault
            </Text>
            <Text style={[styles.vaultSubtitle, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
              {approvedCount} stories preserved
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
      </TouchableOpacity>

      {/* Storage Indicator */}
      <View style={[styles.storageCard, { backgroundColor: C.surfaceContainer }]}>
        <View style={styles.storageHeader}>
          <Text style={[styles.storageTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
            Storage Used
          </Text>
          <Text style={[styles.storagePercent, { color: C.orange, fontFamily: fonts.manrope.bold }]}>
            12%
          </Text>
        </View>
        <View style={[styles.storageBar, { backgroundColor: C.surfaceContainerHigh }]}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.storageBarFill, { width: '12%' }]}
          />
        </View>
        <Text style={[styles.storageText, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
          120 MB of 1 GB used
        </Text>
      </View>

      {/* Member Since */}
      {createdAt && (
        <View style={[styles.memberCard, { backgroundColor: C.surfaceContainer }]}>
          <Ionicons name="calendar-outline" size={20} color={C.textMuted} />
          <Text style={[styles.memberText, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
            Member since {formatDate(createdAt)} ({memberDuration(createdAt)})
          </Text>
        </View>
      )}

      {/* Admin Tools - Only show for moderators and admins */}
      {(role === 'moderator' || role === 'admin') && onNavigate && (
        <View style={[styles.adminSection, { backgroundColor: C.surfaceContainer }]}>
          <View style={styles.adminHeader}>
            <Ionicons name="shield" size={20} color={C.orange} />
            <Text style={[styles.adminTitle, { color: C.text, fontFamily: fonts.epilogue.semibold }]}>
              Admin Tools
            </Text>
          </View>

          {/* Moderation - visible to moderators and admins */}
          <TouchableOpacity
            style={styles.adminItem}
            onPress={() => onNavigate('moderation')}
            activeOpacity={0.7}
          >
            <View style={[styles.adminItemIcon, { backgroundColor: '#A855F720' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#A855F7" />
            </View>
            <View style={styles.adminItemContent}>
              <Text style={[styles.adminItemTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                Moderation Queue
              </Text>
              <Text style={[styles.adminItemDesc, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                Review and approve pending stories
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
          </TouchableOpacity>

          {/* Admin Panel - only visible to admins */}
          {role === 'admin' && (
            <TouchableOpacity
              style={styles.adminItem}
              onPress={() => onNavigate('admin')}
              activeOpacity={0.7}
            >
              <View style={[styles.adminItemIcon, { backgroundColor: '#F5A62320' }]}>
                <Ionicons name="settings" size={20} color="#F5A623" />
              </View>
              <View style={styles.adminItemContent}>
                <Text style={[styles.adminItemTitle, { color: C.text, fontFamily: fonts.manrope.semibold }]}>
                  Admin Panel
                </Text>
                <Text style={[styles.adminItemDesc, { color: C.textMuted, fontFamily: fonts.manrope.regular }]}>
                  Manage users, settings, and system
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[styles.signOutBtn, { backgroundColor: C.surfaceContainer }]}
        onPress={onSignOut}
      >
        <Ionicons name="log-out-outline" size={20} color="#C0392B" />
        <Text style={[styles.signOutText, { fontFamily: fonts.manrope.semibold }]}>
          Sign Out
        </Text>
      </TouchableOpacity>

      {/* Bottom spacing for nav bar */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile Card
  profileCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4,
  },
  avatar: {
    flex: 1,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1A120C',
  },
  profileInfo: {
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  displayName: {
    fontSize: 26,
  },
  editIconBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleTagText: {
    fontSize: 13,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bioPlaceholder: {
    fontSize: 14,
    marginTop: spacing.sm,
  },
  // Edit Form
  editForm: {
    width: '100%',
    gap: spacing.md,
  },
  nameInput: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  bioInput: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  editBtnText: {
    fontSize: 14,
  },
  saveBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  saveBtnText: {
    fontSize: 14,
    color: '#FFF',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statNumber: {
    fontSize: 28,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Section
  section: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
  },
  pendingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pendingBadgeText: {
    fontSize: 11,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  // Activity List
  activityList: {
    paddingBottom: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusPillText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  // Vault Card
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  vaultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  vaultIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultText: {},
  vaultTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  vaultSubtitle: {
    fontSize: 13,
  },
  // Storage Card
  storageCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  storageTitle: {
    fontSize: 15,
  },
  storagePercent: {
    fontSize: 15,
  },
  storageBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageText: {
    fontSize: 12,
  },
  // Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  memberText: {
    fontSize: 13,
  },
  // Admin Section
  adminSection: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  adminTitle: {
    fontSize: 18,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  adminItemIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminItemContent: {
    flex: 1,
  },
  adminItemTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  adminItemDesc: {
    fontSize: 12,
  },
  // Sign Out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
  },
  signOutText: {
    color: '#C0392B',
    fontSize: 15,
  },
});
