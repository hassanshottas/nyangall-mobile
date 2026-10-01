import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';

const FAQS = [
  { q: "Comment publier une annonce sur NyangAll ?", a: "Depuis l'onglet \"Vendre\", remplissez le titre, la description, le prix, la catégorie et ajoutez jusqu'à plusieurs photos depuis votre galerie. Votre annonce est publiée immédiatement après vérification automatique des photos." },
  { q: "NyangAll est-il gratuit ?", a: "Oui, la création de compte et la publication d'annonces sont entièrement gratuites." },
  { q: "Comment contacter un vendeur ?", a: "Ouvrez l'annonce qui vous intéresse et appuyez sur le bouton de messagerie pour démarrer une conversation directement avec le vendeur." },
  { q: "Comment fonctionne le paiement ?", a: "NyangAll met en relation acheteurs et vendeurs mais n'intervient pas dans le paiement. Les modalités (paiement à la livraison, en main propre, etc.) sont à convenir directement entre les deux parties." },
  { q: "Qu'est-ce que le badge \"certifié\" sur un profil ?", a: "Ce badge est attribué automatiquement aux vendeurs ayant déjà conclu au moins 5 ventes sur la plateforme. Il indique un vendeur actif et expérimenté." },
  { q: "Comment supprimer mon annonce ?", a: "Depuis la page de votre annonce ou votre profil, appuyez sur \"Supprimer l'annonce\". Cette action est définitive." },
  { q: "Que faire si je reçois un message suspect ?", a: "Ne communiquez jamais vos informations bancaires ou mots de passe. Vous pouvez signaler un utilisateur ou une annonce directement depuis l'application." },
  { q: "L'application est-elle disponible partout au Maroc ?", a: "Oui, NyangAll est accessible depuis n'importe quelle ville du Maroc, aussi bien sur mobile que sur le web." },
];

export default function FaqScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Head>
        <title>Questions fréquentes (FAQ) | NyangAll</title>
        <meta name="description" content="Retrouvez les réponses aux questions les plus fréquentes sur NyangAll : publier une annonce, contacter un vendeur, paiement, sécurité et badge certifié." />
      </Head>
      <Stack.Screen options={{ title: 'Questions fréquentes', headerBackTitle: 'Retour' }} />
      <Text style={styles.mainTitle}>Questions fréquentes</Text>
      {FAQS.map((item, i) => {
        const open = openIndex === i;
        return (
          <TouchableOpacity key={item.q} style={styles.item} onPress={() => setOpenIndex(open ? null : i)} activeOpacity={0.7}>
            <View style={styles.itemHeader}>
              <Text style={styles.question}>{item.q}</Text>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </View>
            {open && <Text style={styles.answer}>{item.a}</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, maxWidth: 700, alignSelf: 'center', width: '100%' },
  mainTitle: { fontSize: FontSize.xl, fontWeight: '800', color: colors.textPrimary, marginBottom: Spacing.lg },
  item: { backgroundColor: colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  question: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: colors.textPrimary },
  answer: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20 },
});
