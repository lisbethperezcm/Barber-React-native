// app/(tabs)/despachos.tsx
import React, { useMemo, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Product = {
  product_name: string;
  quantity: number;
  unit_cost: string;
  subtotal: string;
};

type DispatchItem = {
  id: number;
  barber_name?: string; // no se muestra
  dispatch_date: string; // YYYY-MM-DD
  status: "Sin estado" | "Entregado" | "Devuelto" | "Pagado";
  products: Product[];
  total: string;
};

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

const initialData: DispatchItem[] = [
  {
    id: 1,
    barber_name: "Darling Perez",
    dispatch_date: "2025-04-03",
    status: "Entregado",
    products: [
      { product_name: "Aceite para Barba Premium", quantity: 2, unit_cost: "160.00", subtotal: "320.00" },
      { product_name: "Pomada Mate Extra Fuerte", quantity: 3, unit_cost: "130.00", subtotal: "390.00" },
    ],
    total: "710.00",
  },
  {
    id: 2,
    barber_name: "Carlos Mendoza",
    dispatch_date: "2025-04-01",
    status: "Pagado",
    products: [{ product_name: "Shampoo Mentolado", quantity: 5, unit_cost: "100.00", subtotal: "500.00" }],
    total: "500.00",
  },
  {
    id: 3,
    barber_name: "Ana Ruiz",
    dispatch_date: "2025-04-02",
    status: "Sin estado",
    products: [{ product_name: "Cera Mate", quantity: 4, unit_cost: "162.50", subtotal: "650.00" }],
    total: "650.00",
  },
];

function formatCurrency(n: string | number) {
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

function statusStyle(s: DispatchItem["status"]) {
  switch (s) {
    case "Entregado":
      return { bg: "rgba(22,163,74,0.12)", text: COLORS.green, border: "rgba(22,163,74,0.25)" };
    case "Pagado":
      return { bg: "rgba(37,99,235,0.12)", text: COLORS.blue, border: "rgba(37,99,235,0.25)" };
    case "Devuelto":
      return { bg: "rgba(239,68,68,0.12)", text: COLORS.red, border: "rgba(239,68,68,0.25)" };
    default:
      return { bg: COLORS.chip, text: COLORS.muted, border: COLORS.border };
  }
}

export default function DespachosScreen() {
  // Estado solo para mostrar datos (read-only ahora)
  const [data] = useState<DispatchItem[]>(initialData);

  const kpis = useMemo(() => {
    const total = data.length;
    const entregados = data.filter((d) => d.status === "Entregado").length;
    const pagados = data.filter((d) => d.status === "Pagado").length;
    const valor = data.reduce((acc, d) => acc + Number(d.total || 0), 0);
    return { total, entregados, pagados, valor };
  }, [data]);

  const renderItem = ({ item }: { item: DispatchItem }) => {
    const st = statusStyle(item.status);

    return (
      <View style={styles.card}>
        {/* Encabezado (sin nombre de barbero) */}
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D{item.id}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Despacho #{item.id}</Text>
            <Text style={styles.cardSub}>
              {new Date(item.dispatch_date).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </View>

          {/* Chip de estado y total (con label) */}
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <View style={[styles.badge, { backgroundColor: st.bg, borderColor: st.border }]}>
              <Text style={[styles.badgeText, { color: st.text }]} numberOfLines={1}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.totalLabel}>Total productos</Text>
            <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
          </View>
        </View>

        {/* Productos */}
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionLabel}>Productos:</Text>
          {item.products.map((p, idx) => (
            <View key={`${item.id}-${idx}`} style={styles.productRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName} numberOfLines={1}>
                  {p.product_name}
                </Text>
                <Text style={styles.productMeta}>
                  Cantidad: {p.quantity} × {formatCurrency(p.unit_cost)}
                </Text>
              </View>
              <Text style={styles.productPrice}>{formatCurrency(p.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* (Se eliminaron los botones de acciones para cambiar de estado) */}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator>
        <View style={styles.screenPad}>
          <Text style={styles.title}>Despachos</Text>
          <Text style={styles.subtitle}>Gestiona los despachos de productos</Text>

          {/* KPIs */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Despachos</Text>
              <Text style={styles.kpiValue}>{kpis.total}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Entregados</Text>
              <Text style={[styles.kpiValue, { color: COLORS.green }]}>{kpis.entregados}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Pagados</Text>
              <Text style={[styles.kpiValue, { color: COLORS.blue }]}>{kpis.pagados}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Valor Total</Text>
              <Text style={styles.kpiMoney}>{formatCurrency(kpis.valor)}</Text>
            </View>
          </View>

          {/* Lista */}
          <FlatList
            data={data}
            keyExtractor={(it) => String(it.id)}
            renderItem={renderItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No hay despachos todavía</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenPad: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2, marginBottom: 12 },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  kpiCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    width: "48%",
  },
  kpiLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  kpiValue: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  kpiMoney: { color: COLORS.text, fontSize: 18, fontWeight: "800" },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: { color: COLORS.white, fontWeight: "800" },
  cardTitle: { color: COLORS.text, fontWeight: "800", fontSize: 16 },
  cardSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 94,
  },
  badgeText: { fontWeight: "700", fontSize: 12 },

  totalLabel: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  totalText: { color: COLORS.text, fontWeight: "800" },

  sectionLabel: { color: COLORS.text, fontWeight: "700", marginTop: 12, marginBottom: 8 },
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
    borderRadius: 16,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: "center",
    marginTop: 12,
  },
  emptyText: { color: COLORS.muted },
});
