import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import {
  getModerationQueue,
  approveStory,
  rejectStory,
  getFlaggedComments,
  deleteModerationComment,
  dismissCommentFlag,
  Story,
} from '../services/api';

type Tab = 'queue' | 'comments';

export const ModerationScreen: React.FC = () => {
  const { colors: C } = useTheme();
  const [tab, setTab] = useState<Tab>('queue');
  const [queue, setQueue] = useState<Story[]>([]);
  const [flaggedComments, setFlaggedComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([getModerationQueue(), getFlaggedComments()]);
      setQueue(q);
      setFlaggedComments(c);
    } catch {
      Alert.alert('Error', 'Failed to load moderation data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string, title: string) => {
    try {
      await approveStory(id);
      setQueue(prev => prev.filter(s => s.id !== id));
      Alert.alert('Approved', `"${title}" is now live in the vault.`);
    } catch {
      Alert.alert('Error', 'Could not approve story.');
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) {
      Alert.alert('Note required', 'Please enter a reason for rejection.');
      return;
    }
    try {
      await rejectStory(id, rejectNote.trim());
      setQueue(prev => prev.filter(s => s.id !== id));
      setRejectingId(null);
      setRejectNote('');
      Alert.alert('Rejected', 'Story has been rejected and the author notified.');
    } catch {
      Alert.alert('Error', 'Could not reject story.');
    }
  };

  const handleDeleteComment = (id: string) => {
    Alert.alert('Delete Comment', 'Permanently delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteModerationComment(id);
            setFlaggedComments(prev => prev.filter(c => c.id !== id));
          } catch {
            Alert.alert('Error', 'Could not delete comment.');
          }
        },
      },
    ]);
  };

  const handleDismissFlag = async (id: string) => {
    try {
      await dismissCommentFlag(id);
      setFlaggedComments(prev => prev.filter(c => c.id !== id));
    } catch {
      Alert.alert('Error', 'Could not dismiss flag.');
    }
  };

  const renderStory = ({ item }: { item: Story }) => {
    const isRejecting = rejectingId === item.id;
    return (
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              {item.country && (
                <Text style={[styles.metaChip, { color: C.textMuted, backgroundColor: C.surfaceAlt }]}>
                  {item.country}
                </Text>
              )}
              {item.theme && (
                <Text style={[styles.metaChip, { color: C.textMuted, backgroundColor: C.surfaceAlt }]}>
                  {item.theme}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#F5A623' + '22' }]}>
            <Text style={[styles.statusText, { color: '#F5A623' }]}>PENDING</Text>
          </View>
        </View>

        {isRejecting ? (
          <View style={styles.rejectBox}>
            <TextInput
              style={[styles.rejectInput, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              placeholder="Reason for rejection (required)..."
              placeholderTextColor={C.textMuted}
              value={rejectNote}
              onChangeText={setRejectNote}
              multiline
            />
            <View style={styles.rejectActions}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                onPress={() => { setRejectingId(null); setRejectNote(''); }}
              >
                <Text style={[styles.btnText, { color: C.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#C0392B' }]}
                onPress={() => handleReject(item.id)}
              >
                <Text style={[styles.btnText, { color: '#FFF' }]}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
              onPress={() => setRejectingId(item.id)}
            >
              <Ionicons name="close-circle-outline" size={15} color="#C0392B" />
              <Text style={[styles.btnText, { color: '#C0392B' }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.orange }]}
              onPress={() => handleApprove(item.id, item.title)}
            >
              <Ionicons name="checkmark-circle-outline" size={15} color="#FFF" />
              <Text style={[styles.btnText, { color: '#FFF' }]}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={[styles.commentStory, { color: C.orange }]} numberOfLines={1}>
        {item.stories?.title ?? 'Unknown story'}
      </Text>
      <Text style={[styles.commentAuthor, { color: C.textMuted }]}>
        {item.commenter?.display_name ?? 'Anonymous'}
      </Text>
      <Text style={[styles.commentBody, { color: C.text }]}>{item.content}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
          onPress={() => handleDismissFlag(item.id)}
        >
          <Text style={[styles.btnText, { color: C.textSub }]}>Dismiss Flag</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#C0392B' }]}
          onPress={() => handleDeleteComment(item.id)}
        >
          <Ionicons name="trash-outline" size={14} color="#FFF" />
          <Text style={[styles.btnText, { color: '#FFF' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>Moderation</Text>
          <Text style={[styles.subtitle, { color: C.textSub }]}>Review content before it goes live</Text>
        </View>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={C.textSub} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: C.border }]}>
        {([
          { id: 'queue' as Tab,    label: 'Story Queue',       count: queue.length },
          { id: 'comments' as Tab, label: 'Flagged Comments',  count: flaggedComments.length },
        ]).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && { borderBottomColor: C.orange }]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, { color: tab === t.id ? C.orange : C.textSub },
              tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: C.orange }]}>
                <Text style={styles.tabBadgeText}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.orange} size="large" />
        </View>
      ) : tab === 'queue' ? (
        queue.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>All caught up!</Text>
            <Text style={[styles.emptySub, { color: C.textMuted }]}>No stories pending review.</Text>
          </View>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={s => s.id}
            renderItem={renderStory}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        flaggedComments.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubble-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>No flagged comments.</Text>
          </View>
        ) : (
          <FlatList
            data={flaggedComments}
            keyExtractor={c => c.id}
            renderItem={renderComment}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
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
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnText: { fontSize: 13, fontWeight: '600' },
  rejectBox: { gap: 10 },
  rejectInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
    minHeight: 70,
  },
  rejectActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  commentStory: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  commentAuthor: { fontSize: 12 },
  commentBody: { fontSize: 14, lineHeight: 21 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13 },
});
