import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

type Props = { size?: number; withLabel?: boolean };

// Badge "compte vérifié" — affiché pour les vendeurs ayant réalisé au moins
// 5 ventes (User.isVerified côté backend).
export function VerifiedBadge({ size = 15, withLabel = false }: Props) {
  const { colors } = useTheme();
  if (!withLabel) {
    return <Ionicons name="checkmark-circle" size={size} color={colors.secondary} />;
  }
  return (
    <View style={styles.row}>
      <Ionicons name="checkmark-circle" size={size} color={colors.secondary} />
      <Text style={[styles.label, { color: colors.secondary, fontSize: size * 0.75 }]}>Vérifié</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { fontWeight: '700' },
});
