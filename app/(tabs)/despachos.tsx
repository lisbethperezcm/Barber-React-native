// app/(tabs)/despachos.tsx
import { useBarberDispatches } from "@/assets/src/features/barberDispach/useBarberDispatches";
import { Link } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type StatusUI = "Sin estado" | "Entregado" | "Devuelto" | "Pagado";

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

function formatCurrency(n: number | string) {
  const num = typeof n === "string" ? Number(n) : n;
  return Number.isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
}

// Mapea cualquier string del backend a tus 4 estados UI
function mapStatusToUI(s: string | undefined): StatusUI {
  const v = (s || "").toLowerCase();
  if (v.includes("paga")) return "Pagado";
  if (v.includes("entreg")) return "Entregado";
  if (v.includes("devuel")) return "Devuelto";
  return "Sin estado";
}

function statusStyle(s: StatusUI) {
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

export default function Despachos() {
  const { data = [], isLoading, isFetching, refetch, error } = useBarberDispatches();

  // KPIs calculados con los datos reales
  const kpis = useMemo(() => {
    const total = data.length;
    const entregados = data.filter((d) => mapStatusToUI(d.status) === "Entregado").length;
    const pagados = data.filter((d) => mapStatusToUI(d.status) === "Pagado").length;
    const valor = data.reduce((acc, d) => acc + Number(d.totalAmount || 0), 0);
    return { total, entregados, pagados, valor };
  }, [data]);

  const renderItem = ({ item }: { item: ReturnType<typeof normalizeForRender>[number] }) => {
    const st = statusStyle(item.statusUi);

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D{item.id}</Text>
          </View>

          {/* Centro */}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Despacho #{item.id}</Text>
            <Text style={styles.cardSub}>{item.dateLabel}</Text>

            <Link
              href={{
                pathname: "/despachos/[id]",
                params: {
                  id: String(item.id),
                  // Pasamos lo que la vista de detalle necesite; aquí enviamos un payload amigable
                  data: JSON.stringify({
                    id: item.id,
                    dispatch_date: item.dateISO,
                    status: item.statusUi,
                    total: item.totalAmount,
                    // puedes adjuntar products si tu detalle lo usa
                    products: item.products,
                  }),
                },
              }}
              replace={false}
              asChild
            >
              <Pressable style={styles.detailBtnInline}>
                <Text style={styles.detailBtnInlineText}>Ver detalle</Text>
              </Pressable>
            </Link>
          </View>

          {/* Derecha: estado + total */}
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <View style={[styles.badge, { backgroundColor: st.bg, borderColor: st.border }]}>
              <Text style={[styles.badgeText, { color: st.text }]} numberOfLines={1}>
                {item.statusUi}
              </Text>
            </View>
            <Text style={styles.totalLabel}>Total productos</Text>
            <Text style={styles.totalText}>{formatCurrency(item.totalAmount)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const listData = normalizeForRender(data);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
        }
      >
        <View style={styles.screenPad}>
          <Text style={styles.title}>Despachos</Text>
          <Text style={styles.subtitle}>Gestiona los despachos de productos</Text>

          {/* KPIs */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Despachos</Text>
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.kpiValue}>{kpis.total}</Text>
              )}
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Entregados</Text>
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={[styles.kpiValue, { color: COLORS.green }]}>{kpis.entregados}</Text>
              )}
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Pagados</Text>
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={[styles.kpiValue, { color: COLORS.blue }]}>{kpis.pagados}</Text>
              )}
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Valor Total</Text>
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.kpiMoney}>{formatCurrency(kpis.valor)}</Text>
              )}
            </View>
          </View>

          {/* Error state */}
          {error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No se pudo cargar la información. Desliza hacia abajo para reintentar.
              </Text>
            </View>
          ) : null}

          {/* Lista */}
          {isLoading ? (
            <View style={styles.skeleton}>
              <ActivityIndicator />
              <Text style={{ color: COLORS.muted, marginTop: 6 }}>Cargando despachos…</Text>
            </View>
          ) : (
            <FlatList
              data={listData}
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
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Normaliza los campos de la API normalizada (Dispatch) a lo que usa la UI */
function normalizeForRender(data: ReturnType<typeof useBarberDispatches> extends { data: infer D }
  ? D extends (infer T)[] ? T[] : []
  : never) {
  // data es Dispatch[]
  return (data || []).map((d) => {
    const statusUi = mapStatusToUI(d.status);
    const date = new Date(d.dateISO);
    const dateLabel = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return {
      id: d.id,
      dateISO: d.dateISO,
      dateLabel,
      statusUi,
      totalAmount: d.totalAmount,
      products: d.products,
    };
  });
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

  detailBtnInline: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  detailBtnInlineText: { color: COLORS.text, fontWeight: "700" },

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

  skeleton: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
});
