import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Platform, RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import api from '@/services/api';

type Report = {
  id: string;
  reason: 'SCAM' | 'INAPPROPRIATE' | 'FAKE_LISTING' | 'HARASSMENT' | 'OTHER';
  details: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporter: { id: string; fullName: string; phone: string };
  reportedUser: { id: string; fullName: string; phone: string; isBanned: boolean } | null;
  listing: { id: string; title: string; status: string } | null;
};

const REASON_KEY: Record<Report['reason'], any> = {
  SCAM: 'adminReasonScam',
  INAPPROPRIATE: 'adminReasonInappropriate',
  FAKE_LISTING: 'adminReasonFakeListing',
  HARASSMENT: 'adminReasonHarassment',
  OTHER: 'adminReasonOther',
};

export default function AdminReportsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { t } = useI18n();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') { (window as any).alert(`${title}\n\n${message}`); return; }
    Alert.alert(title, message);
  };

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/reports', { params: { status: 'PENDING' } });
      setReports(data.reports);
    } catch {
      // Si on n'est pas admin, on redirige silencieusement
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (!user?.isAdmin) {
      router.back();
      return;
    }
    fetchReports();
  }, [user, fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const resolveReport = async (report: Report, action: 'BAN' | 'DISMISS') => {
    setActingOn(report.id);
    try {
      await api.post(`/admin/reports/${report.id}/resolve`, { action });
      notify(t('success'), action === 'BAN' ? t('adminBanSuccess') : t('adminDismissSuccess'));
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err: any) {
      notify(t('error'), err?.response?.data?.error || t('adminActionError'));
    } finally {
      setActingOn(null);
    }
  };

  const confirmBan = (report: Report) => {
    const doBan = () => resolveReport(report, 'BAN');
    if (Platform.OS === 'web') {
      if ((window as any).confirm(t('adminBanConfirmMsg'))) doBan();
      return;
    }
    Alert.alert(t('adminBanConfirmTitle'), t('adminBanConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('adminBan'), style: 'destructive', onPress: doBan },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('adminReportsTitle'), headerShown: true, headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.surface }, headerTitleStyle: { color: colors.textPrimary } }} />
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.list}
        data={reports}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('adminNoReports')}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.reasonBadge}>
              <Text style={styles.reasonText}>{t(REASON_KEY[item.reason])}</Text>
            </View>

            {item.reportedUser && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('adminReportedUser')}</Text>
                <Text style={styles.value}>{item.reportedUser.fullName} · {item.reportedUser.phone}</Text>
              </View>
            )}
            {item.listing && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('adminReportedListing')}</Text>
                <Text style={styles.value}>{item.listing.title}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>{t('adminReporter')}</Text>
              <Text style={styles.value}>{item.reporter.fullName} · {item.reporter.phone}</Text>
            </View>
            {!!item.details && (
              <View style={styles.row}>
                <Text style={styles.label}>{t('adminDetails')}</Text>
                <Text style={styles.value}>{item.details}</Text>
              </View>
            )}
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>

            <View style={styles.actions}>
              {item.reportedUser?.isBanned ? (
                <View style={styles.bannedPill}>
                  <Ionicons name="ban" size={14} color={colors.error} />
                  <Text style={styles.bannedPillText}>{t('adminAlreadyBanned')}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.banBtn, actingOn === item.id && styles.actionDisabled]}
                  onPress={() => confirmBan(item)}
                  disabled={!item.reportedUser || actingOn === item.id}
                >
                  <Text style={styles.banBtnText}>{t('adminBan')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.dismissBtn, actingOn === item.id && styles.actionDisabled]}
                onPress={() => resolveReport(item, 'DISMISS')}
                disabled={actingOn === item.id}
              >
                <Text style={styles.dismissBtnText}>{t('adminDismiss')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  list: { padding: Spacing.md, gap: Spacing.md },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.xl, fontSize: FontSize.md },
  card: { backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: colors.border, gap: Spacing.xs },
  reasonBadge: { alignSelf: 'flex-start', backgroundColor: colors.error + '20', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, marginBottom: Spacing.xs },
  reasonText: { color: colors.error, fontWeight: '700', fontSize: FontSize.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  label: { fontSize: FontSize.xs, fontWeight: '700', color: colors.textSecondary },
  value: { fontSize: FontSize.sm, color: colors.textPrimary, flexShrink: 1 },
  date: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  banBtn: { flex: 1, backgroundColor: colors.error, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  banBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  dismissBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  dismissBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: FontSize.sm },
  actionDisabled: { opacity: 0.5 },
  bannedPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: Spacing.sm },
  bannedPillText: { color: colors.error, fontWeight: '700', fontSize: FontSize.sm },
});
