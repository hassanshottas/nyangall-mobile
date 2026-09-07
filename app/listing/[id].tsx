import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, Platform, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { ReportModal } from '@/components/ReportModal';
import api from '@/services/api';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';

type Listing = {
  id: string;
  title: string;
  description: string;
  priceMad: number;
  condition: string;
  isNegotiable: boolean;
  status: string;
  city: string;
  neighborhood?: string;
  viewCount: number;
  createdAt: string;
  photos: { url: string }[];
  category: { nameFr: string; nameEn: string };
  seller: { id: string; fullName: string; avatarUrl?: string; ratingAvg: number; ratingCount: number; city: string; createdAt: string; isVerified?: boolean };
};

type Review = { id: string; rating: number; comment?: string; createdAt: string; author: { fullName: string; avatarUrl?: string } };

const DATE_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-US', darija: 'ar-MA' };

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const catName = (cat: { nameFr: string; nameEn: string }) => (lang === 'en' ? cat.nameEn : cat.nameFr);
  const styles = getStyles(colors);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}`).then(({ data }) => {
      setListing(data.listing);
      setIsFavorited(data.isFavorited);
      api.get(`/reviews/user/${data.listing.seller.id}`).then(({ data: rData }) => setReviews(rData.reviews));
    }).catch(() => router.back()).finally(() => setLoading(false));
  }, [id]);

  const submitReview = async () => {
    if (!listing) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { targetId: listing.seller.id, rating: reviewRating, comment: reviewComment.trim() || undefined });
      const { data: rData } = await api.get(`/reviews/user/${listing.seller.id}`);
      setReviews(rData.reviews);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
    } catch (err: any) {
      notify(t('error'), err?.response?.data?.error || t('reviewError'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') { (window as any).alert(`${title}\n\n${message}`); return; }
    Alert.alert(title, message);
  };

  const toggleFavorite = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    try {
      const { data } = await api.post(`/listings/${id}/favorite`);
      setIsFavorited(data.favorited);
    } catch {
      notify(t('error'), t('favoriteError'));
    }
  };

  const handleContact = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!listing) return;
    if (listing.seller.id === user.id) { notify(t('info'), t('ownListing')); return; }
    setContactLoading(true);
    try {
      const { data } = await api.post('/conversations', { listingId: listing.id });
      router.push(`/conversation/${data.conversation.id}`);
    } catch {
      notify(t('error'), t('conversationError'));
    } finally {
      setContactLoading(false);
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if ((window as any).confirm(t('deleteListingConfirmMsg'))) deleteListing();
      return;
    }
    Alert.alert(t('deleteListingConfirmTitle'), t('deleteListingConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('deleteListing'), style: 'destructive', onPress: deleteListing },
    ]);
  };

  const deleteListing = async () => {
    if (!listing) return;
    setDeleting(true);
    try {
      await api.delete(`/listings/${listing.id}`);
      router.replace('/(tabs)/profile');
    } catch {
      notify(t('error'), t('deleteError'));
      setDeleting(false);
    }
  };

  const markAsSold = async () => {
    if (!listing) return;
    setStatusLoading(true);
    try {
      const nextStatus = listing.status === 'SOLD' ? 'ACTIVE' : 'SOLD';
      const { data } = await api.patch(`/listings/${listing.id}`, { status: nextStatus });
      setListing((l) => (l ? { ...l, status: data.listing.status } : l));
    } catch {
      notify(t('error'), t('statusUpdateError'));
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!listing) return null;

  const isOwner = user?.id === listing.seller.id;
  const isSold = listing.status === 'SOLD';

  return (
    <>
      <Stack.Screen options={{ title: listing.title, headerTintColor: colors.primary }} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Photos */}
          <View style={styles.photoSection}>
            {listing.photos.length > 0
              ? <Image source={{ uri: listing.photos[photoIndex]?.url }} style={styles.mainPhoto} resizeMode="cover" accessibilityLabel={listing.title} />
              : <View style={[styles.mainPhoto, styles.photoPlaceholder]}><Ionicons name="image-outline" size={64} color={colors.border} /></View>
            }
            {isSold && (
              <View style={styles.soldOverlay}>
                <Text style={styles.soldOverlayText}>{t('sold').toUpperCase()}</Text>
              </View>
            )}
            {listing.photos.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnails} contentContainerStyle={styles.thumbnailsContent}>
                {listing.photos.map((p, i) => (
                  <TouchableOpacity key={i} onPress={() => setPhotoIndex(i)}>
                    <Image source={{ uri: p.url }} style={[styles.thumbnail, photoIndex === i && styles.thumbnailActive]} resizeMode="cover" accessibilityLabel={`${listing.title} — photo ${i + 1}`} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.favBtn} onPress={toggleFavorite}>
              <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={24} color={isFavorited ? colors.error : colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Prix et titre */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{Number(listing.priceMad).toLocaleString('fr-MA')} MAD</Text>
              {listing.isNegotiable && <Text style={styles.negotiable}>{t('negotiable')}</Text>}
              {isSold && <View style={styles.soldBadge}><Text style={styles.soldBadgeText}>{t('sold')}</Text></View>}
            </View>
            <Text style={styles.title}>{listing.title}</Text>

            {/* Badges */}
            <View style={styles.badges}>
              <View style={styles.badge}><Text style={styles.badgeText}>{t(listing.condition as any)}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>{catName(listing.category)}</Text></View>
            </View>

            {/* Actions propriétaire */}
            {isOwner && (
              <View style={styles.ownerActions}>
                <TouchableOpacity style={[styles.soldToggleBtn, isSold && styles.soldToggleBtnActive]} onPress={markAsSold} disabled={statusLoading || deleting}>
                  {statusLoading ? <ActivityIndicator color={isSold ? '#fff' : colors.primary} /> : (
                    <>
                      <Ionicons name={isSold ? 'refresh-outline' : 'checkmark-circle-outline'} size={18} color={isSold ? '#fff' : colors.primary} />
                      <Text style={[styles.soldToggleText, isSold && styles.soldToggleTextActive]}>
                        {isSold ? t('markAsActive') : t('markAsSold')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} disabled={statusLoading || deleting}>
                  {deleting ? <ActivityIndicator color={colors.error} /> : <Ionicons name="trash-outline" size={20} color={colors.error} />}
                </TouchableOpacity>
              </View>
            )}

            {/* Localisation */}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{listing.viewCount} {t('views')}</Text>
              <Text style={styles.dot}>·</Text>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{new Date(listing.createdAt).toLocaleDateString(DATE_LOCALES[lang], { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </View>

            <View style={styles.divider} />

            {/* Description */}
            <Text style={styles.sectionTitle}>{t('description')}</Text>
            <Text style={styles.description}>{listing.description}</Text>

            <View style={styles.divider} />

            {/* Vendeur */}
            <Text style={styles.sectionTitle}>{t('seller')}</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                {listing.seller.avatarUrl
                  ? <Image source={{ uri: listing.seller.avatarUrl }} style={styles.sellerAvatarImg} accessibilityLabel={`Photo de profil de ${listing.seller.fullName}`} />
                  : <Text style={styles.sellerAvatarLetter}>{listing.seller.fullName[0].toUpperCase()}</Text>
                }
              </View>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{listing.seller.fullName}</Text>
                  {listing.seller.isVerified && <VerifiedBadge size={16} />}
                </View>
                <Text style={styles.sellerCity}>{listing.seller.city}</Text>
                {listing.seller.ratingCount > 0 && (
                  <View style={styles.sellerRating}>
                    <Ionicons name="star" size={12} color={colors.accent} />
                    <Text style={styles.sellerRatingText}>{listing.seller.ratingAvg.toFixed(1)} ({listing.seller.ratingCount} {t('reviews')})</Text>
                  </View>
                )}
              </View>
              {!isOwner && user && (
                <TouchableOpacity style={styles.reportBtn} onPress={() => setShowReportModal(true)}>
                  <Ionicons name="flag-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            {/* Avis */}
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>{t('reviews')}</Text>
              {!isOwner && user && (
                <TouchableOpacity onPress={() => setShowReviewForm(!showReviewForm)}>
                  <Text style={styles.leaveReviewLink}>{t('leaveReview')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {showReviewForm && (
              <View style={styles.reviewForm}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setReviewRating(n)}>
                      <Ionicons name={n <= reviewRating ? 'star' : 'star-outline'} size={26} color={colors.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder={t('reviewCommentPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                />
                <TouchableOpacity style={styles.reviewSubmitBtn} onPress={submitReview} disabled={submittingReview}>
                  {submittingReview
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.reviewSubmitBtnText}>{t('submitReview')}</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>{t('noReviewsYet')}</Text>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={styles.reviewItem}>
                  <View style={styles.reviewItemHeader}>
                    <Text style={styles.reviewAuthor}>{r.author.fullName}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Ionicons key={n} name={n <= r.rating ? 'star' : 'star-outline'} size={12} color={colors.accent} />
                      ))}
                    </View>
                  </View>
                  {!!r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Bouton contacter */}
        {!isOwner && !isSold && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.contactBtn} onPress={handleContact} disabled={contactLoading}>
              {contactLoading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                    <Text style={styles.contactBtnText}>{t('contact')}</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={listing.seller.id}
        listingId={listing.id}
      />
    </>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoSection: { position: 'relative', backgroundColor: colors.surface },
  mainPhoto: { width: '100%', height: 300 },
  photoPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  soldOverlay: { position: 'absolute', top: Spacing.md, left: Spacing.md, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  soldOverlayText: { color: '#fff', fontWeight: '800', fontSize: FontSize.sm, letterSpacing: 1 },
  thumbnails: { position: 'absolute', bottom: Spacing.sm },
  thumbnailsContent: { paddingHorizontal: Spacing.sm, gap: Spacing.xs },
  thumbnail: { width: 56, height: 56, borderRadius: Radius.sm, borderWidth: 2, borderColor: 'transparent' },
  thumbnailActive: { borderColor: colors.primary },
  favBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md, backgroundColor: colors.surface, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  content: { padding: Spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs, flexWrap: 'wrap' },
  price: { fontSize: FontSize.xxl, fontWeight: '800', color: colors.primary },
  negotiable: { fontSize: FontSize.xs, color: colors.success, fontWeight: '700', backgroundColor: colors.success + '18', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  soldBadge: { backgroundColor: colors.textSecondary + '22', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  soldBadgeText: { fontSize: FontSize.xs, color: colors.textSecondary, fontWeight: '700' },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.md },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  badge: { backgroundColor: colors.secondary + '12', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700', color: colors.secondary },
  ownerActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  soldToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderWidth: 1.5, borderColor: colors.primary, borderRadius: Radius.md, padding: Spacing.sm },
  deleteBtn: { width: 44, borderWidth: 1.5, borderColor: colors.error, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  soldToggleBtnActive: { backgroundColor: colors.textSecondary, borderColor: colors.textSecondary },
  soldToggleText: { color: colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  soldToggleTextActive: { color: '#fff' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  infoText: { fontSize: FontSize.sm, color: colors.textSecondary },
  dot: { color: colors.textSecondary, marginHorizontal: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.md },
  description: { fontSize: FontSize.md, color: colors.textPrimary, lineHeight: 24 },
  sellerCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: colors.border },
  reportBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sellerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  sellerAvatarImg: { width: 52, height: 52 },
  sellerAvatarLetter: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  sellerInfo: { flex: 1 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerName: { fontSize: FontSize.md, fontWeight: '700', color: colors.textPrimary },
  sellerCity: { fontSize: FontSize.sm, color: colors.textSecondary },
  sellerRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sellerRatingText: { fontSize: FontSize.xs, color: colors.textSecondary },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  leaveReviewLink: { fontSize: FontSize.sm, color: colors.primary, fontWeight: '700' },
  reviewForm: { backgroundColor: colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.border, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  starRow: { flexDirection: 'row', gap: Spacing.xs },
  reviewInput: { borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.sm, fontSize: FontSize.sm, color: colors.textPrimary, minHeight: 60, textAlignVertical: 'top' },
  reviewSubmitBtn: { backgroundColor: colors.primary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  reviewSubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  noReviews: { fontSize: FontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  reviewItem: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: FontSize.sm, fontWeight: '700', color: colors.textPrimary },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewComment: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  footer: { padding: Spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: colors.primary, borderRadius: Radius.md, padding: Spacing.md },
  contactBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
