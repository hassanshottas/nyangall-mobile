import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import { Logo } from '@/components/Logo';

const CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir',
  'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Salé', 'Nador',
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);

  const set = (key: string) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.fullName || !form.phone || !form.password || !form.city) {
      Alert.alert(t('required'), t('fillRequiredFields'));
      return;
    }
    if (form.password.length < 6) {
      Alert.alert(t('passwordTooShortTitle'), t('passwordTooShortMsg'));
      return;
    }
    setLoading(true);
    try {
      await register({ fullName: form.fullName, phone: form.phone, password: form.password, city: form.city, email: form.email || undefined });
    } catch (err: any) {
      const msg = err?.response?.data?.error || t('registerError');
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
        <View style={styles.header}>
          <Logo size="lg" />
          <Text style={styles.tagline}>{t('freeAccountTagline')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t('register')}</Text>

          <Text style={styles.label}>{t('fullNameRequired')}</Text>
          <TextInput style={styles.input} placeholder={t('fullNamePlaceholder')} placeholderTextColor={colors.textSecondary} value={form.fullName} onChangeText={set('fullName')} autoCapitalize="words" />

          <Text style={styles.label}>{t('phoneRequired')}</Text>
          <TextInput style={styles.input} placeholder="06 00 00 00 00" placeholderTextColor={colors.textSecondary} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />

          <Text style={styles.label}>{t('email')}</Text>
          <TextInput style={styles.input} placeholder="exemple@gmail.com" placeholderTextColor={colors.textSecondary} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>{t('cityRequired')}</Text>
          <TouchableOpacity style={[styles.input, styles.picker]} onPress={() => setShowCities(!showCities)}>
            <Text style={form.city ? styles.pickerText : styles.pickerPlaceholder}>
              {form.city || t('selectYourCity')}
            </Text>
            <Text style={styles.chevron}>{showCities ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showCities && (
            <View style={styles.dropdown}>
              {/* ScrollView imbriqué : sur Android, une View à hauteur limitée ne défile pas */}
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {CITIES.map((city) => (
                  <TouchableOpacity key={city} style={styles.dropdownItem} onPress={() => { set('city')(city); setShowCities(false); }}>
                    <Text style={[styles.dropdownText, form.city === city && styles.dropdownTextActive]}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>{t('passwordRequired')}</Text>
          <TextInput style={styles.input} placeholder={t('passwordMinChars')} placeholderTextColor={colors.textSecondary} value={form.password} onChangeText={set('password')} secureTextEntry />

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? t('creating') : t('createAccount')}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('alreadyAccount')} </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={styles.link}>{t('signIn')}</Text></TouchableOpacity>
            </Link>
          </View>
        </View>

        <Text style={styles.versionText}>
          NyangAll v{Constants.expoConfig?.version ?? '1.0.0'}  ·  by Liberty.Grp
        </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceAlt },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  inner: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 36, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  tagline: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: Spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, color: colors.textPrimary, backgroundColor: colors.background, marginBottom: Spacing.md },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: FontSize.md, color: colors.textPrimary },
  pickerPlaceholder: { fontSize: FontSize.md, color: colors.textSecondary },
  chevron: { fontSize: 12, color: colors.textSecondary },
  dropdown: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, marginTop: -Spacing.md, marginBottom: Spacing.md, overflow: 'hidden' },
  dropdownScroll: { maxHeight: 220 },
  dropdownItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownText: { fontSize: FontSize.md, color: colors.textPrimary },
  dropdownTextActive: { color: colors.primary, fontWeight: '700' },
  button: { backgroundColor: colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { fontSize: FontSize.sm, color: colors.textSecondary },
  link: { fontSize: FontSize.sm, color: colors.primary, fontWeight: '600' },
  versionText: { textAlign: 'center', fontSize: FontSize.xs, color: colors.textSecondary, marginTop: Spacing.lg, opacity: 0.8 },
});
