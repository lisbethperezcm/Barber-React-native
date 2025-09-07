import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const COLORS = {
  bg: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  card: "#F9FAFC",
  white: "#FFFFFF",
  brand: "#111827",
  // Paleta igual que Citas:
  reservado: "#F97316",
  progress: "#2563EB",  // azul
  completado: "#16A34A",
  danger: "#B91C1C",
  reservadoSoft: "#FFEDD5",
  confirmadoSoft: "#DBEAFE",
  completadoSoft: "#DCFCE7",
  dangerSoft: "#FEE2E2",
};

type Service = { name: string; price: number; duration: number };

function pick(v?: string | string[], fallback = "") { return Array.isArray(v) ? v[0] ?? fallback : v ?? fallback; }
function fmtTime(iso: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }); }
  catch { return iso; }
}
function fmtLongDate(yyyyMmDd: string) {
  if (!yyyyMmDd) return "—";
  try {
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12));
    const day = dt.toLocaleDateString("es-DO", { weekday: "long" });
    const dayNum = dt.toLocaleDateString("es-DO", { day: "numeric" });
    const month = dt.toLocaleDateString("es-DO", { month: "long" });
    const year = dt.getUTCFullYear();
    const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;
    return `${cap(day)}, ${dayNum} de ${cap(month)} de ${year}`;
  } catch { return yyyyMmDd; }
}
function currencyDOP(n: number) { try { return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n); } catch { return `RD$${Math.round(n)}`; } }

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
function statusKey(raw: unknown): "reservada" | "en proceso" | "completada" | "cancelada" | "" {
  const s = norm(raw);
  if (["reservada", "reservado", "reserved", "reserva", "pendiente", "pending", "booked"].includes(s)) return "reservada";
  if (["en proceso", "en proceso", "in progress"].includes(s)) return "en proceso";
  if (["completada", "completado", "completed", "finalizada", "finalizado", "done"].includes(s)) return "completada";
  if (["cancelada", "cancelado", "canceled", "cancelled"].includes(s)) return "cancelada";
  return "";
}
function statusStyle(status: string) {
  const k = statusKey(status);
  switch (k) {
    case "reservada": return { fg: COLORS.reservado, bg: COLORS.reservadoSoft, label: "Reservado" };
    case "en proceso": return { fg: COLORS.progress, bg: COLORS.confirmadoSoft, label: "En proceso" };
    case "completada": return { fg: COLORS.completado, bg: COLORS.completadoSoft, label: "Completado" };
    case "cancelada": return { fg: COLORS.danger, bg: COLORS.dangerSoft, label: "Cancelado" };
    default: return { fg: COLORS.text, bg: "#F3F4F6", label: status || "—" };
  }
}

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    client_name?: string;
    barber_name?: string;
    appointment_date?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
    services?: string; // JSON: [{ name, price, duration }]
  }>();

  // parse servicios
  let servicesArr: Service[] = [];
  try {
    const raw = pick(params.services, "[]");
    const parsed = JSON.parse(raw);
    servicesArr = Array.isArray(parsed) ? parsed : [];
  } catch { servicesArr = []; }

  const client_name = pick(params.client_name);
  const barber_name = pick(params.barber_name);
  const appointment_date = pick(params.appointment_date);
  const start_time = pick(params.start_time);
  const end_time = pick(params.end_time);
  const status = pick(params.status, "Reservado");

  const total = servicesArr.reduce((a, s) => a + (Number(s.price) || 0), 0);
  const totalMin = servicesArr.reduce((a, s) => a + (Number(s.duration) || 0), 0);
  const st = statusStyle(status);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Fila de título con flecha (icono sin texto) */}
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.replace("/citas")}
            hitSlop={10}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="arrow-back-outline" size={25} color={COLORS.text} />
          </Pressable>
          <Text style={styles.titleText}>Detalle de la cita</Text>
        </View>

        {/* Estado + label al lado del chip (debajo de la flecha) */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Estado:</Text>
          <View style={[styles.badge, { backgroundColor: st.bg, borderColor: st.fg }]}>
            <Text style={{ color: st.fg, fontWeight: "800" }}>{st.label}</Text>
          </View>
        </View>


        {/* Cliente */}
        <InfoCard
          icon={<Ionicons name="person-outline" size={18} color={COLORS.text} />}
          label="Cliente"
          value={client_name || "—"}
        />
        {/* Barbero (tijeras) */}
        <InfoCard
          icon={<Ionicons name="cut-outline" size={18} color={COLORS.text} />}
          label="Barbero"
          value={barber_name || "—"}
        />
        {/* Fecha (calendario) */}
        <InfoCard
          icon={<Ionicons name="calendar-outline" size={18} color={COLORS.text} />}
          label="Fecha"
          value={fmtLongDate(appointment_date)}
        />

        {/* Horarios (reloj) */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <MiniCard
            icon={<Ionicons name="time-outline" size={18} color={COLORS.text} />}
            title="Inicio"
            value={fmtTime(start_time)}
          />
          <MiniCard
            icon={<Ionicons name="time-outline" size={18} color={COLORS.text} />}
            title="Fin"
            value={fmtTime(end_time)}
          />
        </View>

        {/* Servicios */}
        <Text style={styles.sectionTitle}>Servicios:</Text>
        {servicesArr.length === 0 ? (
          <View style={styles.serviceCard}>
            <Text style={{ color: COLORS.muted }}>Sin servicios.</Text>
          </View>
        ) : (
          servicesArr.map((s, idx) => (
            <View key={`${s.name}-${idx}`} style={styles.serviceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>{s.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <Ionicons name="time-outline" size={16} color={COLORS.muted} />
                  <Text style={{ color: COLORS.muted }}>{Number(s.duration) || 0} min</Text>
                </View>
              </View>
              <Text style={styles.servicePrice}>{currencyDOP(Number(s.price) || 0)}</Text>
            </View>
          ))
        )}

        {/* Resumen */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duración total</Text>
            <Text style={styles.summaryValue}>{totalMin} minutos</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{currencyDOP(total)}</Text>
          </View>
        </View>

        {/* Botón inferior: VOLVER (como estaba: con texto y back) */}
        <Pressable onPress={() => router.replace("/citas")} style={styles.primaryBtn}>

          <Text style={styles.primaryBtnText}>Volver</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ---- Subcomponentes ---- */
function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {icon}
        <View>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

function MiniCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <View style={[styles.infoCard, { flex: 1 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {icon}
        <View>
          <Text style={styles.infoLabel}>{title}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

/* ---- Styles ---- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === "android" ? 8 : 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  titleText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 18,

  },

  center: { alignItems: "center", marginBottom: 8 },

  badge: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  infoLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 2 },
  infoValue: { color: COLORS.text, fontWeight: "800", fontSize: 15 },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16,
  },

  serviceCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceTitle: { color: COLORS.text, fontWeight: "800", fontSize: 15 },
  servicePrice: { color: COLORS.text, fontWeight: "900", fontSize: 16 },

  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  summaryLabel: { color: COLORS.muted, fontWeight: "700" },
  summaryValue: { color: COLORS.text, fontWeight: "800" },

  totalRow: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: { color: COLORS.text, fontWeight: "900", fontSize: 16 },
  totalValue: { color: COLORS.text, fontWeight: "900", fontSize: 16 },

  primaryBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: "900" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
    marginBottom: 8,
  },
  statusLabel: {
    color: COLORS.muted,
    opacity: 0.9,           // “opaco” suave
    fontSize: 17,
    fontWeight: "700",
  },
  
});
