import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { ThemeColors } from '@/constants/theme';

type Slide = { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; bg: string };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PromoBanner() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const [index, setIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(Math.min(SCREEN_WIDTH, 1100) - 32);
  const listRef = useRef<FlatList>(null);

  const slides: Slide[] = [
    { icon: 'megaphone', title: t('promo1Title'), subtitle: t('promo1Sub'), bg: colors.primary },
    { icon: 'shield-checkmark', title: t('promo2Title'), subtitle: t('promo2Sub'), bg: colors.secondary },
    { icon: 'flash', title: t('promo3Title'), subtitle: t('promo3Sub'), bg: colors.accent },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % slides.length;
        listRef.current?.scrollToOffset({ offset: next * containerWidth, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [containerWidth]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
    if (newIndex !== index) setIndex(newIndex);
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: containerWidth, offset: containerWidth * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg, width: containerWidth }]}>
            <View style={styles.decorCircleLg} />
            <View style={styles.decorCircleSm} />
            <View style={styles.slideIconWrap}>
              <Ionicons name={item.icon} size={26} color="#fff" />
            </View>
            <View style={styles.slideText}>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { width: '100%', marginTop: 4 },
  slide: {
    height: 100, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    overflow: 'hidden', position: 'relative',
  },
  decorCircleLg: { position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.12)' },
  decorCircleSm: { position: 'absolute', bottom: -20, right: 40, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.10)' },
  slideIconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  slideText: { flex: 1 },
  slideTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  slideSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 16 },
});
