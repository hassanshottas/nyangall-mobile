import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Logo } from '@/components/Logo';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import api from '@/services/api';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';

type Conversation = {
  id: string;
  listing: { id: string; title: string; photos: { url: string }[] };
  buyer: { id: string; fullName: string; avatarUrl?: string; isVerified?: boolean };
  seller: { id: string; fullName: string; avatarUrl?: string; isVerified?: boolean };
  messages: { content: string | null; imageUrl: string | null; createdAt: string }[];
  updatedAt: string;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { headerPT } = useResponsive();
  const styles = getStyles(colors);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data.conversations);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const onRefresh = () => { setRefreshing(true); fetchConversations(); };

  const getOtherPerson = (conv: Conversation) => {
    return user?.id === conv.buyer.id ? conv.seller : conv.buyer;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerPT }]}>
        <Logo size="header" showTagline={false} />
        <Text style={styles.headerTitle}>{t('messages')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const other = getOtherPerson(item);
            const lastMsg = item.messages[0];
            return (
              <TouchableOpacity style={styles.convCard} onPress={() => router.push(`/conversation/${item.id}`)}>
                <View style={styles.avatar}>
                  {other.avatarUrl
                    ? <Image source={{ uri: other.avatarUrl }} style={styles.avatarImg} accessibilityLabel={`Photo de profil de ${other.fullName}`} />
                    : <Text style={styles.avatarLetter}>{other.fullName[0].toUpperCase()}</Text>
                  }
                </View>
                <View style={styles.convBody}>
                  <View style={styles.convRow}>
                    <View style={styles.convNameRow}>
                      <Text style={styles.convName} numberOfLines={1}>{other.fullName}</Text>
                      {other.isVerified && <VerifiedBadge size={14} />}
                    </View>
                    {item.updatedAt && <Text style={styles.convDate}>{formatDate(item.updatedAt)}</Text>}
                  </View>
                  <Text style={styles.convListing} numberOfLines={1}>{item.listing.title}</Text>
                  {lastMsg && (
                    <Text style={styles.convLastMsg} numberOfLines={1}>
                      {lastMsg.imageUrl ? `📷 ${t('photo')}` : lastMsg.content}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.border} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>{t('noConversations')}</Text>
              <Text style={styles.emptyText}>{t('noConversationsDesc')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', gap: 4, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary },
  convCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: 48, height: 48 },
  avatarLetter: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  convBody: { flex: 1 },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  convName: { fontSize: FontSize.md, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  convDate: { fontSize: 11, color: colors.textSecondary },
  convListing: { fontSize: FontSize.xs, color: colors.primary, fontWeight: '600', marginTop: 1 },
  convLastMsg: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: colors.textSecondary, textAlign: 'center' },
});
