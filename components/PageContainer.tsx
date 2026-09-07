import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

type Props = { children: React.ReactNode; style?: ViewStyle; centered?: boolean };

export function PageContainer({ children, style, centered = false }: Props) {
  const { MAX_WIDTH } = useResponsive();
  return (
    <View style={[styles.outer, centered && styles.centered]}>
      <View style={[styles.inner, { maxWidth: MAX_WIDTH }, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, width: '100%', alignItems: 'center' },
  centered: { justifyContent: 'center' },
  inner: { flex: 1, width: '100%' },
});
