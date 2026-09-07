import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { LogoMark } from './LogoMark';

type Props = { size?: 'sm' | 'header' | 'md' | 'lg'; light?: boolean; showTagline?: boolean };

const SIZES = {
  sm: { logo: 22, tagline: 10, dot: 8 },
  header: { logo: 27, tagline: 11, dot: 9 },
  md: { logo: 32, tagline: 12, dot: 12 },
  lg: { logo: 46, tagline: 14, dot: 16 },
};

export function Logo({ size = 'md', light = false, showTagline = true }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const s = SIZES[size];
  const tagColor = light ? 'rgba(255,255,255,0.75)' : colors.textSecondary;
  const badgeSize = s.logo * 1.2;

  return (
    <View style={styles.container}>
      {/* Icône */}
      <View style={[styles.icon, { width: badgeSize, height: badgeSize, borderRadius: badgeSize * 0.3, backgroundColor: colors.primary }]}>
        <LogoMark size={badgeSize * 0.62} />
      </View>

      {/* Nom */}
      <View style={styles.textBlock}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { fontSize: s.logo, color: colors.primary }]}>Nyang</Text>
          <Text style={[styles.name, { fontSize: s.logo, color: light ? '#fff' : colors.secondary }]}>All</Text>
        </View>
        {showTagline && <Text style={[styles.tagline, { fontSize: s.tagline, color: tagColor }]}>{t('appTagline')}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { justifyContent: 'center', alignItems: 'center' },
  textBlock: {},
  nameRow: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontWeight: '900', letterSpacing: -0.5 },
  tagline: { fontWeight: '500', marginTop: -2 },
});
