// components/dashboards/BarberDashboard.tsx
import { AuthContext } from "@/assets/src/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function BarberDashboard() {
  const router = useRouter();
  const { userName } = useContext(AuthContext);

  const userFirstName = ((userName ?? "").trim().split(/\s+/)[0]) || "";

console.log("UserName in BarberDashboard:", userFirstName);
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Saludo */}
      <View style={s.helloRow}>
        <View style={s.avatar}><Text style={s.avatarTxt}>JC</Text></View>
        <View>
          <Text style={s.hello}>Hola,{userFirstName} 👋</Text>
          <Text style={s.sub}>¿Listo para atender a tus clientes?</Text>
        </View>
      </View>

      {/* KPIs destacados */}
      <View style={s.kpiCard}>
        <View style={s.kpiCol}>
          <Text style={s.kpiMuted}>Ingresos estimados</Text>
          <Text style={s.kpiValue}>$2,800</Text>
        </View>
        <View style={s.kpiColRight}>
          <Text style={s.kpiMuted}>Tienes</Text>
          <Text style={s.kpiValue}>5 citas hoy</Text>
        </View>
      </View>

      {/* Totales del día */}
      <View style={s.smallRow}>
        <View style={[s.smallCard, { borderColor: "#DBEAFE" }]}>
          <Text style={[s.smallNumber, { color: "#2563EB" }]}>5</Text>
          <Text style={s.smallLabel}>Citas Hoy</Text>
        </View>
        <View style={[s.smallCard, { borderColor: "#DCFCE7" }]}>
          <Text style={[s.smallNumber, { color: "#16A34A" }]}>2</Text>
          <Text style={s.smallLabel}>Completadas</Text>
        </View>
        <View style={[s.smallCard, { borderColor: "#FFE4E6" }]}>
          <Text style={[s.smallNumber, { color: "#F97316" }]}>3</Text>
          <Text style={s.smallLabel}>Pendientes</Text>
        </View>
      </View>

      {/* CTA principal */}
      <Pressable style={s.cta} onPress={() => router.push("/(tabs)/booking/new")}>
        <Text style={s.ctaText}>Reservar Cita</Text>
      </Pressable>

      {/* Acceso Rápido */}
      <Text style={s.sectionTitle}>Acceso Rápido</Text>
      <View style={s.quickRow}>
        <Pressable style={s.quickItem} onPress={() => router.push("/(tabs)/servicios")}>
          <View style={s.quickIcon}><Text>💈</Text></View>
          <Text style={s.quickText}>Servicios</Text>
        </Pressable>
        <Pressable style={s.quickItem} onPress={() => router.push("/(tabs)/perfil")}>
          <View style={s.quickIcon}><Text>⭐</Text></View>
          <Text style={s.quickText}>Mis Reseñas</Text>
        </Pressable>
      </View>

      {/* Próximas Citas */}
      <Text style={s.sectionTitle}>Próximas Citas</Text>
      {[
        { n: "Carlos Mendoza", h: "09:00 · Corte y Barba", d: "45 min", p: "$750" },
        { n: "Miguel Torres",  h: "10:30 · Corte Clásico", d: "30 min", p: "$500" },
        { n: "Roberto Silva",  h: "12:00 · Arreglo de Barba", d: "20 min", p: "$300" },
      ].map((x, i) => (
        <View key={i} style={s.apptCard}>
          <View style={s.apptLeft}>
            <View style={s.circleAvatar}>
              <Text style={s.avatarTxt}>
                {x.n.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.apptName}>{x.n}</Text>
              <Text style={s.apptMeta}>{x.h}</Text>
              <Text style={s.apptMuted}>{x.d}</Text>
            </View>
          </View>
          <Text style={s.apptAmount}>{x.p}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const COLORS = {
  bg: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  card: "#F9FAFB",
  brand: "#111827",
  brandText: "#FFFFFF",
};

const s = StyleSheet.create({
  helloRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.text, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontWeight: "700" },
  hello: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  sub: { color: COLORS.textMuted, marginTop: 2 },

  kpiCard: {
    backgroundColor: "#1F2937",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  kpiCol: { flex: 1 },
  kpiColRight: { flex: 1, alignItems: "flex-end" },
  kpiMuted: { color: "#CBD5E1", fontWeight: "600" },
  kpiValue: { color: "#fff", fontWeight: "700", fontSize: 18, marginTop: 2 },

  smallRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  smallCard: {
    flex: 1, backgroundColor: COLORS.bg, borderWidth: 1, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", gap: 6,
  },
  smallNumber: { fontSize: 18, fontWeight: "800" },
  smallLabel: { color: COLORS.textMuted, fontWeight: "600" },

  cta: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 16 },
  ctaText: { color: COLORS.brandText, fontWeight: "700", fontSize: 16 },

  sectionTitle: { color: COLORS.text, fontWeight: "700", marginBottom: 10, marginTop: 6 },

  quickRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  quickItem: {
    flex: 1, backgroundColor: COLORS.bg, borderColor: COLORS.border, borderWidth: 1,
    borderRadius: 14, paddingVertical: 18, alignItems: "center", gap: 8,
  },
  quickIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card,
    alignItems: "center", justifyContent: "center",
  },
  quickText: { color: COLORS.text, fontWeight: "600" },

  apptCard: {
    backgroundColor: COLORS.bg, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14,
    padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  apptLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 },
  circleAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.text, alignItems: "center", justifyContent: "center" },
  apptName: { color: COLORS.text, fontWeight: "700" },
  apptMeta: { color: COLORS.text, fontWeight: "600" },
  apptMuted: { color: COLORS.textMuted },
  apptAmount: { color: COLORS.text, fontWeight: "800", fontSize: 16 },
});
