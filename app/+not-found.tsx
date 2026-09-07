import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Head } from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import { Logo } from '@/components/Logo';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Head><title>Page introuvable | NyangAll</title></Head>
      <Stack.Screen options={{ headerShown: false }} />
      <Logo size="lg" />
      <Ionicons name="compass-outline" size={72} color={colors.border} style={{ marginTop: Spacing.lg }} />
      <Text style={styles.title}>Oups, cette page n'existe pas</Text>
      <Text style={styles.text}>Le lien est peut-être expiré ou l'annonce n'est plus disponible. Reviens à l'accueil pour continuer tes achats et ventes.</Text>
      <Link href="/(tabs)" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: colors.background, gap: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: colors.textPrimary, marginTop: Spacing.md, textAlign: 'center' },
  text: { fontSize: FontSize.md, color: colors.textSecondary, textAlign: 'center', maxWidth: 420, marginBottom: Spacing.lg },
  button: { backgroundColor: colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
