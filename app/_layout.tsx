import NetInfo from '@react-native-community/netinfo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from "@tanstack/react-query";
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import './global.css';

import { AuthProvider } from "@/assets/src/context/AuthContext";

// ✅ Config global de React Query (refetch en foco/reconexión/mount)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
      staleTime: 10_000,
    },
  },
});

// 🔌 Bridge: conecta AppState (foreground/background) y red con React Query
function ReactQueryAppStateBridge() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    const unsubNet = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(!!state.isConnected);
    });
    return () => {
      sub.remove();
      unsubNet();
    };
  }, []);
  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme(); // 'light' | 'dark'

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null; // o tu Loader

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryAppStateBridge />
      {/* 🌓 Corrige el tema: si es dark -> DarkTheme */}
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </SafeAreaView>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
