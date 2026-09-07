import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '@/context/I18nContext';
import { Lang, translations } from '@/constants/translations';
import { Logo } from '@/components/Logo';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

type LangOption = { code: Lang; label: string; nativeLabel: string; flag: string; desc: string };

const LANGS: LangOption[] = [
  { code: 'fr', label: 'Français', nativeLabel: 'Français', flag: '🇫🇷', desc: 'Continuer en français' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', desc: 'Continue in English' },
  { code: 'darija', label: 'Darija', nativeLabel: 'الدارجة المغربية', flag: '🇲🇦', desc: 'كمّل بالدارجة' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setLang } = useI18n();
  const [selected, setSelected] = useState<Lang>('fr');
  const st = translations[selected];

  const handleContinue = async () => {
    await setLang(selected);
    await AsyncStorage.setItem('onboarding_done', '1');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Dégradé décoratif */}
      <View style={styles.topDecor} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Logo size="lg" />
          <Text style={styles.welcome}>{st.onboardingWelcome}</Text>
          <Text style={styles.subtitle}>{st.onboardingSubtitle}</Text>
        </View>

        {/* Options de langue */}
        <View style={styles.langList}>
          {LANGS.map((lang) => {
            const active = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langCard, active && styles.langCardActive]}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.85}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langText}>
                  <Text style={[styles.langName, active && styles.langNameActive]}>{lang.nativeLabel}</Text>
                  <Text style={[styles.langDesc, active && styles.langDescActive]}>{lang.desc}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bouton continuer */}
        <TouchableOpacity style={styles.btn} onPress={handleContinue}>
          <Text style={styles.btnText}>{st.onboardingContinue}</Text>
        </TouchableOpacity>

        {/* Badge Maroc */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🇲🇦 {st.onboardingBadge}</Text>
        </View>
      </View>

      {/* Décorations bas */}
      <View style={styles.bottomDecor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topDecor: {
    position: 'absolute', top: -120, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.primary + '10',
  },
  bottomDecor: {
    position: 'absolute', bottom: -100, left: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.secondary + '08',
  },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center', maxWidth: 480, alignSelf: 'center', width: '100%' },
  logoSection: { alignItems: 'center', marginBottom: Spacing.xl * 1.5 },
  welcome: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.lg, fontWeight: '500' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  langList: { gap: Spacing.md, marginBottom: Spacing.xl },
  langCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 2, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  langCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '05' },
  langFlag: { fontSize: 32 },
  langText: { flex: 1 },
  langName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  langNameActive: { color: Colors.primary },
  langDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  langDescActive: { color: Colors.primary + 'AA' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.primary },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: Spacing.md + 2, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800', letterSpacing: 0.5 },
  badge: { alignItems: 'center', marginTop: Spacing.xl },
  badgeText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
