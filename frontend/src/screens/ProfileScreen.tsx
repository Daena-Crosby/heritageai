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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getMyStories, updateMyProfile, Story, ModerationStatus } from '../services/api';
import { getMyProfile } from '../services/auth';

interface ProfileScreenProps {
  userId: string;
  userEmail?: string;
  onSignOut: () => void;
  onStorySelect: (id: string) => void;
}

type Role = 'user' | 'moderator' | 'admin';

const ROLE_COLOR: Record<Role, string> = {
  user:      '#4A9EF5',
  moderator: '#A855F7',
  admin:     '#F5A623',
};

const ROLE_LABEL: Record<Role, string> = {
  user:      'Member',
  moderator: 'Moderator',
  admin:     'Administrator',
};

const STATUS_COLOR: Record<ModerationStatus, string> = {
  approved: '#27AE60',
  pending:  '#F5A623',
  rejected: '#C0392B',
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
    year: 'numeric', month: 'long', day: 'numeric',
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
}) => {
  const { colors: C } = useTheme();

  const [profile, setProfile]   = useState<any>(null);
  const [stories, setStories]   = useState<Story[]>([]);
  const [loading, setLoading]   = useState(true);

  // Edit state
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
  const roleColor   = ROLE_COLOR[role] ?? C.orange;
  const emailFallback = userEmail ? userEmail.split('@')[0] : 'Archivist';
  const displayName = profile?.display_name || emailFallback;
  const avatarText  = initials(displayName) || '?';
  const createdAt   = profile?.created_at;

  const approvedCount = stories.filter(s => s.moderation_status === 'approved').length;
  const pendingCount  = stories.filter(s => s.moderation_status === 'pending').length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Avatar & name ── */}
      <View style={[styles.heroCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.avatar, { backgroundColor: roleColor + '22', borderColor: roleColor }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{avatarText}</Text>
        </View>

        {editing ? (
          <View style={styles.editFields}>
            <TextInput
              style={[styles.nameInput, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Display name"
              placeholderTextColor={C.textMuted}
              maxLength={50}
            />
            <TextInput
              style={[styles.bioInput, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              value={draftBio}
              onChangeText={setDraftBio}
              placeholder="Write a short bio..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <Text style={[styles.editBtnText, { color: C.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: C.orange }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={[styles.editBtnText, { color: '#FFF' }]}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: C.text }]}>{displayName}</Text>
              <TouchableOpacity
                style={[styles.editIconBtn, { backgroundColor: C.surfaceAlt }]}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="pencil-outline" size={14} color={C.textSub} />
              </TouchableOpacity>
            </View>

            <View style={[styles.roleBadge, { backgroundColor: roleColor + '22' }]}>
              <Ionicons name="shield-checkmark-outline" size={12} color={roleColor} />
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                {ROLE_LABEL[role]}
              </Text>
            </View>

            {profile?.bio ? (
              <Text style={[styles.bio, { color: C.textSub }]}>{profile.bio}</Text>
            ) : (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={[styles.bioPlaceholder, { color: C.textMuted }]}>
                  + Add a bio
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── Membership stats ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="calendar-outline" size={18} color={C.orange} />
          <Text style={[styles.statValue, { color: C.text }]}>
            {createdAt ? formatDate(createdAt) : '—'}
          </Text>
          <Text style={[styles.statLabel, { color: C.textMuted }]}>Member Since</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="time-outline" size={18} color={C.orange} />
          <Text style={[styles.statValue, { color: C.text }]}>
            {createdAt ? memberDuration(createdAt) : '—'}
          </Text>
          <Text style={[styles.statLabel, { color: C.textMuted }]}>Time as Archivist</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="library-outline" size={18} color={C.orange} />
          <Text style={[styles.statValue, { color: C.text }]}>{approvedCount}</Text>
          <Text style={[styles.statLabel, { color: C.textMuted }]}>Stories Live</Text>
        </View>
      </View>

      {/* ── My Stories ── */}
      <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>My Stories</Text>
          {pendingCount > 0 && (
            <View style={[styles.pendingBadge, { backgroundColor: '#F5A62322' }]}>
              <Text style={[styles.pendingBadgeText, { color: '#F5A623' }]}>
                {pendingCount} pending
              </Text>
            </View>
          )}
        </View>

        {stories.length === 0 ? (
          <View style={styles.emptyStories}>
            <Ionicons name="mic-outline" size={32} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              No stories uploaded yet.
            </Text>
          </View>
        ) : (
          stories.map(story => {
            const status = (story.moderation_status ?? 'pending') as ModerationStatus;
            const statusColor = STATUS_COLOR[status] ?? C.textMuted;
            return (
              <TouchableOpacity
                key={story.id}
                style={[styles.storyRow, { borderTopColor: C.border }]}
                onPress={() => status === 'approved' ? onStorySelect(story.id) : undefined}
                activeOpacity={status === 'approved' ? 0.7 : 1}
              >
                <View style={styles.storyRowLeft}>
                  <View style={[styles.storyIcon, { backgroundColor: C.surfaceAlt }]}>
                    <Ionicons
                      name={status === 'approved' ? 'book-outline' : status === 'pending' ? 'time-outline' : 'close-circle-outline'}
                      size={15}
                      color={statusColor}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storyTitle, { color: C.text }]} numberOfLines={1}>
                      {story.title}
                    </Text>
                    <Text style={[styles.storyDate, { color: C.textMuted }]}>
                      {story.created_at ? formatDate(story.created_at) : ''}
                      {story.theme ? `  ·  ${story.theme}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
                  <Text style={[styles.statusPillText, { color: statusColor }]}>
                    {status.toUpperCase()}
                  </Text>
                </View>
                {status === 'rejected' && story.moderation_note && (
                  <View style={[styles.rejectionNote, { backgroundColor: '#C0392B11', borderColor: '#C0392B33' }]}>
                    <Ionicons name="information-circle-outline" size={13} color="#C0392B" />
                    <Text style={[styles.rejectionNoteText, { color: '#C0392B' }]}>
                      {story.moderation_note}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ── Sign out ── */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: C.border }]}
        onPress={onSignOut}
      >
        <Ionicons name="log-out-outline" size={17} color="#C0392B" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 18, paddingBottom: 48, gap: 14 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero card
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700' },
  heroInfo:   { alignItems: 'center', gap: 8, width: '100%' },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName:{ fontSize: 22, fontWeight: 'bold' },
  editIconBtn: { padding: 6, borderRadius: 8 },
  roleBadge:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  bio:           { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  bioPlaceholder:{ fontSize: 13, textDecorationLine: 'underline' },

  // Edit mode
  editFields:  { width: '100%', gap: 10 },
  nameInput:   { borderRadius: 10, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, fontSize: 15 },
  bioInput:    { borderRadius: 10, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, minHeight: 80 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  editBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  editBtnText: { fontSize: 13, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox:  {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 5,
  },
  statValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },

  // Stories section
  section: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  sectionTitle:    { fontSize: 15, fontWeight: '700' },
  pendingBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingBadgeText:{ fontSize: 11, fontWeight: '700' },
  emptyStories:    { alignItems: 'center', gap: 8, padding: 28 },
  emptyText:       { fontSize: 13 },
  storyRow: {
    borderTopWidth: 1,
    padding: 14,
    gap: 8,
  },
  storyRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyIcon:    { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  storyTitle:   { fontSize: 14, fontWeight: '600' },
  storyDate:    { fontSize: 11, marginTop: 2 },
  statusPill:   { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  rejectionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  rejectionNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: { color: '#C0392B', fontSize: 15, fontWeight: '700' },
});
