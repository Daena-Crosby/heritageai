import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import {
  getAdminUsers,
  getAdminStats,
  updateUserRole,
  deleteAdminUser,
  AdminUser,
  AdminStats,
} from '../services/api';

type Tab = 'stats' | 'users';
type Role = 'user' | 'moderator' | 'admin';

interface AdminScreenProps {
  currentUserId: string;
}

const ROLE_COLORS: Record<Role, string> = {
  user:      '#4A9EF5',
  moderator: '#A855F7',
  admin:     '#F5A623',
};

const ROLE_CYCLE: Role[] = ['user', 'moderator', 'admin'];

export const AdminScreen: React.FC<AdminScreenProps> = ({ currentUserId }) => {
  const { colors: C } = useTheme();
  const [tab, setTab] = useState<Tab>('stats');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([getAdminUsers(), getAdminStats()]);
      setUsers(u);
      setStats(s);
    } catch {
      Alert.alert('Error', 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = (user: AdminUser) => {
    if (user.id === currentUserId) {
      Alert.alert('Not allowed', 'You cannot change your own role.');
      return;
    }
    const nextRole = ROLE_CYCLE[(ROLE_CYCLE.indexOf(user.role as Role) + 1) % 3];
    Alert.alert(
      'Change Role',
      `Change ${user.display_name ?? 'this user'}'s role from ${user.role} to ${nextRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateUserRole(user.id, nextRole);
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: nextRole } : u));
            } catch {
              Alert.alert('Error', 'Could not update role.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (user: AdminUser) => {
    if (user.id === currentUserId) {
      Alert.alert('Not allowed', 'You cannot delete your own account from here.');
      return;
    }
    Alert.alert(
      'Remove User',
      `Permanently remove ${user.display_name ?? 'this user'} and all their data?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminUser(user.id);
              setUsers(prev => prev.filter(u => u.id !== user.id));
              if (stats) setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
            } catch {
              Alert.alert('Error', 'Could not remove user.');
            }
          },
        },
      ]
    );
  };

  const StatCard: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string }> =
    ({ icon, label, value, color }) => (
      <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.statValue, { color: C.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: C.textMuted }]}>{label}</Text>
      </View>
    );

  const renderUser = ({ item }: { item: AdminUser }) => {
    const role = (item.role ?? 'user') as Role;
    const color = ROLE_COLORS[role] ?? C.textSub;
    const isSelf = item.id === currentUserId;
    return (
      <View style={[styles.userCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.userAvatar, { backgroundColor: color + '22' }]}>
          <Ionicons name="person" size={16} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: C.text }]} numberOfLines={1}>
            {item.display_name ?? 'Unnamed User'}
            {isSelf && <Text style={{ color: C.orange }}> (you)</Text>}
          </Text>
          <Text style={[styles.userJoined, { color: C.textMuted }]}>
            Joined {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.rolePill, { backgroundColor: color + '22' }]}
          onPress={() => handleRoleChange(item)}
          disabled={isSelf}
        >
          <Text style={[styles.rolePillText, { color }]}>{role.toUpperCase()}</Text>
          {!isSelf && <Ionicons name="chevron-forward" size={11} color={color} />}
        </TouchableOpacity>
        {!isSelf && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteUser(item)}
          >
            <Ionicons name="trash-outline" size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>Admin Panel</Text>
          <Text style={[styles.subtitle, { color: C.textSub }]}>Platform management & oversight</Text>
        </View>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={C.textSub} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: C.border }]}>
        {([
          { id: 'stats' as Tab, label: 'Platform Stats', icon: 'bar-chart-outline' as const },
          { id: 'users' as Tab, label: 'Users',          icon: 'people-outline' as const },
        ]).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && { borderBottomColor: C.orange }]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons name={t.icon} size={15} color={tab === t.id ? C.orange : C.textSub} />
            <Text style={[styles.tabText, { color: tab === t.id ? C.orange : C.textSub },
              tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.orange} size="large" />
        </View>
      ) : tab === 'stats' ? (
        <ScrollView contentContainerStyle={styles.statsContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <StatCard icon="people-outline"        label="Total Users"       value={stats?.totalUsers ?? 0}          color="#4A9EF5" />
            <StatCard icon="library-outline"       label="Total Stories"     value={stats?.totalStories ?? 0}        color={C.orange} />
            <StatCard icon="time-outline"          label="Pending Review"    value={stats?.pendingStories ?? 0}      color="#F5A623" />
            <StatCard icon="flag-outline"          label="Flagged Comments"  value={stats?.flaggedComments ?? 0}     color="#C0392B" />
            <StatCard icon="cog-outline"           label="Active Jobs"       value={stats?.activeProcessingJobs ?? 0} color="#A855F7" />
          </View>

          <View style={[styles.infoCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.infoTitle, { color: C.text }]}>Role Permissions</Text>
            {([
              { role: 'USER',      color: '#4A9EF5', perms: 'Upload stories (pending approval), view vault, use translator & guide, manage own profile.' },
              { role: 'MODERATOR', color: '#A855F7', perms: 'All user permissions + approve/reject stories, manage flagged comments, view moderation queue.' },
              { role: 'ADMIN',     color: '#F5A623', perms: 'All moderator permissions + user management, role assignment, platform stats, audit log.' },
            ]).map(({ role, color, perms }) => (
              <View key={role} style={[styles.permRow, { borderTopColor: C.border }]}>
                <View style={[styles.permBadge, { backgroundColor: color + '22' }]}>
                  <Text style={[styles.permBadgeText, { color }]}>{role}</Text>
                </View>
                <Text style={[styles.permText, { color: C.textSub }]}>{perms}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>No users found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 13 },
  refreshBtn: { padding: 8 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13 },
  tabTextActive: { fontWeight: '700' },
  statsContent: { padding: 16, gap: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: 130,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center', letterSpacing: 0.5 },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  infoTitle: { fontSize: 15, fontWeight: '700' },
  permRow: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  permBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  permBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  permText: { fontSize: 13, lineHeight: 20 },
  list: { padding: 16, gap: 10 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { fontSize: 14, fontWeight: '600' },
  userJoined: { fontSize: 11, marginTop: 2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rolePillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  deleteBtn: { padding: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15 },
});
