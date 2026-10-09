import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, FontSize, Radius, ThemeColors } from '@/constants/theme';

// Page publique (aussi accessible sans être connecté) : son URL web est celle
// déclarée à Google Play pour la suppression de compte.
export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const confirm = (onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if ((window as any).confirm(t('deleteAccountConfirmMsg'))) onConfirm();
      return;
    }
    Alert.alert(t('deleteAccount'), t('deleteAccountConfirmMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('deleteAccountButton'), style: 'destructive', onPress: onConfirm },
    ]);
  };

  const submit = async () => {
    setError('');
    if (!phone.trim() || !password) {
      setError(t('requiredFieldsAlert'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/delete-account', { phone: phone.trim(), password });
      if (user) await logout();
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Head><title>Supprimer mon compte | NyangAll</title></Head>
      <Stack.Screen
        options={{
          headerShown: true, title: t('deleteAccount'), headerBackTitle: 'Retour',
          headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
      <Text style={styles.mainTitle}>{t('deleteAccountTitle')}</Text>

      {done ? (
        <View style={styles.doneBox}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.doneText}>{t('deleteAccountDone')}</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.secondaryText}>OK</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.body}>{t('deleteAccountIntro')}</Text>
          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <Text style={styles.warningText}>{t('deleteAccountWhat')}</Text>
          </View>

          <Text style={styles.label}>{t('phone')}</Text>
          <TextInput
            style={styles.input} value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" autoComplete="tel" placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input} value={password} onChangeText={setPassword}
            secureTextEntry autoComplete="password" placeholderTextColor={colors.textSecondary}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={[styles.deleteBtn, loading && { opacity: 0.6 }]} disabled={loading} onPress={() => confirm(submit)}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.deleteText}>{t('deleteAccountButton')}</Text>}
          </TouchableOpacity>

          <Text style={styles.help}>{t('deleteAccountHelp')}</Text>
        </>
      )}
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, maxWidth: 560, alignSelf: 'center', width: '100%' },
  mainTitle: { fontSize: FontSize.xl, fontWeight: '800', color: colors.textPrimary, marginBottom: Spacing.md },
  body: { fontSize: FontSize.md, color: colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  warning: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: colors.error + '14', borderWidth: 1, borderColor: colors.error + '55', marginBottom: Spacing.lg,
  },
  warningText: { flex: 1, fontSize: FontSize.sm, color: colors.textPrimary, lineHeight: 20 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textPrimary, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: FontSize.md, color: colors.textPrimary, backgroundColor: colors.surface, marginBottom: Spacing.md,
  },
  error: { color: colors.error, fontSize: FontSize.sm, marginBottom: Spacing.md },
  deleteBtn: { backgroundColor: colors.error, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  help: { fontSize: FontSize.sm, color: colors.textSecondary, lineHeight: 20, marginTop: Spacing.lg },
  doneBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  doneText: { fontSize: FontSize.md, color: colors.textPrimary, textAlign: 'center', lineHeight: 22 },
  secondaryBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl },
  secondaryText: { color: colors.primary, fontWeight: '700', fontSize: FontSize.md },
});
