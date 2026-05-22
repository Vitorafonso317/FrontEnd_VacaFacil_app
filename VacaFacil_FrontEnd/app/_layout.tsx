import { useEffect } from 'react';
import { View, Platform, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import {
  setupNotificationHandler,
  setupAndroidChannel,
  restoreNotifications,
} from '../services/notificationService';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { fonts } from '../constants/fonts';

// Aplica Inter como fonte padrão em todos os Text do app
(Text as any).defaultProps = (Text as any).defaultProps ?? {};
(Text as any).defaultProps.style = [
  { fontFamily: fonts.regular },
  (Text as any).defaultProps.style,
];

// Configura handler antes de qualquer render para receber notificações em background
setupNotificationHandler();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootNavigator() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Aguarda auth carregar E o roteador hidratar a URL (segments não vazio)
    if (loading || !segments.length) return;
    const inAuth = segments[0] === '(auth)';
    if (!token && !inAuth) router.replace('/(auth)/login');
    if (token && inAuth) router.replace('/(tabs)/dashboard');
  }, [token, loading, segments]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setupAndroidChannel();
      restoreNotifications();
    }
  }, []);

  // Bloqueia a Stack enquanto o auth não resolveu — evita flash de rota errada no web
  if (loading) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
