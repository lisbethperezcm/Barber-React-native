import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLogout } from "../../assets/src/features/auth/useLogout";


// ⚠️ Datos simulados — reemplazar por hook de auth / API real
const MOCK_USER = {
  firstName: "Ana",
  lastName: "Pérez",
  role: "Cliente",
  email: "ana.perez@example.com",
  phone: "+1 809-555-1234",
  address: "Av. Principal #123, Santo Domingo",
};

export default function Perfil() {
  const logout = useLogout();
  const initials = getInitials(MOCK_USER.firstName, MOCK_USER.lastName);

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
            {MOCK_USER.firstName} {MOCK_USER.lastName}
          </Text>
          <Text style={styles.role}>{MOCK_USER.role}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={22} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{MOCK_USER.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={22} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{MOCK_USER.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={22} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{MOCK_USER.address}</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    fontSize: 26, // más grande
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 24,
    marginHorizontal: 16, // alineado con tarjeta/botón
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 32, // más espacio interno
    paddingHorizontal: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 32,
  },
  avatar: {
    width: 100, // más grande
    height: 100,
    borderRadius: 999,
    backgroundColor: "#E9FCEB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 40, // iniciales grandes
    fontWeight: "800",
    color: COLORS.accent,
  },
  name: {
    fontSize: 22, // más grande
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  role: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  infoText: {
    fontSize: 16, // más grande
    color: COLORS.text,
    flexShrink: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18, // más grande
  },
});