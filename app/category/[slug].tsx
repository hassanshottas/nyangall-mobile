import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Head } from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { PageContainer } from '@/components/PageContainer';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';

type Category = { id: string; nameFr: string; nameEn: string; slug: string; icon: string };
type Listing = { id: string; title: string; priceMad: number; city: string; condition: string; photos: { url: string }[] };

// Page dédiée par catégorie (SEO) : URL propre indexable (ex: /category/vehicules)
// listant les annonces de cette catégorie, avec titre/description spécifiques.
export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const catName = (cat: { nameFr: string; nameEn: string }) => (lang === 'en' ? cat.nameEn : cat.nameFr);
  const { numCols } = useResponsive();
  const styles = getStyles(colors);

  const [category, setCategory] = useState<Category | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: catData } = await api.get('/categories');
      const found = catData.categories.find((c: Category) => c.slug === slug);
      if (!active) return;
      setCategory(found || null);
      const { data: listData } = await api.get('/listings', { params: { category: slug } });
      if (!active) return;
      setListings(listData.listings);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug]);

  const title = category ? `${catName(category)} — Petites annonces au Maroc | NyangAll` : 'NyangAll';
  const description = category
    ? `Achetez et vendez des annonces de ${catName(category).toLowerCase()} partout au Maroc sur NyangAll, la marketplace 100% marocaine.`
    : undefined;

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
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Head>
      <Stack.Screen options={{ title: category ? catName(category) : 'Catégorie', headerBackTitle: 'Retour' }} />
      <PageContainer>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{category?.icon}</Text>
          <Text style={styles.headerTitle}>{category ? catName(category) : ''}</Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : (
          <FlatList
            key={numCols}
            data={listings}
            keyExtractor={(i) => i.id}
            numColumns={numCols}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.results}
            renderItem={renderCard}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="pricetags-outline" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>{t('noResults')}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  headerIcon: { fontSize: 28 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.textPrimary },
  results: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.xl },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: Radius.md, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardImg: { width: '100%', aspectRatio: 1 },
  imgPlaceholder: { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: Spacing.sm },
  cardTitle: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: 2, lineHeight: 18 },
  cardPrice: { fontSize: FontSize.md, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardMetaText: { fontSize: 11, color: colors.textSecondary },
});
