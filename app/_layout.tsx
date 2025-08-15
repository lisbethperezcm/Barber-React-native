import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native'; // o tu hook
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css'; // ajusta la ruta según dónde tengas el archivo

const queryClient = new QueryClient();

export default function RootLayout() {
  const scheme = useColorScheme(); // 'light' | 'dark'

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null; // o un loader

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider value={scheme === 'dark' ?  DefaultTheme : DarkTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
          <Stack.Screen name="+not-found" /> {/* si tu archivo se llama +not-found.tsx */}
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
      </QueryClientProvider>
  );
}
