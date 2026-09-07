import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image, TextInput, Modal, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/Logo';
import { VerifiedBadge } from '@/components/VerifiedBadge';

type Listing = { id: string; title: string; priceMad: number; status: string; photos: { url: string }[] };

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { headerPT, isDesktop } = useResponsive();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const STATUS_COLORS: Record<string, string> = { ACTIVE: colors.success, SOLD: colors.textSecondary, RESERVED: colors.accent, INACTIVE: colors.border };
  const STATUS_LABELS: Record<string, string> = { ACTIVE: t('active'), SOLD: t('sold'), RESERVED: t('reserved'), INACTIVE: t('inactive') };

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Welcome message editor
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [savingWelcome, setSavingWelcome] = useState(false);

  useEffect(() => {
    api.get('/listings/mine').then(({ data }) => setMyListings(data.listings)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if ((window as any).confirm(t('logoutConfirmMsg'))) logout();
      return;
    }
    Alert.alert(t('logoutConfirmTitle'), t('logoutConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') { (window as any).alert(`${title}\n\n${message}`); return; }
    Alert.alert(title, message);
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if ((window as any).confirm(`${title}\n\n${message}`)) onConfirm();
      return;
    }
    Alert.alert(title, message, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('remove'), style: 'destructive', onPress: onConfirm },
    ]);
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify(t('permissionRequired'), t('avatarPermissionMsg'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const res = await fetch(asset.uri);
        const blob = await res.blob();
        formData.append('photos', blob, asset.fileName || 'avatar.jpg');
      } else {
        formData.append('photos', {
          uri: asset.uri,
          name: asset.fileName || 'avatar.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as any);
      }

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await api.patch('/auth/me', { avatarUrl: data.urls[0] });
      await refreshUser();
      notify(t('success'), t('avatarUpdatedMsg'));
    } catch (err: any) {
      if (err?.response?.status === 422) {
        notify(t('photoRejected'), err.response.data?.error || t('photoRejected'));
      } else {
        notify(t('error'), err?.response?.data?.error || t('avatarUpdateError'));
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    confirmAction(t('removePhotoConfirmTitle'), t('removePhotoConfirmMsg'), async () => {
      try {
        await api.patch('/auth/me', { avatarUrl: null });
        await refreshUser();
      } catch {
        notify(t('error'), t('removePhotoError'));
      }
    });
  };

  const openWelcomeModal = () => {
    setWelcomeMsg((user as any)?.welcomeMessage || '');
    setShowWelcome(true);
  };

  const saveWelcomeMessage = async () => {
    setSavingWelcome(true);
    try {
      await api.patch('/auth/me', { welcomeMessage: welcomeMsg.trim() || null });
      await refreshUser();
      setShowWelcome(false);
      notify(t('success'), welcomeMsg.trim() ? t('welcomeActivatedMsg') : t('welcomeDeactivatedMsg'));
    } catch {
      notify(t('error'), t('saveError'));
    } finally { setSavingWelcome(false); }
  };

  if (!user) return null;

  const activeCount = myListings.filter((l) => l.status === 'ACTIVE').length;
  const soldCount = myListings.filter((l) => l.status === 'SOLD').length;
  const welcomeActive = !!(user as any)?.welcomeMessage?.trim();
  const hasAvatar = !!(user as any).avatarUrl;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.inner, isDesktop && styles.innerDesktop]}>

        {/* Logo cohérent */}
        <View style={[styles.brandHeader, { paddingTop: headerPT }]}>
          <Logo size="header" showTagline={false} />
        </View>

        {/* Header profil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} disabled={uploadingAvatar} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              {hasAvatar
                ? <Image source={{ uri: (user as any).avatarUrl }} style={styles.avatar} accessibilityLabel="Photo de profil" />
                : <Text style={styles.avatarLetter}>{user.fullName[0].toUpperCase()}</Text>
              }
            </View>
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          {hasAvatar && (
            <TouchableOpacity onPress={removeAvatar} style={styles.removeAvatarBtn}>
              <Ionicons name="trash-outline" size={13} color={colors.error} />
              <Text style={styles.removeAvatarText}>{t('removePhoto')}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.fullName}</Text>
            {(user as any).isVerified && <VerifiedBadge size={18} />}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>{(user as any).city}</Text>
          </View>
          {(user as any).ratingCount > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={styles.ratingText}>{(user as any).ratingAvg?.toFixed(1)} ({(user as any).ratingCount} {t('reviews')})</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statValue}>{activeCount}</Text><Text style={styles.statLabel}>{t('activeListings')}</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statValue}>{soldCount}</Text><Text style={styles.statLabel}>{t('soldListings')}</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statValue}>{(user as any).ratingCount || 0}</Text><Text style={styles.statLabel}>{t('receivedReviews')}</Text></View>
        </View>

        {/* ── Message d'accueil ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>💬 {t('welcomeMessageTitle')}</Text>
              <Text style={styles.sectionDesc}>{t('welcomeMessageDesc')}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: welcomeActive ? colors.success + '22' : colors.border + '50' }]}>
              <Text style={[styles.statusPillText, { color: welcomeActive ? colors.success : colors.textSecondary }]}>
                {welcomeActive ? t('active') : t('inactive')}
              </Text>
            </View>
          </View>

          {welcomeActive && (
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>"{(user as any).welcomeMessage}"</Text>
            </View>
          )}

          <TouchableOpacity style={styles.configBtn} onPress={openWelcomeModal}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.configBtnText}>{welcomeActive ? t('editMessage') : t('configureMessage')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Mes annonces ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 {t('myListings')}</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.md }} />
          ) : myListings.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>{t('noListingsYet')}</Text>
              <TouchableOpacity style={styles.sellBtn} onPress={() => router.push('/(tabs)/sell')}>
                <Text style={styles.sellBtnText}>{t('publishListing')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myListings.map((listing) => (
              <TouchableOpacity key={listing.id} style={styles.listingRow} onPress={() => router.push(`/listing/${listing.id}`)}>
                {listing.photos[0]
                  ? <Image source={{ uri: listing.photos[0].url }} style={styles.listingThumb} resizeMode="cover" accessibilityLabel={listing.title} />
                  : <View style={[styles.listingThumb, styles.thumbPlaceholder]}><Ionicons name="image-outline" size={20} color={colors.border} /></View>
                }
                <View style={styles.listingBody}>
                  <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>{Number(listing.priceMad).toLocaleString('fr-MA')} MAD</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[listing.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[listing.status] }]}>{STATUS_LABELS[listing.status]}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </View>

      {/* Modal message d'accueil */}
      <Modal visible={showWelcome} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowWelcome(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('welcomeMessageTitle')}</Text>
            <TouchableOpacity onPress={() => setShowWelcome(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalDesc}>{t('welcomeModalDesc')}</Text>

            <View style={styles.examplesBox}>
              <Text style={styles.examplesTitle}>{t('examplesLabel')}</Text>
              {[
                'Bonjour ! Merci de votre intérêt. Je suis disponible pour répondre à vos questions. 😊',
                'Salam ! L\'article est toujours disponible. N\'hésitez pas à faire une offre.',
                'مرحباً! الغرض مزال كاين. يمكنك تدير عرض.',
              ].map((ex, i) => (
                <TouchableOpacity key={i} style={styles.exampleChip} onPress={() => setWelcomeMsg(ex)}>
                  <Text style={styles.exampleText}>"{ex}"</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>{t('yourMessage')}</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              maxLength={300}
              value={welcomeMsg}
              onChangeText={setWelcomeMsg}
              placeholder={t('welcomeModalPlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.charCount}>{welcomeMsg.length}/300</Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.saveBtn, savingWelcome && { opacity: 0.6 }]} onPress={saveWelcomeMessage} disabled={savingWelcome}>
              {savingWelcome ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { width: '100%' },
  innerDesktop: { maxWidth: 800, alignSelf: 'center' },
  brandHeader: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  profileHeader: { backgroundColor: colors.surface, alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarWrap: { width: 80, height: 80, marginBottom: Spacing.sm },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarEditBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  avatar: { width: 80, height: 80 },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: '700' },
  removeAvatarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  removeAvatarText: { fontSize: FontSize.xs, color: colors.error, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: FontSize.sm, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: FontSize.sm, color: colors.textSecondary },
  stats: { flexDirection: 'row', backgroundColor: colors.surface, marginTop: Spacing.sm, borderRadius: Radius.md, marginHorizontal: Spacing.md, padding: Spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  section: { margin: Spacing.md, backgroundColor: colors.surface, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: colors.textPrimary },
  sectionDesc: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  previewBox: { backgroundColor: colors.primary + '08', borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary },
  previewText: { fontSize: FontSize.sm, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 20 },
  configBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs },
  configBtnText: { fontSize: FontSize.sm, color: colors.primary, fontWeight: '600' },
  emptySection: { alignItems: 'center', padding: Spacing.lg },
  emptyText: { fontSize: FontSize.sm, color: colors.textSecondary, marginBottom: Spacing.md },
  sellBtn: { backgroundColor: colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  sellBtnText: { color: '#fff', fontWeight: '700' },
  listingRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, marginBottom: Spacing.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  listingThumb: { width: 72, height: 72 },
  thumbPlaceholder: { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  listingBody: { flex: 1, padding: Spacing.sm },
  listingTitle: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textPrimary },
  listingPrice: { fontSize: FontSize.md, fontWeight: '800', color: colors.primary, marginTop: 2 },
  statusBadge: { marginRight: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, margin: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: colors.error },
  logoutText: { color: colors.error, fontWeight: '700', fontSize: FontSize.md },
  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: colors.textPrimary },
  modalBody: { flex: 1, padding: Spacing.lg },
  modalDesc: { fontSize: FontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  modalFooter: { padding: Spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  examplesBox: { backgroundColor: colors.background, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.lg },
  examplesTitle: { fontSize: FontSize.sm, fontWeight: '700', color: colors.textSecondary },
  exampleChip: { backgroundColor: colors.surface, borderRadius: Radius.sm, padding: Spacing.sm, borderWidth: 1, borderColor: colors.border },
  exampleText: { fontSize: FontSize.sm, color: colors.textPrimary, lineHeight: 18 },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, color: colors.textPrimary, backgroundColor: colors.surface, marginBottom: Spacing.xs },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  charCount: { fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'right', marginBottom: Spacing.md },
  saveBtn: { backgroundColor: colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});
