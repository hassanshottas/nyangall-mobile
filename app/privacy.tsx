import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, FontSize, ThemeColors } from '@/constants/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Responsable du traitement',
    body: "NyangAll est édité par Hassan Njoya, basé à Rabat, Maroc. Pour toute question relative à vos données personnelles, vous pouvez nous contacter à l'adresse : njoya.hassan91@gmail.com.",
  },
  {
    title: '2. Données collectées',
    body: "Nous collectons les données que vous nous fournissez directement : nom complet, numéro de téléphone, email (facultatif), ville, ainsi que le contenu que vous publiez (annonces, photos, messages). Nous collectons aussi automatiquement certaines données techniques (adresse IP, type d'appareil) nécessaires au bon fonctionnement du service.",
  },
  {
    title: '3. Finalité du traitement',
    body: "Ces données sont utilisées pour créer et gérer votre compte, permettre la mise en relation entre acheteurs et vendeurs, assurer la sécurité de la plateforme (modération des contenus, vérification des comptes) et améliorer nos services.",
  },
  {
    title: '4. Partage des données',
    body: "Vos données ne sont jamais vendues à des tiers. Votre nom et votre ville peuvent être visibles par les autres utilisateurs dans le cadre normal d'une transaction (annonces, messagerie). Certaines données techniques peuvent être partagées avec des prestataires techniques (hébergement, envoi de SMS) strictement nécessaires au fonctionnement du service.",
  },
  {
    title: '5. Conservation des données',
    body: "Vos données sont conservées tant que votre compte est actif. Vous pouvez supprimer votre compte et vos données à tout moment depuis l'application (Profil > Supprimer mon compte) ou sur la page https://nyangall-web.onrender.com/delete-account. La suppression est immédiate et définitive.",
  },
  {
    title: '6. Vos droits',
    body: "Vous pouvez à tout moment demander l'accès, la rectification ou la suppression de vos données personnelles en nous écrivant à njoya.hassan91@gmail.com.",
  },
  {
    title: '7. Cookies et données techniques',
    body: "Sur la version web, nous utilisons des outils de mesure d'audience (Google Analytics) afin de comprendre l'usage de l'application et l'améliorer. Ces outils ne collectent pas d'informations permettant de vous identifier personnellement.",
  },
  {
    title: '8. Modification de cette politique',
    body: "Cette politique de confidentialité peut être mise à jour. La date de dernière mise à jour est indiquée ci-dessous.",
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Head><title>Politique de confidentialité | NyangAll</title></Head>
      <Stack.Screen options={{ title: 'Politique de confidentialité', headerBackTitle: 'Retour' }} />
      <Text style={styles.mainTitle}>Politique de confidentialité</Text>
      <Text style={styles.updated}>Dernière mise à jour : septembre 2026</Text>
      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, maxWidth: 700, alignSelf: 'center', width: '100%' },
  mainTitle: { fontSize: FontSize.xl, fontWeight: '800', color: colors.textPrimary, marginBottom: Spacing.xs },
  updated: { fontSize: FontSize.sm, color: colors.textSecondary, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.xs },
  sectionBody: { fontSize: FontSize.sm, color: colors.textSecondary, lineHeight: 21 },
});
