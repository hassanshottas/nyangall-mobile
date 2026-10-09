import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import { Logo } from '@/components/Logo';

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert(t('required'), t('requiredFieldsAlert'));
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err: any) {
      Alert.alert(t('error'), err?.response?.data?.error || t('loginErrorAlert'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <View style={styles.header}>
            <Logo size="lg" />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{t('login')}</Text>

            <Text style={styles.label}>{t('phone')}</Text>
            <TextInput
              style={styles.input}
              placeholder="06 00 00 00 00"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPasswordLink} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.link}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? t('signingIn') : t('signIn')}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('noAccount')} </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>{t('createAccount')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => router.push('/faq')}>
              <Text style={styles.legalLinkText}>{t('faqTitle')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={styles.legalLinkText}>{t('privacyTitle')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={styles.legalLinkText}>{t('termsTitle')}</Text>
            </TouchableOpacity>
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  inner: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 36, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  tagline: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: Spacing.xs },
  card: {
    backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: FontSize.md, color: colors.textPrimary, backgroundColor: colors.background, marginBottom: Spacing.md,
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md,
    backgroundColor: colors.background, marginBottom: Spacing.md,
  },
  passwordInput: { flex: 1, padding: Spacing.md, fontSize: FontSize.md, color: colors.textPrimary },
  eyeBtn: { paddingHorizontal: Spacing.md },
  forgotPasswordLink: { alignItems: 'flex-end', marginBottom: Spacing.sm },
  button: { backgroundColor: colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { fontSize: FontSize.sm, color: colors.textSecondary },
  link: { fontSize: FontSize.sm, color: colors.primary, fontWeight: '600' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.lg },
  legalLinkText: { fontSize: FontSize.xs, color: colors.textSecondary, textDecorationLine: 'underline' },
  legalDot: { fontSize: FontSize.xs, color: colors.textSecondary },
  versionText: { textAlign: 'center', fontSize: FontSize.xs, color: colors.textSecondary, marginTop: Spacing.md, opacity: 0.8 },
});
