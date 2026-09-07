import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/context/I18nContext';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { Logo } from '@/components/Logo';
import api from '@/services/api';

export default function ResetPasswordScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') { (window as any).alert(`${title}\n\n${message}`); return; }
    Alert.alert(title, message);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !code.trim() || !newPassword) {
      notify(t('required'), t('fillRequiredFields'));
      return;
    }
    if (newPassword.length < 6) {
      notify(t('passwordTooShortTitle'), t('passwordTooShortMsg'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), code: code.trim(), newPassword });
      notify(t('success'), t('resetPasswordSuccess'));
      router.replace('/(auth)/login');
    } catch (err: any) {
      notify(t('error'), err?.response?.data?.error || t('resetPasswordError'));
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
            <Text style={styles.title}>{t('resetPasswordTitle')}</Text>
            <Text style={styles.desc}>{t('resetPasswordDesc')}</Text>

            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@gmail.com"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>{t('codeLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('codePlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text style={styles.label}>{t('newPassword')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>{t('resetPasswordBtn')}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.footer} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.link}>{t('backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  inner: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  desc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary, backgroundColor: Colors.background, marginBottom: Spacing.md,
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.background, marginBottom: Spacing.md,
  },
  passwordInput: { flex: 1, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary },
  eyeBtn: { paddingHorizontal: Spacing.md },
  button: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: Spacing.lg },
  link: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
});
