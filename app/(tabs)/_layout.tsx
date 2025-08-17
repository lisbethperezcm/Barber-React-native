import Header from "@/components/ui/Header"; // ajusta la ruta a tu componente
import { Tabs, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Calendar, Home, User, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) {
          // Si no hay token, envía al login
          router.replace("/login");
          return;
        }
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  // Loader mientras verificamos el token
  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header fijo */}
      <Header notifications={3} />

      {/* Tabs visibles solo si hay token */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: "#E2B34D",
          tabBarInactiveTintColor: "#8A8A8A",
          tabBarStyle: {
            backgroundColor: "#fff",
            height: 56 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 6,
            borderTopWidth: 0,
            elevation: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Inicio", tabBarIcon: (p) => <Home {...p} /> }}
        />
        <Tabs.Screen
          name="citas"
          options={{ title: "Citas", tabBarIcon: (p) => <Calendar {...p} /> }}
        />
        <Tabs.Screen
          name="barberos"
          options={{ title: "Barberos", tabBarIcon: (p) => <Users {...p} /> }}
        />
        <Tabs.Screen
          name="perfil"
          options={{ title: "Perfil", tabBarIcon: (p) => <User {...p} /> }}
        />
        {/* Ocultar pestañas sobrantes */}
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="two" options={{ href: null }} />
        <Tabs.Screen name="booking/new" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
