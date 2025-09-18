import { AuthContext } from "@/assets/src/context/AuthContext";
import api from "@/assets/src/lib/http";
import Loader from "@/components/Loader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLogout } from "../../assets/src/features/auth/useLogout";

export default function Perfil() {
  const { isBarber, loading } = useContext(AuthContext);
  const [user, setUser] = useState<any>(null);
  const [fetching, setFetching] = useState(false);

  // Hook de logout (función directa) + estado de loading para el botón
  const logout = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (loading) return;

    (async () => {
      try {
        setFetching(true);

        if (!isBarber) {
          // --- CLIENTE ---
          const raw = await SecureStore.getItemAsync("client");
          const clientId = raw;
          const res = await api.get(`/clients/${clientId}`);
          const payload = res.data?.data;

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
          const barberId: any = raw;
          const res2 = await api.get(`/barbers/${barberId}`);
          const payload2 = res2.data?.data;
          console.log(res2);
          setUser({
            firstName: payload2?.first_name ?? "",
            lastName: payload2?.last_name ?? "",
            email: payload2?.email ?? "",
            phone: payload2?.phone_number ?? "",
            address: payload2?.address ?? "",
            commission: payload2?.commission ?? "",
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

  const isLoadingUI = loading || fetching || !user;
  const initials = getInitials(user?.firstName, user?.lastName);

  // 👉 Mismo efecto visual que el login: loader, deshabilitado y mismo color
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout(); // tu hook limpia sesión/secure storage/etc.
      router.replace("/login");
    } catch (e) {
      console.log("Error al cerrar sesión:", e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <Text style={styles.header}>Mi Perfil</Text>

        {/* Tarjeta de perfil */}
        <View style={styles.profileCard}>
          {isLoadingUI ? (
            // 👇 Loader dentro de la tarjeta, mantiene layout y evita pantalla negra
            <View style={{ paddingVertical: 24, alignItems: "center", justifyContent: "center", width: "100%" }}>
              <Loader text="Cargando perfil..." />
            </View>
          ) : (
            <>
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

              {isBarber ? <View style={styles.infoRow}>
                <Ionicons name="cut-outline" size={22} color={COLORS.textMuted} />
                <Text style={styles.infoText}>
                  {user.commission ? `${user.commission}%` : "-"}
                </Text>

              </View> : null}
            </>
          )}
        </View>

        <View style={{ flex: 1 }} />

        {/* Botón cambiar contraseña */}
        <TouchableOpacity
          style={[styles.changePasswordBtn, (isLoadingUI || isLoggingOut) && { opacity: 0.6 }]}
          disabled={isLoadingUI || isLoggingOut}
          onPress={() => {
            router.push("/changePassword");
            console.log("Ir a cambiar contraseña");
          }}
        >
          <Ionicons name="key-outline" size={22} color={COLORS.text} />
          <View style={{ flex: 1 }}>
            <Text style={styles.changePasswordTitle}>Cambiar Contraseña</Text>
            <Text style={styles.changePasswordSubtitle}>Actualizar tu contraseña de acceso</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Botón cerrar sesión — MISMA LÓGICA QUE LOGIN */}
        <TouchableOpacity
          style={[styles.logoutBtn, (isLoadingUI || isLoggingOut) && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={isLoadingUI || isLoggingOut}
          activeOpacity={isLoggingOut ? 1 : 0.85}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(first?: string, last?: string) {
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
    minHeight: 220, // 👈 asegura altura para que el Loader se vea centrado
    overflow: "hidden",
  },
  avatar: {
    width: 100, height: 100, borderRadius: 999, backgroundColor: "#E9FCEB",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  avatarText: { fontSize: 40, fontWeight: "800", color: COLORS.accent },
  name: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  role: { fontSize: 16, color: COLORS.textMuted, marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14, alignSelf: "stretch" },
  infoText: { fontSize: 16, color: COLORS.text, flexShrink: 1 },

  // Logout
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16,
    gap: 10, marginHorizontal: 16, marginBottom: 32,
  },
  // Mantiene color; opcional un leve cambio de opacidad como en login
  logoutBtnDisabled: {
    opacity: 0.9,
  },
  logoutText: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },

  // Change password
  changePasswordBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  changePasswordTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  changePasswordSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
