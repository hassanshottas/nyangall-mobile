import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { PageContainer } from '@/components/PageContainer';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/Logo';
import { PromoBanner } from '@/components/PromoBanner';

type Listing = {
  id: string; title: string; priceMad: number; city: string; condition: string;
  createdAt: string; photos: { url: string }[];
  category: { nameFr: string; nameEn: string; icon: string }; seller: { fullName: string; ratingAvg: number };
};
type Category = { id: string; nameFr: string; nameEn: string; slug: string; icon: string };

const CONDITION_COLORS: Record<string, string> = { NEW: '#16a34a', LIKE_NEW: '#0891b2', GOOD: '#d97706', FAIR: '#9ca3af' };

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan'];

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const catName = (cat: { nameFr: string; nameEn: string }) => (lang === 'en' ? cat.nameEn : cat.nameFr);
  const { numCols, headerPT } = useResponsive();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const styles = getStyles(colors);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const fetchListings = useCallback(async (q?: string, city?: string, category?: string) => {
    try {
      const params: Record<string, string> = { limit: '40' };
      if (q) params.search = q;
      if (city) params.city = city;
      if (category) params.category = category;
      const { data } = await api.get('/listings', { params });
      setListings(data.listings);
    } catch { } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const onRefresh = () => { setRefreshing(true); fetchListings(search, selectedCity, selectedCategory); };

  const handleCitySelect = (city: string) => {
    const next = city === selectedCity ? '' : city;
    setSelectedCity(next);
    fetchListings(search, next, selectedCategory);
  };

  const handleCategorySelect = (slug: string) => {
    const next = slug === selectedCategory ? '' : slug;
    setSelectedCategory(next);
    fetchListings(search, selectedCity, next);
  };

  const handleSearch = () => { fetchListings(search, selectedCity, selectedCategory); };

  const clearAll = () => {
    setSearch(''); setSelectedCity(''); setSelectedCategory('');
    fetchListings();
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/listing/${item.id}`)}>
      <View style={styles.imageContainer}>
        {item.photos[0]
          ? <Image source={{ uri: item.photos[0].url }} style={styles.image} resizeMode="cover" accessibilityLabel={item.title} />
          : <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color={colors.border} />
            </View>
        }
        <View style={[styles.conditionBadge, { backgroundColor: CONDITION_COLORS[item.condition] || '#9ca3af' }]}>
          <Text style={styles.conditionText}>{t(item.condition as any) || item.condition}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardPrice}>{Number(item.priceMad).toLocaleString('fr-MA')} MAD</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.cardMetaText}>{item.city}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.cardMetaText}>{catName(item.category)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const categoryChips = (
    <>
      <TouchableOpacity
        style={[styles.catChip, !selectedCategory && styles.catChipActive]}
        onPress={() => handleCategorySelect('')}
      >
        <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>{t('allCategories')}</Text>
      </TouchableOpacity>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.catChip, selectedCategory === cat.slug && styles.catChipActive]}
          onPress={() => handleCategorySelect(cat.slug)}
        >
          <Text style={[styles.catChipText, selectedCategory === cat.slug && styles.catChipTextActive]}>
            {cat.icon} {catName(cat)}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );

  const cityChips = (
    <>
      <TouchableOpacity
        style={[styles.cityChip, !selectedCity && styles.cityChipActive]}
        onPress={() => handleCitySelect('')}
      >
        <Ionicons name="globe-outline" size={13} color={!selectedCity ? '#fff' : colors.textSecondary} />
        <Text style={[styles.cityChipText, !selectedCity && styles.cityChipTextActive]}>{t('allMorocco')}</Text>
      </TouchableOpacity>
      {CITIES.map((city) => (
        <TouchableOpacity
          key={city}
          style={[styles.cityChip, selectedCity === city && styles.cityChipActive]}
          onPress={() => handleCitySelect(city)}
        >
          <Ionicons name="location-outline" size={13} color={selectedCity === city ? '#fff' : colors.textSecondary} />
          <Text style={[styles.cityChipText, selectedCity === city && styles.cityChipTextActive]}>{city}</Text>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <View style={styles.container}>
      <PageContainer>
        {/* Header */}
        <View style={[styles.header, { paddingTop: headerPT }]}>
          <View style={styles.headerCenter}>
            <Logo size="header" showTagline={false} />
          </View>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchListings('', selectedCity, selectedCategory); }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bandeau publicitaire */}
        <View style={styles.promoWrap}>
          <PromoBanner />
        </View>

        {/* Filtre par catégorie */}
        <View style={styles.chipRowOuter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catRow}
            contentContainerStyle={styles.catRowContent}
          >
            {categoryChips}
          </ScrollView>
        </View>

        {/* Filtre par ville */}
        <View style={styles.chipRowOuter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cityRow}
            contentContainerStyle={styles.cityRowContent}
          >
            {cityChips}
          </ScrollView>
        </View>

        {/* Résumé filtre actif */}
        {(selectedCity || selectedCategory || search) ? (
          <View style={styles.activeFilter}>
            <Ionicons name="funnel" size={14} color={colors.primary} />
            <Text style={styles.activeFilterText}>
              {[search && `"${search}"`, selectedCategory && catName(categories.find(c => c.slug === selectedCategory) || { nameFr: '', nameEn: '' }), selectedCity].filter(Boolean).join(' · ')}
              {' — '}{listings.length} {t('resultsCount')}
            </Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearFilter}>{t('clearFilters')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : (
          <FlatList
            key={numCols}
            style={styles.flatList}
            data={listings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={numCols}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="search-outline" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>{t('noListings')}</Text>
                <Text style={styles.emptyText}>
                  {selectedCity ? t('noListingsInCity').replace('{city}', selectedCity) : t('noListings')}
                </Text>
              </View>
            }
          />
        )}
      </PageContainer>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', position: 'relative',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: Spacing.md, marginBottom: Spacing.sm, backgroundColor: colors.surface,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: Spacing.sm + 2, fontSize: FontSize.md, color: colors.textPrimary },
  promoWrap: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  chipRowOuter: { flexDirection: 'row', alignItems: 'center', paddingRight: Spacing.sm },
  catRow: { flex: 1, height: 40 },
  catRowContent: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: Spacing.xs },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  catChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  cityRow: { flex: 1, height: 44 },
  cityRowContent: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: Spacing.xs },
  cityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cityChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  cityChipTextActive: { color: '#fff' },
  activeFilter: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  activeFilterText: { flex: 1, fontSize: FontSize.xs, color: colors.textSecondary },
  clearFilter: { fontSize: FontSize.xs, color: colors.primary, fontWeight: '700' },
  flatList: { flex: 1, minHeight: 0 },
  list: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.xl, paddingTop: Spacing.xs },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  card: {
    flex: 1, backgroundColor: colors.surface, borderRadius: Radius.md, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1 },
  imagePlaceholder: { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  conditionBadge: {
    position: 'absolute', top: Spacing.xs, left: Spacing.xs,
    borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2,
  },
  conditionText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: Spacing.sm },
  cardTitle: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: 2, lineHeight: 18 },
  cardPrice: { fontSize: FontSize.md, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardMetaText: { fontSize: 11, color: colors.textSecondary },
  dot: { fontSize: 11, color: colors.border, marginHorizontal: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: colors.textSecondary, textAlign: 'center' },
});
