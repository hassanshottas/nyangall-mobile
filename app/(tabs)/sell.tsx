import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Switch, Image, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/Logo';

type Category = { id: string; nameFr: string; nameEn: string };
type PickedPhoto = { uri: string; fileName?: string | null; mimeType?: string | null };

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Salé', 'Nador'];
const MAX_PHOTOS = 10;

export default function SellScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const catName = (cat: { nameFr: string; nameEn: string }) => (lang === 'en' ? cat.nameEn : cat.nameFr);
  const CONDITIONS = [
    { value: 'NEW', label: t('NEW') }, { value: 'LIKE_NEW', label: t('LIKE_NEW') },
    { value: 'GOOD', label: t('GOOD') }, { value: 'FAIR', label: t('FAIR') },
  ];
  const { headerPT, isDesktop } = useResponsive();
  const styles = getStyles(colors);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  const [form, setForm] = useState({
    title: '', description: '', priceMad: '', categoryId: '', categoryName: '',
    city: '', neighborhood: '', condition: 'GOOD', isNegotiable: true,
  });

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const set = (key: string) => (val: any) => setForm((f) => ({ ...f, [key]: val }));

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') { (window as any).alert(`${title}\n\n${message}`); return; }
    Alert.alert(title, message);
  };

  const pickPhotos = async () => {
    if (photos.length >= MAX_PHOTOS) {
      notify(t('limitReached'), t('maxPhotosMsg').replace('{max}', String(MAX_PHOTOS)));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify(t('permissionRequired'), t('photoPermissionMsg'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const newPhotos: PickedPhoto[] = result.assets.map((a) => ({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const formData = new FormData();
    for (const photo of photos) {
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
    }
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.urls;
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.priceMad || !form.categoryId || !form.city) {
      notify(t('required'), t('fillRequiredFields')); return;
    }
    if (photos.length === 0) {
      notify(t('photos'), t('photoRequired')); return;
    }
    setLoading(true);
    try {
      setUploadingPhotos(true);
      const photoUrls = await uploadPhotos();
      setUploadingPhotos(false);

      const { data } = await api.post('/listings', {
        title: form.title, description: form.description, priceMad: parseFloat(form.priceMad),
        categoryId: form.categoryId, city: form.city, neighborhood: form.neighborhood || undefined,
        condition: form.condition, isNegotiable: form.isNegotiable, photoUrls,
      });

      // Réinitialiser le formulaire et revenir directement à l'accueil
      setForm({ title: '', description: '', priceMad: '', categoryId: '', categoryName: '', city: '', neighborhood: '', condition: 'GOOD', isNegotiable: true });
      setPhotos([]);
      notify(t('listingPublished'), t('listingPublishedDesc'));
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err?.response?.status === 422) {
        notify(t('photoRejected'), err.response.data?.error || t('photoRejected'));
      } else {
        notify(t('error'), err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || t('publishError'));
      }
    } finally { setLoading(false); setUploadingPhotos(false); }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={[styles.header, { paddingTop: headerPT }]}>
        <Logo size="header" showTagline={false} />
        <Text style={styles.headerTitle}>{t('publishListing')}</Text>
      </View>

      <View style={[styles.formOuter, isDesktop && styles.formOuterDesktop]}>
        <View style={[styles.form, isDesktop && styles.formDesktop]}>

          {/* Photos */}
          <Text style={styles.label}>{t('photos')} * ({photos.length}/{MAX_PHOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow} contentContainerStyle={styles.photosRowContent}>
            {photos.map((photo, i) => (
              <View key={i} style={styles.photoThumbWrap}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removePhoto(i)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
                {i === 0 && <View style={styles.photoMainBadge}><Text style={styles.photoMainBadgeText}>{t('mainPhoto')}</Text></View>}
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity style={styles.photoAddBtn} onPress={pickPhotos} disabled={uploadingPhotos}>
                <Ionicons name="camera-outline" size={26} color={colors.primary} />
                <Text style={styles.photoAddText}>{t('addPhoto')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text style={styles.hint}>{t('photoHint')}</Text>

          <Text style={styles.label}>{t('title')} *</Text>
          <TextInput style={styles.input} placeholder={t('titlePlaceholder')} placeholderTextColor={colors.textSecondary} value={form.title} onChangeText={set('title')} maxLength={100} />

          <Text style={styles.label}>{t('description')} *</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder={t('descriptionPlaceholder')} placeholderTextColor={colors.textSecondary} value={form.description} onChangeText={set('description')} multiline numberOfLines={5} textAlignVertical="top" />

          <View style={styles.row2}>
            <View style={styles.col}>
              <Text style={styles.label}>{t('price')} *</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textSecondary} value={form.priceMad} onChangeText={set('priceMad')} keyboardType="numeric" />
            </View>
            <View style={[styles.col, styles.toggleCol]}>
              <Text style={styles.label}>{t('negotiablePrice')}</Text>
              <Switch value={form.isNegotiable} onValueChange={set('isNegotiable')} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
            </View>
          </View>

          <Text style={styles.label}>{t('category')} *</Text>
          <TouchableOpacity style={[styles.input, styles.picker]} onPress={() => { setShowCategories(!showCategories); setShowCities(false); }}>
            <Text style={form.categoryId ? styles.pickerText : styles.pickerPlaceholder}>{form.categoryName || t('chooseCategory')}</Text>
            <Ionicons name={showCategories ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {showCategories && (
            <View style={styles.dropdown}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                {categories.map((cat) => (
                  <TouchableOpacity key={cat.id} style={styles.dropdownItem} onPress={() => { set('categoryId')(cat.id); set('categoryName')(catName(cat)); setShowCategories(false); }}>
                    <Text style={[styles.dropdownText, form.categoryId === cat.id && styles.dropdownTextActive]}>{catName(cat)}</Text>
                    {form.categoryId === cat.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>{t('condition')} *</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity key={c.value} style={[styles.conditionBtn, form.condition === c.value && styles.conditionBtnActive]} onPress={() => set('condition')(c.value)}>
                <Text style={[styles.conditionText, form.condition === c.value && styles.conditionTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row2}>
            <View style={styles.col}>
              <Text style={styles.label}>{t('city')} *</Text>
              <TouchableOpacity style={[styles.input, styles.picker]} onPress={() => { setShowCities(!showCities); setShowCategories(false); }}>
                <Text style={form.city ? styles.pickerText : styles.pickerPlaceholder}>{form.city || t('chooseCity')}</Text>
                <Ionicons name={showCities ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {showCities && (
                <View style={styles.dropdown}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {CITIES.map((city) => (
                      <TouchableOpacity key={city} style={styles.dropdownItem} onPress={() => { set('city')(city); setShowCities(false); }}>
                        <Text style={[styles.dropdownText, form.city === city && styles.dropdownTextActive]}>{city}</Text>
                        {form.city === city && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('neighborhood')}</Text>
              <TextInput style={styles.input} placeholder="Ex: Maarif..." placeholderTextColor={colors.textSecondary} value={form.neighborhood} onChangeText={set('neighborhood')} />
            </View>
          </View>

          <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>{t('publish')}</Text>
            }
          </TouchableOpacity>
          {uploadingPhotos && <Text style={styles.uploadingHint}>{t('uploadingHint')}</Text>}
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', gap: 4, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary },
  formOuter: { width: '100%' },
  formOuterDesktop: { alignItems: 'center' },
  form: { padding: Spacing.lg },
  formDesktop: { width: '100%', maxWidth: 700 },
  row2: { flexDirection: 'row', gap: Spacing.md },
  col: { flex: 1 },
  toggleCol: { justifyContent: 'center', paddingTop: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, color: colors.textPrimary, backgroundColor: colors.surface, marginBottom: Spacing.md },
  textarea: { minHeight: 100 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: FontSize.md, color: colors.textPrimary },
  pickerPlaceholder: { fontSize: FontSize.md, color: colors.textSecondary },
  dropdown: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, marginTop: -Spacing.md, marginBottom: Spacing.md, overflow: 'hidden' },
  dropdownScroll: { maxHeight: 220 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownText: { fontSize: FontSize.md, color: colors.textPrimary },
  dropdownTextActive: { color: colors.primary, fontWeight: '700' },
  conditionRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  conditionBtn: { flex: 1, minWidth: '22%', padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  conditionBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  conditionText: { fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  conditionTextActive: { color: colors.primary },
  hint: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: -Spacing.xs, marginBottom: Spacing.md, lineHeight: 18 },
  uploadingHint: { fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  submitBtn: { backgroundColor: colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  photosRow: { flexGrow: 0, marginBottom: Spacing.xs },
  photosRowContent: { gap: Spacing.sm, paddingVertical: 2 },
  photoThumbWrap: { position: 'relative', width: 84, height: 84 },
  photoThumb: { width: 84, height: 84, borderRadius: Radius.md },
  photoRemoveBtn: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.surface },
  photoMainBadge: { position: 'absolute', bottom: 2, left: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingVertical: 1 },
  photoMainBadgeText: { color: '#fff', fontSize: 8, fontWeight: '700', textAlign: 'center' },
  photoAddBtn: { width: 84, height: 84, borderRadius: Radius.md, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary + '08' },
  photoAddText: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 2 },
});
