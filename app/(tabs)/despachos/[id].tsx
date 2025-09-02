// app/(tabs)/despachos/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const COLORS = {
  bg: "#F5F7FA",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  chip: "#F3F4F6",
  blue: "#2563EB",
  green: "#16A34A",
  red: "#EF4444",
  white: "#FFFFFF",
};

type Product = { product_name: string; quantity: number; unit_cost: string; subtotal: string };
type DispatchItem = {
  id: number;
  barber_name?: string;
  dispatch_date: string;
  status: "Sin estado" | "Entregado" | "Devuelto" | "Pagado";
  products: Product[];
  total: string;
};

function formatCurrency(n: string | number) {
  const num = typeof n === "string" ? Number(n) : n;
  return Number.isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
}

function statusStyle(s: DispatchItem["status"]) {
  switch (s) {
    case "Entregado": return { bg: "rgba(22,163,74,0.12)", text: COLORS.green, border: "rgba(22,163,74,0.25)" };
    case "Pagado":    return { bg: "rgba(37,99,235,0.12)", text: COLORS.blue,  border: "rgba(37,99,235,0.25)" };
    case "Devuelto":  return { bg: "rgba(239,68,68,0.12)", text: COLORS.red,   border: "rgba(239,68,68,0.25)" };
    default:          return { bg: COLORS.chip, text: COLORS.muted, border: COLORS.border };
  }
}

export default function DespachoDetail() {
  const router = useRouter();
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();

  // 👇 Volver SIEMPRE a la lista de despachos
  const goToList = () => {
    // Usa la ruta absoluta del archivo (grupo incluido). El grupo () no se muestra en la URL,
    // pero sí sirve para resolver correctamente el destino dentro del Tab.
    router.replace("/(tabs)/despachos");
    // Si en tu proyecto prefieres sin el grupo, esta también funciona:
    // router.replace("/despachos");
  };

  // Obtener item desde params (fallback mínimo si no viene)
  let item: DispatchItem | null = null;
  if (data) {
    try { item = JSON.parse(data as string) as DispatchItem; } catch {}
  }
  if (!item) {
    item = { id: Number(id), dispatch_date: new Date().toISOString().slice(0,10), status: "Sin estado", products: [], total: "0.00" };
  }

  const st = statusStyle(item.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={goToList} style={{ padding: 8 }}>
            <Text style={{ color: COLORS.blue, fontWeight: "700" }}>◀ Volver</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={styles.title}>Despacho #{item.id}</Text>
          <Text style={styles.subtitle}>
            {new Date(item.dispatch_date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </Text>

          <View style={[styles.badge, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={[styles.badgeText, { color: st.text }]}>{item.status}</Text>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total productos</Text>
            <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Productos</Text>
          {item.products.length === 0 ? (
            <View style={styles.empty}><Text style={{ color: COLORS.muted }}>Sin productos</Text></View>
          ) : (
            item.products.map((p, i) => (
              <View key={i} style={styles.productRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.product_name}</Text>
                  <Text style={styles.productMeta}>Cantidad: {p.quantity} × {formatCurrency(p.unit_cost)}</Text>
                </View>
                <Text style={styles.productPrice}>{formatCurrency(p.subtotal)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2, marginBottom: 12 },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
  },
  badgeText: { fontWeight: "700", fontSize: 12 },

  totalBox: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  totalLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 2 },
  totalValue: { color: COLORS.text, fontWeight: "800", fontSize: 18 },

  sectionTitle: { color: COLORS.text, fontWeight: "700", marginBottom: 8 },

  productRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  productName: { color: COLORS.text, fontWeight: "700", marginBottom: 2 },
  productMeta: { color: COLORS.muted, fontSize: 12 },
  productPrice: { color: COLORS.text, fontWeight: "800", marginLeft: 10 },

  empty: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
});
