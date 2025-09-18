import { useBarberReviews, useCreateBarberReview } from "@/assets/src/features/reviews/useBarberReviews";
import AppointmentRatingSection from "@/components/AppointmentRatingSection";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const COLORS = {
  bg: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  card: "#F9FAFC",
  white: "#FFFFFF",
  brand: "#111827",
  reservado: "#F97316",
  progress: "#2563EB",
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
  try { return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" }); }
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
    id?: string;
    appointment_id?: string;
    review_rating?: string;
    client_name?: string;
    barber_name?: string;
    appointment_date?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
    services?: string; // JSON: [{ name, price, duration }]
    client_id?: string; // si ya lo pasas por params
  }>();

  // --- Servicios de la cita (sin cambios de UI) ---
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

  const appointment_id = pick(params.appointment_id ?? params.id);
  const review_rating = pick(params.review_rating);
  const appointmentIdNum = Number(appointment_id || "0");

  // --- Resolver client_id (solo para el POST) ---
  const client_id_param = pick(params.client_id);
  const [clientIdNum, setClientIdNum] = React.useState<number | null>(null);
  React.useEffect(() => {
    (async () => {
      const fromParam = Number(client_id_param);
      if (Number.isFinite(fromParam) && fromParam > 0) {
        setClientIdNum(fromParam);
        return;
      }
      try {
        const tryKeys = ["client_id", "userId", "user_id", "clientId"];
        for (const k of tryKeys) {
          const raw = await SecureStore.getItemAsync(k);
          if (!raw) continue;
          let val: any = raw;
          try { const j = JSON.parse(raw); val = j?.id ?? j?.client_id ?? j; } catch {}
          const n = Number(val);
          if (Number.isFinite(n) && n > 0) {
            setClientIdNum(n);
            return;
          }
        }
      } catch {}
      setClientIdNum(null);
    })();
  }, [client_id_param]);

  // --- Detectar si el usuario actual es CLIENTE (no barbero) ---
  // Regla: si encontramos señales de barbero => NO cliente; si encontramos señales de cliente y NO de barbero => cliente.
  const [isClient, setIsClient] = React.useState<boolean>(false);
  React.useEffect(() => {
    (async () => {
      try {
        // Lee posibles llaves que ya usas
        const entries: Record<string, string | null> = {};
        const keys = [
          "role", "user", "profile", "auth_user",
          "barber", "barber_id", "isBarber",
          "client", "client_id", "isClient", "clientId",
        ];
        await Promise.all(keys.map(async k => { entries[k] = await SecureStore.getItemAsync(k).catch(() => null); }));

        const asJSON = (v: string | null) => {
          if (!v) return null;
          try { return JSON.parse(v); } catch { return null; }
        };

        // Señales de BARBERO
        const barberIdNum = Number(entries["barber_id"]);
        const barberObj = asJSON(entries["barber"]);
        const roleRaw = (entries["role"] || "").toLowerCase();
        const userObj = asJSON(entries["user"]) || asJSON(entries["profile"]) || asJSON(entries["auth_user"]);

        const isBarber =
          Number.isFinite(barberIdNum) && barberIdNum > 0 ||
          (barberObj && (barberObj.id || barberObj.barber_id)) ||
          roleRaw.includes("barber") || roleRaw.includes("barbero") ||
          (userObj && ["barber", "barbero"].includes(String(userObj.role || userObj.type || "").toLowerCase())) ||
          entries["isBarber"] === "true";

        // Señales de CLIENTE
        const clientIdNum2 = Number(entries["client_id"]);
        const clientObj = asJSON(entries["client"]);
        const isClientFlag = entries["isClient"] === "true";
        const roleLooksClient =
          roleRaw.includes("client") || roleRaw.includes("cliente") ||
          (userObj && ["client", "cliente", "customer", "usuario"].includes(String(userObj.role || userObj.type || "").toLowerCase()));

        const isClientDetected =
          (!isBarber) && (
            (Number.isFinite(clientIdNum2) && clientIdNum2 > 0) ||
            (clientObj && (clientObj.id || clientObj.client_id)) ||
            isClientFlag || roleLooksClient
          );

        setIsClient(Boolean(isClientDetected));
      } catch {
        setIsClient(false); // por seguridad, si hay duda no mostramos rating
      }
    })();
  }, []);

  // --- Totales y estado ---
  const total = servicesArr.reduce((a, s) => a + (Number(s.price) || 0), 0);
  const totalMin = servicesArr.reduce((a, s) => a + (Number(s.duration) || 0), 0);
  const st = statusStyle(status);
  const isCompleted = statusKey(status) === "completada";

  // --- Traer reviews y detectar si ya existe uno para esta cita ---
  const { data: reviews = [] } = useBarberReviews({ barberScoped: false });
  const existingReview = React.useMemo(
    () => reviews.find((r) => r.appointment_id === appointmentIdNum),
    [reviews, appointmentIdNum]
  );
  const initialRatingCombined: number | null =
    (existingReview?.rating != null ? Number(existingReview.rating) : null) ??
    (review_rating ? Number(review_rating) : null);
  const ratingKey = `rating-${appointmentIdNum}-${existingReview?.id ?? "none"}-${existingReview?.rating ?? review_rating ?? 0}`;

  const createReview = useCreateBarberReview();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Fila de título */}
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

        {/* Estado */}
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
        {/* Barbero */}
        <InfoCard
          icon={<Ionicons name="cut-outline" size={18} color={COLORS.text} />}
          label="Barbero"
          value={barber_name || "—"}
        />
        {/* Fecha */}
        <InfoCard
          icon={<Ionicons name="calendar-outline" size={18} color={COLORS.text} />}
          label="Fecha"
          value={fmtLongDate(appointment_date)}
        />

        {/* Horarios */}
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

        {/* Rating: SOLO CLIENTES y SOLO COMPLETADAS */}
        {isCompleted && isClient && (
          <View style={{ marginTop: 12 }}>
            <AppointmentRatingSection
              key={ratingKey} // remount si cambia el review del server
              appointmentId={appointmentIdNum}
              initialRating={initialRatingCombined}
              onSubmitted={(rating: number) => {
                if (!clientIdNum) {
                  Alert.alert("No se pudo enviar la reseña", "No se encontró el client_id.");
                  return;
                }
                createReview.mutate(
                  {
                    client_id: clientIdNum,
                    appointment_id: appointmentIdNum,
                    rating: Number(rating),
                    comment: "",
                  },
                  {
                    onSuccess: () => {
                      Alert.alert("Gracias", "Tu reseña fue enviada.");
                      // invalidateQueries ya se hace en el hook, refresca y se verá "Calificado"
                    },
                    onError: (e: any) =>
                      Alert.alert("Error", e?.message ?? "No se pudo enviar la reseña."),
                  }
                );
              }}
            />
          </View>
        )}

        {/* Botón VOLVER */}
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
    opacity: 0.9,
    fontSize: 17,
    fontWeight: "700",
  },
});
