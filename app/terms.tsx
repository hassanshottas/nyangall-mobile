import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Head } from 'expo-router/head';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, FontSize, ThemeColors } from '@/constants/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Objet',
    body: "Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de l'application et du site NyangAll, édités par Hassan Njoya (Rabat, Maroc). En créant un compte, vous acceptez ces conditions.",
  },
  {
    title: '2. Description du service',
    body: "NyangAll est une plateforme de petites annonces entre particuliers (marketplace C2C) permettant de publier, consulter et échanger des annonces de vente pour divers types de biens et services partout au Maroc.",
  },
  {
    title: '3. Création de compte',
    body: "L'inscription nécessite un numéro de téléphone valide et un mot de passe. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.",
  },
  {
    title: '4. Règles de publication',
    body: "Les annonces doivent être honnêtes, légales et correspondre à des biens ou services réels que vous êtes en droit de vendre. Sont interdits : les contenus frauduleux, les biens illégaux ou contrefaits, les images inappropriées ou choquantes, et l'usurpation d'identité. Toute photo publiée est automatiquement vérifiée par un système de modération.",
  },
  {
    title: '5. Transactions entre utilisateurs',
    body: "NyangAll met en relation acheteurs et vendeurs mais n'est pas partie à la transaction elle-même. Les modalités de paiement, de livraison et de garantie sont à convenir directement entre les utilisateurs. Nous recommandons la prudence et la vérification de l'identité et des biens avant toute transaction.",
  },
  {
    title: '6. Comptes certifiés',
    body: "Un badge de certification est attribué automatiquement aux comptes ayant réalisé au moins 5 ventes conclues via la plateforme, comme indicateur de confiance pour les autres utilisateurs.",
  },
  {
    title: '7. Suspension et suppression de compte',
    body: "NyangAll se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces conditions, ou publiant des contenus signalés et jugés inappropriés après vérification.",
  },
  {
    title: '8. Responsabilité',
    body: "NyangAll ne garantit pas l'exactitude des annonces publiées par les utilisateurs et ne peut être tenu responsable des litiges entre acheteurs et vendeurs. Le service est fourni \"en l'état\", sans garantie de disponibilité continue.",
  },
  {
    title: '9. Modification des CGU',
    body: "Ces conditions peuvent être modifiées à tout moment. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles conditions.",
  },
  {
    title: '10. Contact',
    body: "Pour toute question relative à ces conditions, contactez-nous à njoya.hassan91@gmail.com.",
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Head><title>Conditions générales d'utilisation | NyangAll</title></Head>
      <Stack.Screen options={{ title: 'Conditions générales', headerBackTitle: 'Retour' }} />
      <Text style={styles.mainTitle}>Conditions générales d'utilisation</Text>
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
