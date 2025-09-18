// components/dashboards/BarberDashboard.tsx
import { AuthContext } from "@/assets/src/context/AuthContext";
import type { NextAppointment } from "@/assets/src/features/reports/useBarberSummary";
import { useBarberSummary } from "@/assets/src/features/reports/useBarberSummary";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

/* ===================== Helpers ===================== */
function formatTime(hms: string): string {
  if (!hms) return "";
  const [h, m] = hms.split(":");
  if (!h || !m) return hms;
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function formatTime12(hms: string): string {
  if (!hms) return "";
  const [hStr, mStr] = hms.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hms;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

function diffMinutes(start: string, end: string): number {
  if (!start || !end) return NaN as any;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return NaN as any;
  return (eh * 60 + em) - (sh * 60 + sm);
}

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

function formatDate(ymd: string): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const w = WEEKDAYS[dt.getDay()];
  const mo = MONTHS[dt.getMonth()];
  return `${w}, ${String(d).padStart(2, "0")} ${mo}`;
}

/* ===================== Componente ===================== */
export default function BarberDashboard({ styles }: { styles?: any }) {
  const router = useRouter();
  const { userName } = useContext(AuthContext);

  const userFirstName = ((userName ?? "").trim().split(/\s+/)[0]) || "";
  const { data: summary, isLoading } = useBarberSummary(true);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Saludo */}
      <View style={s.helloRow}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{(userFirstName[0] || "B").toUpperCase()}</Text></View>
        <View>
          <Text style={s.hello}>Hola, {userFirstName} 👋</Text>
          <Text style={s.sub}>¿Listo para atender a tus clientes?</Text>
        </View>
      </View>

      {/* KPIs destacados */}
      <View style={s.kpiCard}>
        <View style={s.kpiCol}>
          <Text style={s.kpiMuted}>Ingresos estimados</Text>
          <Text style={s.kpiValue}>
            {`RD$ ${Number(summary?.estimated_income ?? 0).toLocaleString("es-DO")}`}
          </Text>
        </View>
        <View style={s.kpiColRight}>
          <Text style={s.kpiMuted}>Tienes</Text>
          <Text style={s.kpiValue}>
            {`${summary?.appointments_today ?? 0} citas hoy`}
          </Text>
        </View>
      </View>

      {/* Totales del día */}
      <View style={s.smallRow}>
        <View style={[s.smallCard, { borderColor: "#DBEAFE" }]}>
          <Text style={[s.smallNumber, { color: "#2563EB" }]}>
            {summary?.appointments_today ?? 0}
          </Text>
          <Text style={s.smallLabel}>Citas Hoy</Text>
        </View>
        <View style={[s.smallCard, { borderColor: "#DCFCE7" }]}>
          <Text style={[s.smallNumber, { color: "#16A34A" }]}>
            {summary?.completed ?? 0}
          </Text>
          <Text style={s.smallLabel}>Completadas</Text>
        </View>
        <View style={[s.smallCard, { borderColor: "#FFE4E6" }]}>
          <Text style={[s.smallNumber, { color: "#F97316" }]}>
            {summary?.pending ?? 0}
          </Text>
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
        <Pressable style={s.quickItem} onPress={() => router.push("/(tabs)/despachos")}>
          <View style={s.quickIcon}><Text>📦</Text></View>
          <Text style={s.quickText}>Despachos</Text>
        </Pressable>
        <Pressable style={s.quickItem} onPress={() => router.push("/(tabs)/citas")}>
          <View style={s.quickIcon}><Text>📅</Text></View>
          <Text style={s.quickText}>Citas</Text>
        </Pressable>
        <Pressable style={s.quickItem} onPress={() => router.push("/(tabs)/horarios")}>
          <View style={s.quickIcon}><Text>⏰</Text></View>
          <Text style={s.quickText}>Horarios</Text>
        </Pressable>
      </View>

      {/* Próximas Citas */}
      <Text style={s.sectionTitle}>Próximas Citas</Text>

      {(() => {
        const items = summary?.next_appointments ?? [];
        // Agrupar por fecha
        const byDate = new Map<string, NextAppointment[]>();
        items.forEach(a => {
          const key = a.date || "Sin fecha";
          if (!byDate.has(key)) byDate.set(key, []);
          byDate.get(key)!.push(a);
        });
        const groups = Array.from(byDate.entries()).sort(([d1], [d2]) => d1.localeCompare(d2));

        return groups.map(([date, list]) => (
          <View key={date} style={s.dateGroup}>
            <View style={s.dateChip}>
              <Text style={s.dateChipTxt}>{formatDate(date)}</Text>
            </View>

            {list.map((a, i) => {
              const initials = (a.client || "")
                .trim()
                .split(/\s+/)
                .map(w => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const timeRange = `${formatTime12(a.start_time)}–${formatTime12(a.end_time)}`;
              const mins = diffMinutes(a.start_time, a.end_time);
              const duration = Number.isFinite(mins) ? `${mins} min` : "";
              const services = Array.isArray(a.services) ? a.services.join(", ") : "";
              const price = `RD$ ${Number(a.total ?? 0).toLocaleString("es-DO")}`;

              return (
                <View key={a.id ?? i} style={s.apptCard}>
                  <View style={s.apptRow}>
                    {/* IZQUIERDA: Cliente + Fecha/Hora + Servicios */}
                    <View style={s.apptLeftCol}>
                      <View style={s.apptClientRow}>
                        <View style={s.circleAvatar}>
                          <Text style={s.avatarTxt}>{initials || "?"}</Text>
                        </View>
                        <Text style={s.apptName}>{a.client}</Text>
                      </View>
                      <Text style={s.apptMeta}>
                        {formatDate(a.date)}
                        {"\n"}
                        {timeRange}
                      </Text>
                      {services ? <Text style={s.apptMuted}>{services}</Text> : null}
                    </View>

                    {/* DERECHA: Precio (arriba) + Duración (abajo) */}
                    <View style={s.apptRightCol}>
                      <Text style={s.apptAmount}>{price}</Text>
                      {duration ? <Text style={s.apptMutedRight}>{duration}</Text> : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ));
      })()}

    </ScrollView>
  );
}

/* ===================== Estilos ===================== */
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
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.brand, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontWeight: "700" },
  hello: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  sub: { color: COLORS.textMuted, marginTop: 2 },

  kpiCard: {
    backgroundColor: COLORS.text,
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
    padding: 14, alignItems: "center", gap: 6,
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

  dateGroup: { marginBottom: 16 },
  dateChip: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  dateChipTxt: { color: COLORS.text, fontWeight: "700" },

  apptCard: {
    backgroundColor: COLORS.bg, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14,
    padding: 14, marginBottom: 12,
  },

  // Nuevo layout: izquierda (cliente/fecha/hora/servicios) vs derecha (precio/duración)
  apptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  apptLeftCol: {
    flex: 1,
    paddingRight: 8,
  },
  apptRightCol: {
    alignItems: "center",
   
    minWidth: 90,
    justifyContent: "center"
  },
  apptMutedRight: {
    color: COLORS.textMuted,
    textAlign: "right",
  },

  apptClientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  circleAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.brand, alignItems: "center", justifyContent: "center" },
  apptName: { color: COLORS.text, fontWeight: "700" },
  apptMeta: { color: COLORS.text, fontWeight: "600" },
  apptMuted: { color: COLORS.textMuted },
  apptAmount: { color: COLORS.text, fontWeight: "800", fontSize: 16 },

  // (opcional) estilos antiguos que ya no se usan, los dejamos por compatibilidad
  apptHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  apptTime: { color: COLORS.text, fontWeight: "700" },
});
