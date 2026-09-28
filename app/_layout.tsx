import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { I18nProvider } from '@/context/I18nContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then((val) => {
      setOnboardingDone(!!val);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    (async () => {
      // Relit l'état à chaque changement d'écran : l'onboarding écrit directement
      // dans AsyncStorage, ce composant ne le sait pas sinon (sinon boucle infinie
      // de redirection vers /onboarding juste après l'avoir terminé).
      const stored = await AsyncStorage.getItem('onboarding_done');
      const done = !!stored;
      if (done !== onboardingDone) setOnboardingDone(done);

      const inAuth = segments[0] === '(auth)';
      const inOnboarding = segments[0] === 'onboarding';

      if (!done && !inOnboarding) {
        router.replace('/onboarding');
      } else if (done && !user && !inAuth) {
        router.replace('/(auth)/login');
      } else if (done && user && inAuth) {
        router.replace('/(tabs)');
      }
    })();
  }, [user, isLoading, segments]);

  if (isLoading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="listing/[id]"
        options={{
          headerShown: true, title: 'Annonce', headerBackTitle: 'Retour',
          headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
      <Stack.Screen
        name="conversation/[id]"
        options={{
          headerShown: true, headerBackTitle: 'Retour',
          headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
    </Stack>
  );
}

function StatusBarWithTheme() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <StatusBarWithTheme />
            <RootLayoutNav />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
