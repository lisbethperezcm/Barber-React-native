// app/(tabs)/despachos/[id].tsx
import { Ionicons } from "@expo/vector-icons";
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

type LegacyProduct = { product_name: string; quantity: number; unit_cost: string | number; subtotal: string | number };
type NormalizedProduct = { productName: string; quantity: number; unitCost: number | string; subtotal: number | string };

type LegacyDispatch = {
  id: number;
  barber_name?: string;
  dispatch_date: string; // YYYY-MM-DD
  status: "Sin estado" | "Entregado" | "Devuelto" | "Pagado";
  products: LegacyProduct[];
  total: string | number;
};

type NormalizedDispatch = {
  id: number;
  dateISO: string;                // e.g. "2025-04-03"
  status: string;                 // e.g. "Entregado" | "Pagado" ...
  products: NormalizedProduct[];
  totalAmount: number | string;   // number preferido, pero soportamos string
};

type UnifiedProduct = { name: string; quantity: number; unitCost: number; subtotal: number };
type UnifiedDispatch = {
  id: number;
  dateISO: string;
  status: "Sin estado" | "Entregado" | "Devuelto" | "Pagado";
  products: UnifiedProduct[];
  total: number;
};

function formatCurrency(n: string | number) {
  const num = typeof n === "string" ? Number(n) : n;
  return Number.isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
}

function statusStyle(s: UnifiedDispatch["status"]) {
  switch (s) {
    case "Entregado": return { bg: "rgba(22,163,74,0.12)", text: COLORS.green, border: "rgba(22,163,74,0.25)" };
    case "Pagado":    return { bg: "rgba(37,99,235,0.12)", text: COLORS.blue,  border: "rgba(37,99,235,0.25)" };
    case "Devuelto":  return { bg: "rgba(239,68,68,0.12)", text: COLORS.red,   border: "rgba(239,68,68,0.25)" };
    default:          return { bg: COLORS.chip, text: COLORS.muted, border: COLORS.border };
  }
}

// Normaliza cualquier shape (legacy o normalizado) a UnifiedDispatch para la UI
function normalizeInput(input: any, idFallback: string | number): UnifiedDispatch {
  const idNum = Number(input?.id ?? idFallback ?? 0);

  // Fecha: puede venir como dispatch_date (legacy) o dateISO (normalizado)
  const dateISO =
    (typeof input?.dispatch_date === "string" ? input.dispatch_date : null) ||
    (typeof input?.dateISO === "string" ? input.dateISO : null) ||
    new Date().toISOString().slice(0, 10);

  // Status: ya debería venir en español desde la lista (statusUi), o como "status"
  const rawStatus: string =
    typeof input?.status === "string" ? input.status :
    typeof input?.statusUi === "string" ? input.statusUi :
    "Sin estado";

  const status = ((): UnifiedDispatch["status"] => {
    const v = rawStatus.toLowerCase();
    if (v.includes("entreg")) return "Entregado";
    if (v.includes("paga")) return "Pagado";
    if (v.includes("devuel")) return "Devuelto";
    if (v.includes("sin")) return "Sin estado";
    // fallback seguro
    return (["Entregado", "Pagado", "Devuelto", "Sin estado"] as const).includes(rawStatus as any)
      ? (rawStatus as UnifiedDispatch["status"])
      : "Sin estado";
  })();

  // Total: puede ser total (legacy) o totalAmount (normalizado)
  const totalRaw: number | string = input?.totalAmount ?? input?.total ?? 0;
  const total = Number(totalRaw) || 0;

  // Products: pueden venir con product_name/unit_cost/subtotal (legacy)
  // o productName/unitCost/subtotal (normalizado)
  const arr: any[] = Array.isArray(input?.products) ? input.products : [];
  const products: UnifiedProduct[] = arr.map((p) => {
    const name = (p?.productName ?? p?.product_name ?? "") as string;
    const quantity = Number(p?.quantity) || 0;
    const unitCost = Number(p?.unitCost ?? p?.unit_cost) || 0;
    const subtotal = Number(p?.subtotal) || (unitCost * quantity) || 0;
    return { name, quantity, unitCost, subtotal };
  });

  return { id: idNum, dateISO, status, total, products };
}

export default function DespachoDetail() {
  const router = useRouter();
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();

  const goToList = () => {
    router.replace("/(tabs)/despachos");
  };

  // Parse params y normalización
  let parsed: any = null;
  if (data) {
    try { parsed = JSON.parse(data as string); } catch { /* ignore */ }
  }

  const item: UnifiedDispatch = normalizeInput(parsed, id);

  const st = statusStyle(item.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* 🔹 Abrimos un contenedor para todo el contenido */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {/* Header */}
          <View style={styles.titleRow}>
            <Pressable onPress={goToList} hitSlop={10} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <Ionicons name="arrow-back-outline" size={25} color={COLORS.text} />
            </Pressable>
            <Text style={styles.title}>Despacho #{item.id}</Text>
          </View>

          <Text style={styles.subtitle}>
            {new Date(item.dateISO).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
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
            <View style={styles.empty}>
              <Text style={{ color: COLORS.muted }}>Sin productos</Text>
            </View>
          ) : (
            item.products.map((p, i) => (
              <View key={i} style={styles.productRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productMeta}>
                    Cantidad: {p.quantity} × {formatCurrency(p.unitCost)}
                  </Text>
                </View>
                <Text style={styles.productPrice}>{formatCurrency(p.subtotal)}</Text>
              </View>
            ))
          )}
        </View>
        {/* 🔹 Cerramos el mismo contenedor */}
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
   titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
});
