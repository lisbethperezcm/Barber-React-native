import { AuthContext } from "@/assets/src/context/AuthContext";
import api from "@/assets/src/lib/http";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLogout } from "../../assets/src/features/auth/useLogout";

export default function Perfil() {
  const { isBarber, role, loading } = useContext(AuthContext);
  const [user, setUser] = useState<any>(null);
  const [fetching, setFetching] = useState(false);
  const logout = useLogout();
  useEffect(() => {
    if (loading) return;

    (async () => {
      try {
        setFetching(true);

        if (!isBarber) {
          // --- CLIENTE ---
          const raw = await SecureStore.getItemAsync("client");


          let clientId = raw;

          const res = await api.get(`/clients/${clientId}`);

          const payload = res.data?.data; // << objeto real

          console.log(payload);

          setUser({
            firstName: payload?.first_name ?? "",
            lastName: payload?.last_name ?? "",
            email: payload?.email ?? "",
            phone: payload?.phone_number ?? "",
            address: payload?.address ?? "",
            role: "Cliente",
          });
        } else {
          // --- BARBERO ---
          const raw = await SecureStore.getItemAsync("barber");
          console.log("Barber raw:", raw);

          let barberId: any;
          barberId = raw;
          console.log("Barber ID:", barberId);
          const res2 = await api.get(`/barbers/${barberId}`);

          const payload2 = res2.data?.data; // << objeto real

          console.log(payload2);

          setUser({
            firstName: payload2?.first_name ?? "",
            lastName: payload2?.last_name ?? "",
            email: payload2?.email ?? "",
            phone: "",          // no aplica para barbero en tu payload
            address: "",        // no aplica para barbero en tu payload
            role: "Barbero",
          });


        }
      } catch (e) {
        console.log("Error cargando perfil:", e);
        setUser(null);
      } finally {
        setFetching(false);
      }
    })();
  }, [isBarber, loading]);




  if (loading || fetching || !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Cargando perfil…</Text>
      </View>
    );
  }

  const initials = getInitials(user.firstName, user.lastName);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <Text style={styles.header}>Mi Perfil</Text>

        {/* Tarjeta de perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.role}>{user.role}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={22} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={22} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{user.phone || "-"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={22} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{user.address || "-"}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Botón cerrar sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(first: string, last: string) {
  const f = (first || "").trim().charAt(0).toUpperCase();
  const l = (last || "").trim().charAt(0).toUpperCase();
  return `${f}${l}`;
}

const COLORS = {
  bg: "#F7F7F8",
  text: "#0F172A",
  textMuted: "#6B7280",
  brand: "#0F172A",
  accent: "#16A34A",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    fontSize: 26, fontWeight: "800", color: COLORS.text,
    marginTop: 20, marginBottom: 24, marginHorizontal: 16,
  },
  profileCard: {
    alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 20,
    paddingVertical: 32, paddingHorizontal: 20, marginHorizontal: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3, marginBottom: 32,
  },
  avatar: {
    width: 100, height: 100, borderRadius: 999, backgroundColor: "#E9FCEB",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  avatarText: { fontSize: 40, fontWeight: "800", color: COLORS.accent },
  name: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  role: { fontSize: 16, color: COLORS.textMuted, marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  infoText: { fontSize: 16, color: COLORS.text, flexShrink: 1 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16,
    gap: 10, marginHorizontal: 16, marginBottom: 32,
  },
  logoutText: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },
});
