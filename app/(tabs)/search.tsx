import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image, ScrollView,
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

type Category = { id: string; nameFr: string; nameEn: string; slug: string; icon: string };
type Listing = { id: string; title: string; priceMad: number; city: string; condition: string; photos: { url: string }[]; category: { nameFr: string; nameEn: string } };

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'El Jadida', 'Béni Mellal', 'Nador', 'Mohammedia'];

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const catName = (cat: { nameFr: string; nameEn: string }) => (lang === 'en' ? cat.nameEn : cat.nameFr);
  const { numCols, headerPT } = useResponsive();
  const styles = getStyles(colors);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showCities, setShowCities] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const doSearch = async (overrides?: { cat?: string; city?: string }) => {
    const cat = overrides?.cat !== undefined ? overrides.cat : selectedCategory;
    const city = overrides?.city !== undefined ? overrides.city : selectedCity;
    setLoading(true); setSearched(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (cat) params.category = cat;
      if (city) params.city = city;
      const { data } = await api.get('/listings', { params });
      setListings(data.listings);
    } finally { setLoading(false); }
  };

  const selectCity = (city: string) => {
    const next = city === selectedCity ? '' : city;
    setSelectedCity(next);
    setShowCities(false);
    doSearch({ city: next });
  };

  const selectCategory = (slug: string) => {
    const next = slug === selectedCategory ? '' : slug;
    setSelectedCategory(next);
    doSearch({ cat: next });
  };

  const activeFilters = [selectedCity, selectedCategory && catName(categories.find(c => c.slug === selectedCategory) || { nameFr: '', nameEn: '' })].filter(Boolean);

  const renderCard = ({ item }: { item: Listing }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/listing/${item.id}`)}>
      {item.photos[0]
        ? <Image source={{ uri: item.photos[0].url }} style={styles.cardImg} resizeMode="cover" accessibilityLabel={item.title} />
        : <View style={[styles.cardImg, styles.imgPlaceholder]}><Ionicons name="image-outline" size={28} color={colors.border} /></View>
      }
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardPrice}>{Number(item.priceMad).toLocaleString('fr-MA')} MAD</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
          <Text style={styles.cardMetaText}>{item.city}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.cardMetaText}>{t(item.condition as any) || ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PageContainer>
        <View style={[styles.header, { paddingTop: headerPT }]}>
          <Logo size="header" showTagline={false} />
        </View>

        {/* Barre de recherche + bouton ville */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchQuestion')}
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => doSearch()}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch()}>
            <Text style={styles.searchBtnText}>{t('searchBtn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Filtres ville + catégorie */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedCity && styles.filterPillActive]}
            onPress={() => setShowCities(!showCities)}
          >
            <Ionicons name="location-outline" size={14} color={selectedCity ? '#fff' : colors.textSecondary} />
            <Text style={[styles.filterPillText, selectedCity && styles.filterPillTextActive]}>
              {selectedCity || t('cityLabel')}
            </Text>
            <Ionicons name={showCities ? 'chevron-up' : 'chevron-down'} size={14} color={selectedCity ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScrollView} contentContainerStyle={styles.catScroll}>
            <TouchableOpacity
              style={[styles.catChip, !selectedCategory && styles.catChipActive]}
              onPress={() => selectCategory('')}
            >
              <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>{t('allShort')}</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, selectedCategory === cat.slug && styles.catChipActive]}
                onPress={() => selectCategory(cat.slug)}
              >
                <Text style={[styles.catChipText, selectedCategory === cat.slug && styles.catChipTextActive]}>
                  {cat.icon} {catName(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dropdown villes */}
        {showCities && (
          <View style={styles.cityDropdown}>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              <TouchableOpacity style={[styles.cityOption, !selectedCity && styles.cityOptionActive]} onPress={() => selectCity('')}>
                <Ionicons name="globe-outline" size={16} color={!selectedCity ? colors.primary : colors.textSecondary} />
                <Text style={[styles.cityOptionText, !selectedCity && styles.cityOptionTextActive]}>{t('allMorocco')}</Text>
                {!selectedCity && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
              {CITIES.map((city) => (
                <TouchableOpacity key={city} style={[styles.cityOption, selectedCity === city && styles.cityOptionActive]} onPress={() => selectCity(city)}>
                  <Ionicons name="location-outline" size={16} color={selectedCity === city ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.cityOptionText, selectedCity === city && styles.cityOptionTextActive]}>{city}</Text>
                  {selectedCity === city && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Résumé des filtres actifs */}
        {activeFilters.length > 0 && (
          <View style={styles.activeSummary}>
            <Ionicons name="funnel" size={13} color={colors.primary} />
            <Text style={styles.activeSummaryText}>{activeFilters.join(' · ')}</Text>
            <TouchableOpacity onPress={() => { setSelectedCity(''); setSelectedCategory(''); doSearch({ cat: '', city: '' }); }}>
              <Text style={styles.clearAll}>{t('clearAllFilters')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : searched ? (
          <FlatList
            key={numCols}
            style={styles.flatList}
            data={listings}
            keyExtractor={(i) => i.id}
            numColumns={numCols}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.results}
            renderItem={renderCard}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="search-outline" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>{t('noResults')}</Text>
                <Text style={styles.emptyText}>{t('noResultsDesc')}</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.center}>
            <Ionicons name="search-circle-outline" size={72} color={colors.border} />
            <Text style={styles.emptyTitle}>{t('findWhatYouNeed')}</Text>
            <Text style={styles.emptyText}>{t('searchHint')}</Text>
          </View>
        )}
      </PageContainer>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  header: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, paddingBottom: Spacing.sm },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: colors.surface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.sm + 2, fontSize: FontSize.md, color: colors.textPrimary },
  searchBtn: { backgroundColor: colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.md, justifyContent: 'center', height: 44 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  filtersRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterPillActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filterPillText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  filterPillTextActive: { color: '#fff' },
  catScrollView: { flexGrow: 0, height: 34 },
  catScroll: { alignItems: 'center', gap: Spacing.xs, paddingRight: Spacing.md },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  cityDropdown: {
    marginHorizontal: Spacing.md, backgroundColor: colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
    marginBottom: Spacing.sm, overflow: 'hidden',
  },
  cityOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  cityOptionActive: { backgroundColor: colors.primary + '08' },
  cityOptionText: { flex: 1, fontSize: FontSize.md, color: colors.textPrimary },
  cityOptionTextActive: { color: colors.primary, fontWeight: '600' },
  activeSummary: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs,
  },
  activeSummaryText: { flex: 1, fontSize: FontSize.xs, color: colors.textSecondary },
  clearAll: { fontSize: FontSize.xs, color: colors.primary, fontWeight: '700' },
  flatList: { flex: 1, minHeight: 0 },
  results: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.xl, paddingTop: Spacing.xs },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: Radius.md, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardImg: { width: '100%', aspectRatio: 1 },
  imgPlaceholder: { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
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
