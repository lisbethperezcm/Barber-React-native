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
  const [isBarber, setIsBarber] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        // Lecturas tolerantes
        const role = (await SecureStore.getItemAsync("role")) || "";
        const roleId = (await SecureStore.getItemAsync("role_id")) || "";
        const isBarberFlag = (await SecureStore.getItemAsync("isBarber")) || "";
        const userJson = (await SecureStore.getItemAsync("user")) || "";

        let roleFromUser = "";
        try {
          const u = userJson ? JSON.parse(userJson) : null;
          // soporta user.role.name o user.roles[0].name
          roleFromUser =
            (u?.role?.name as string) ||
            (Array.isArray(u?.roles) && u.roles[0]?.name) ||
            (u?.role as string) ||
            "";
        } catch {
          // ignore
        }

        const normalized = (s: string) => (s || "").toString().trim().toLowerCase();

        const barber =
          ["barber", "barbero"].includes(normalized(role)) ||
          ["barber", "barbero"].includes(normalized(roleFromUser)) ||
          roleId === "2" ||
          normalized(isBarberFlag) === "true";

        // Debug rápido (puedes quitarlo luego)
        console.log({
          role,
          roleId,
          isBarberFlag,
          roleFromUser,
          resolvedIsBarber: barber,
        });

        setIsBarber(!!barber);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

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

      {/* Tabs */}
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

        {/* HORARIOS: un solo Screen; se oculta con href:null si no es barbero */}
        <Tabs.Screen
          name="horarios"  // <-- debe existir app/(tabs)/horarios.tsx
          options={{
            title: "Horarios",
            tabBarIcon: (p) => <Calendar {...p} />,
            href: isBarber ? "/(tabs)/horarios" : null,
          }}
        />

        <Tabs.Screen
          name="barberos"
          options={{
            title: "Barberos", tabBarIcon: (p) => <Users {...p} />,
            href: isBarber ? null : "/(tabs)/barberos",
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{ title: "Perfil", tabBarIcon: (p) => <User {...p} /> }}
        />
        

        {/* Ocultar pestañas sobrantes */}
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="two" options={{ href: null }} />
        <Tabs.Screen name="booking/new" options={{ href: null }} />
        <Tabs.Screen name="servicios" options={{ href: null }} />
        <Tabs.Screen name="notificaciones" options={{ href: null }} />
       
        <Tabs.Screen name="despachos" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="despachos/[id]" options={{ href: null, headerShown: false }} />

      </Tabs>
    </View>
  );
}
