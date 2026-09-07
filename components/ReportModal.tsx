import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import api from '@/services/api';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  reportedUserId?: string;
  listingId?: string;
};

const REASONS = ['SCAM', 'INAPPROPRIATE', 'FAKE_LISTING', 'HARASSMENT', 'OTHER'] as const;
const REASON_KEY: Record<typeof REASONS[number], any> = {
  SCAM: 'reportReasonScam',
  INAPPROPRIATE: 'reportReasonInappropriate',
  FAKE_LISTING: 'reportReasonFakeListing',
  HARASSMENT: 'reportReasonHarassment',
  OTHER: 'reportReasonOther',
};

export function ReportModal({ visible, onClose, reportedUserId, listingId }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const [reason, setReason] = useState<typeof REASONS[number]>('SCAM');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') { (window as any).alert(`${title}\n\n${message}`); return; }
    Alert.alert(title, message);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/reviews/report', { reportedUserId, listingId, reason, details: details.trim() || undefined });
      notify(t('success'), t('reportSuccess'));
      setDetails('');
      setReason('SCAM');
      onClose();
    } catch (err: any) {
      notify(t('error'), err?.response?.data?.error || t('reportError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('reportUser')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('reportReasonLabel')}</Text>
          <View style={styles.reasons}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                onPress={() => setReason(r)}
              >
                <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{t(REASON_KEY[r])}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t('reportDetailsPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={details}
            onChangeText={setDetails}
            multiline
          />

          <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitBtnText}>{t('reportSubmit')}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  card: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary, marginTop: Spacing.xs },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  reasonChip: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  reasonChipActive: { backgroundColor: colors.error, borderColor: colors.error },
  reasonText: { fontSize: FontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  reasonTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.sm, fontSize: FontSize.sm, color: colors.textPrimary, minHeight: 70, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.error, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', marginTop: Spacing.xs },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
});
