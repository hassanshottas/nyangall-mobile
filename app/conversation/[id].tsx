import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Image,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import api from '@/services/api';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { ReportModal } from '@/components/ReportModal';

type Message = { id: string; senderId: string; content: string | null; imageUrl: string | null; createdAt: string; isRead: boolean };
type Offer = { id: string; proposedByUserId: string; amountMad: number; status: string; createdAt: string };
type Conversation = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  listing: { title: string };
  buyer: { id: string; fullName: string };
  seller: { id: string; fullName: string };
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [text, setText] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const { t } = useI18n();

  const fetchMessages = async () => {
    const { data } = await api.get(`/conversations/${id}/messages`);
    setMessages(data.messages);
    setOffers(data.offers);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [convData, msgData] = await Promise.all([
          api.get('/conversations'),
          api.get(`/conversations/${id}/messages`),
        ]);
        const conv = convData.data.conversations.find((c: Conversation) => c.id === id);
        setConversation(conv || null);
        setMessages(msgData.data.messages);
        setOffers(msgData.data.offers);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    init();

    // Polling toutes les 5 secondes
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const { data } = await api.post(`/conversations/${id}/messages`, { content });
      setMessages((prev) => [...prev, data.message]);
      flatListRef.current?.scrollToEnd();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const pickAndSendImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('permissionRequired'), t('photoPermissionMsg'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const photo = result.assets[0];

    setUploadingImage(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const res = await fetch(photo.uri);
        const blob = await res.blob();
        formData.append('photos', blob, photo.fileName || 'photo.jpg');
      } else {
        formData.append('photos', {
          uri: photo.uri,
          name: photo.fileName || 'photo.jpg',
          type: photo.mimeType || 'image/jpeg',
        } as any);
      }
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadData.urls[0];
      const { data } = await api.post(`/conversations/${id}/messages`, { imageUrl });
      setMessages((prev) => [...prev, data.message]);
      flatListRef.current?.scrollToEnd();
    } catch (err: any) {
      Alert.alert(t('error'), err?.response?.data?.error || 'Impossible d\'envoyer la photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const sendOffer = async () => {
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) { Alert.alert('Montant invalide', 'Entrez un montant positif.'); return; }
    try {
      const { data } = await api.post(`/conversations/${id}/offers`, { amountMad: amount });
      setOffers((prev) => [...prev, data.offer]);
      setOfferAmount('');
      setShowOfferInput(false);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'offre.');
    }
  };

  const respondOffer = async (offerId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const { data } = await api.patch(`/offers/${offerId}`, { status });
      setOffers((prev) => prev.map((o) => o.id === offerId ? data.offer : o));
    } catch {
      Alert.alert('Erreur', 'Impossible de répondre à l\'offre.');
    }
  };

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') { (window as any).alert(`${title}\n\n${message}`); return; }
    Alert.alert(title, message);
  };

  const toggleBlock = async () => {
    if (!conversation || !user) return;
    const otherUserId = user.id === conversation.buyerId ? conversation.seller.id : conversation.buyer.id;
    const doBlock = async () => {
      try {
        if (isBlocked) {
          await api.delete(`/reviews/block/${otherUserId}`);
          setIsBlocked(false);
          notify(t('success'), t('unblockSuccess'));
        } else {
          await api.post(`/reviews/block/${otherUserId}`);
          setIsBlocked(true);
          notify(t('success'), t('blockSuccess'));
        }
      } catch {
        notify(t('error'), t('blockError'));
      }
    };
    if (isBlocked) { doBlock(); return; }
    if (Platform.OS === 'web') {
      if ((window as any).confirm(t('blockConfirmMsg'))) doBlock();
      return;
    }
    Alert.alert(t('blockConfirmTitle'), t('blockConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('blockUser'), style: 'destructive', onPress: doBlock },
    ]);
  };

  const isMine = (senderId: string) => senderId === user?.id;

  const statusLabel: Record<string, string> = { PENDING: '⏳ En attente', ACCEPTED: '✅ Acceptée', REJECTED: '❌ Refusée', COUNTERED: '↩️ Contre-offre' };
  const statusColor: Record<string, string> = { PENDING: Colors.accent, ACCEPTED: Colors.success, REJECTED: Colors.error, COUNTERED: Colors.secondary };

  type Item = ({ type: 'message' } & Message) | ({ type: 'offer' } & Offer);
  const items: Item[] = [
    ...messages.map((m) => ({ ...m, type: 'message' as const })),
    ...offers.map((o) => ({ ...o, type: 'offer' as const })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const otherName = conversation ? (user?.id === conversation.buyerId ? conversation.seller.fullName : conversation.buyer.fullName) : '';
  const otherUserId = conversation && user ? (user.id === conversation.buyerId ? conversation.seller.id : conversation.buyer.id) : '';

  return (
    <>
      <Stack.Screen
        options={{
          title: otherName || 'Conversation',
          headerTintColor: Colors.primary,
          headerRight: () => (
            <TouchableOpacity style={styles.menuBtn} onPress={() => setShowMenu((v) => !v)}>
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      {showMenu && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowMenu(false)} />
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); setShowReportModal(true); }}>
              <Ionicons name="flag-outline" size={18} color={Colors.textPrimary} />
              <Text style={styles.menuItemText}>{t('report')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); toggleBlock(); }}>
              <Ionicons name={isBlocked ? 'lock-open-outline' : 'ban-outline'} size={18} color={Colors.error} />
              <Text style={[styles.menuItemText, { color: Colors.error }]}>{isBlocked ? t('unblockUser') : t('blockUser')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <ReportModal visible={showReportModal} onClose={() => setShowReportModal(false)} reportedUserId={otherUserId} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : (
          <>
            {conversation && (
              <View style={styles.listingBanner}>
                <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
                <Text style={styles.listingBannerText} numberOfLines={1}>{conversation.listing.title}</Text>
              </View>
            )}

            <FlatList
              ref={flatListRef}
              data={items}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messages}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
                if (item.type === 'message') {
                  const mine = isMine(item.senderId);
                  return (
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther, item.imageUrl && styles.bubbleImageWrap]}>
                      {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.bubbleImage} resizeMode="cover" accessibilityLabel="Photo envoyée dans la conversation" />
                      )}
                      {!!item.content && (
                        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextOther, item.imageUrl && styles.bubbleTextWithImage]}>{item.content}</Text>
                      )}
                      <Text style={[styles.bubbleTime, mine ? styles.bubbleTimeMine : styles.bubbleTimeOther, item.imageUrl && styles.bubbleTextWithImage]}>
                        {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                }
                // Offre
                const myOffer = isMine(item.proposedByUserId);
                const canRespond = !myOffer && item.status === 'PENDING';
                return (
                  <View style={styles.offerCard}>
                    <View style={styles.offerHeader}>
                      <Ionicons name="cash-outline" size={16} color={Colors.accent} />
                      <Text style={styles.offerLabel}>{myOffer ? 'Vous avez proposé' : 'Offre reçue'}</Text>
                    </View>
                    <Text style={styles.offerAmount}>{Number(item.amountMad).toLocaleString('fr-MA')} MAD</Text>
                    <Text style={[styles.offerStatus, { color: statusColor[item.status] }]}>{statusLabel[item.status]}</Text>
                    {canRespond && (
                      <View style={styles.offerActions}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => respondOffer(item.id, 'ACCEPTED')}>
                          <Text style={styles.acceptBtnText}>Accepter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => respondOffer(item.id, 'REJECTED')}>
                          <Text style={styles.rejectBtnText}>Refuser</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }}
            />

            {showOfferInput && (
              <View style={styles.offerInputRow}>
                <TextInput
                  style={styles.offerInput}
                  placeholder="Montant en MAD"
                  placeholderTextColor={Colors.textSecondary}
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.offerSendBtn} onPress={sendOffer}>
                  <Text style={styles.offerSendBtnText}>Envoyer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowOfferInput(false)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
              <TouchableOpacity style={styles.offerBtn} onPress={() => setShowOfferInput(!showOfferInput)}>
                <Ionicons name="cash-outline" size={22} color={Colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.offerBtn} onPress={pickAndSendImage} disabled={uploadingImage}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="image-outline" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Écrire un message..."
                placeholderTextColor={Colors.textSecondary}
                value={text}
                onChangeText={setText}
                multiline
              />
              <TouchableOpacity style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!text.trim() || sending}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  menuBtn: { padding: Spacing.xs, marginRight: Spacing.xs },
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  menu: { position: 'absolute', top: 4, right: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.xs, minWidth: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  menuItemText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  listingBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: Colors.primary + '10', borderBottomWidth: 1, borderBottomColor: Colors.primary + '30' },
  listingBannerText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  messages: { padding: Spacing.md, gap: Spacing.sm },
  bubble: { maxWidth: '75%', borderRadius: Radius.lg, padding: Spacing.sm },
  bubbleImageWrap: { padding: 4 },
  bubbleImage: { width: 200, height: 200, borderRadius: Radius.md, marginBottom: 4 },
  bubbleTextWithImage: { paddingHorizontal: Spacing.xs },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: FontSize.md, lineHeight: 22 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextOther: { color: Colors.textPrimary },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  bubbleTimeOther: { color: Colors.textSecondary },
  offerCard: { alignSelf: 'center', width: '80%', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.accent + '40', gap: Spacing.xs },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  offerLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  offerAmount: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  offerStatus: { fontSize: FontSize.sm, fontWeight: '700' },
  offerActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  acceptBtn: { flex: 1, backgroundColor: Colors.success, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  rejectBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.error, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  rejectBtnText: { color: Colors.error, fontWeight: '700', fontSize: FontSize.sm },
  offerInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  offerInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary },
  offerSendBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  offerSendBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  offerBtn: { padding: Spacing.xs },
  input: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary, maxHeight: 100 },
  sendBtn: { backgroundColor: Colors.primary, borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
