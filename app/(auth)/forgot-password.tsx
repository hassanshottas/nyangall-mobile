import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';
import { Logo } from '@/components/Logo';
import api from '@/services/api';

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') { (window as any).alert(`${title}\n\n${message}`); return; }
    Alert.alert(title, message);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      notify(t('required'), t('forgotPasswordEmailRequired'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      notify(t('success'), t('codeSentMsg'));
      router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } });
    } catch (err: any) {
      notify(t('error'), err?.response?.data?.error || t('forgotPasswordEmailRequired'));
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
            <Text style={styles.title}>{t('forgotPasswordTitle')}</Text>
            <Text style={styles.desc}>{t('forgotPasswordDesc')}</Text>

            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@gmail.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>{t('sendCode')}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.footer} onPress={() => router.back()}>
              <Text style={styles.link}>{t('backToLogin')}</Text>
            </TouchableOpacity>
          </View>
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
  card: {
    backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.sm },
  desc: { fontSize: FontSize.sm, color: colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: FontSize.md, color: colors.textPrimary, backgroundColor: colors.background, marginBottom: Spacing.md,
  },
  button: { backgroundColor: colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: Spacing.lg },
  link: { fontSize: FontSize.sm, color: colors.primary, fontWeight: '600' },
});
