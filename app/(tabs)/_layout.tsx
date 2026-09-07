import { Tabs } from 'expo-router';
import { Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SwipeableTabs } from '@/components/SwipeableTabs';

export default function TabsLayout() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { colors } = useTheme();
  const avatarUrl = (user as any)?.avatarUrl;
  return (
    <SwipeableTabs>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.surface },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('search'),
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
<Tabs.Screen
        name="sell"
        options={{
          title: t('sell'),
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('messages'),
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size, focused }) =>
            avatarUrl ? (
              <View style={[styles.avatarWrap, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderColor: focused ? color : 'transparent' }]}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              </View>
            ) : (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
        }}
      />
    </Tabs>
    </SwipeableTabs>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { borderWidth: 1.5, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
});
