import { useEffect, useRef } from 'react';
import { View, Platform, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from '../services/offlineQueue';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { ToastProvider } from '../context/ToastContext';
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

// Base font family — AccessibilityContext updates this when large text is toggled
(Text as any).defaultProps = (Text as any).defaultProps ?? {};
(Text as any).defaultProps.style = [{ fontFamily: fonts.regular }];

SplashScreen.preventAutoHideAsync();

setupNotificationHandler();

const CACHE_MAX_AGE = 24 * 60 * 60_000; // 24 horas

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: CACHE_MAX_AGE,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@vacafacil:query-cache',
  throttleTime: 1_000,
});

function RootNavigator() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const wasOffline = useRef(false);

  useEffect(() => {
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

  useEffect(() => {
    if (!token) return;
    const unsub = NetInfo.addEventListener(state => {
      const isOnline = !!state.isConnected && !!state.isInternetReachable;
      if (isOnline && wasOffline.current) {
        wasOffline.current = false;
        processQueue().then(({ success }) => {
          if (success > 0) {
            queryClient.invalidateQueries({ queryKey: ['producao'] });
          }
        });
      }
      if (!isOnline) wasOffline.current = true;
    });
    return unsub;
  }, [token]);

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

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AccessibilityProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: CACHE_MAX_AGE,
          dehydrateOptions: {
            shouldDehydrateQuery: query => query.state.status === 'success',
          },
        }}
      >
        <AuthProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </AccessibilityProvider>
  );
}
