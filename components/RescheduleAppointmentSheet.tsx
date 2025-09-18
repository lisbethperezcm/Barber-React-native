// components/RescheduleAppointmentSheet.tsx
import { api } from "@/assets/src/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

// Hooks ya existentes (no se tocan)
import { useAvailableSlots } from "@/assets/src/features/barber/useAvailableSlots";
import { useBarbers } from "@/assets/src/features/barber/useBarbers";

/* ------------------ Tipos ------------------ */
type InputBarber = { id: number | string; name: string };
type Barber = { id: number; name: string };
type ServicesSummary = { totalMinutes: number; totalPrice: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirmed?: (payload: {
    appointmentId: number | string;
    changed: Partial<{
      barber_id: number;
      appointment_date: string;
      start_time: string;
      end_time: string | null;
    }>;
  }) => void;

  appointmentId: number | string;

  // Props originales (se usan como fallback si el GET no trae algo)
  currentBarberId: number | string;
  currentBarberName: string;
  currentDateISO: string;   // YYYY-MM-DD
  currentStartTime: string; // HH:mm | HH:mm:ss | ISO (fallback)
  currentEndTime?: string;  // HH:mm | HH:mm:ss | ISO (fallback)
  services: ServicesSummary;

  barbers?: InputBarber[];
};

/* ------------------ Colores ------------------ */
const COLORS = {
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  brand: "#111827",
  ok: "#16A34A",
  danger: "#B91C1C",
  dim: "rgba(0,0,0,0.35)",
  reservado: "#F97316",
  reservadoSoft: "#FFEDD5",
  greenSoft: "#E8FBEF",
  greenBorder: "#86EFAC",
  redSoft: "#FEE2E2",
  redBorder: "#FCA5A5",
};

/* ------------------ Utils ------------------ */
function todayYMD() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function to12h(time24: string) {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec((time24 ?? "").trim());
  if (!m) return time24;
  let h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}
function slotLabelFromRaw(raw: string) {
  const re = /^\s*(\d{1,2}:\d{2})(?::\d{2})?\s*-\s*(\d{1,2}:\d{2})(?::\d{2})?\s*$/;
  const m = re.exec(raw ?? "");
  if (!m) {
    const single = /^\s*(\d{1,2}:\d{2})(?::\d{2})?\s*$/.exec(raw ?? "");
    return single ? to12h(single[1]) : raw;
  }
  return `${to12h(m[1])} - ${to12h(m[2])}`;
}
function extractStartEndRaw(slot: string) {
  const normalized = String(slot).replace(/\b(\d{1,2}:\d{2})(?!:\d{2})\b/g, "$1:00");
  const [left, right] = normalized.split("-", 2);
  const startT = (left ?? "").trim();
  const endT = (right ?? "").trim();
  return { start: startT, end: endT || null };
}
function fmtDateLong(yyyyMmDd: string) {
  if (!yyyyMmDd) return "—";
  try {
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12));
    const day = dt.toLocaleDateString("es-DO", { weekday: "long" });
    const dayNum = dt.toLocaleDateString("es-DO", { day: "numeric" });
    const month = dt.toLocaleDateString("es-DO", { month: "long" });
    const year = dt.getUTCFullYear();
    const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
    return `${cap(day)}, ${dayNum} de ${cap(month)} de ${year}`;
  } catch {
    return yyyyMmDd;
  }
}
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
function statusKey(raw: unknown): "reservada" | "en proceso" | "completada" | "cancelada" | "" {
  const s = norm(raw);
  if (["reservada", "reservado", "reserved", "reserva", "pendiente", "pending", "booked"].includes(s)) return "reservada";
  if (["en proceso", "in progress"].includes(s)) return "en proceso";
  if (["completada", "completado", "completed", "finalizada", "finalizado", "done"].includes(s)) return "completada";
  if (["cancelada", "cancelado", "canceled", "cancelled"].includes(s)) return "cancelada";
  return "";
}
function initials(n: string) {
  return n
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}
function toNum(id: number | string | null | undefined): number | null {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

/* ---- Utilidades para mostrar EXACTAMENTE lo del detalle ---- */
function pickTime(raw: string | undefined | null): string {
  const s = String(raw ?? "");
  const m = s.match(/\b(\d{1,2}:\d{2})(?::\d{2})?\b/);
  return m ? m[0] : "";
}
function fmtRangeFromProps(startRaw?: string, endRaw?: string): string {
  const s = pickTime(startRaw || "");
  const e = pickTime(endRaw || "");
  if (s && e) return `${to12h(s)} - ${to12h(e)}`;
  if (s) return to12h(s);
  return "—";
}

/* =======================================================
   COMPONENTE
   ======================================================= */
export default function RescheduleAppointmentSheet({
  visible,
  onClose,
  onConfirmed,
  appointmentId,
  currentBarberId,
  currentBarberName,
  currentDateISO,
  currentStartTime,
  currentEndTime,
  services,
  barbers = [],
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  /* ---- 0) Traer estado y DETALLE de la cita para usar sus horas reales ---- */
  const [statusLoading, setStatusLoading] = useState(false);
  const [apptStatus, setApptStatus] = useState<string>("");        // para permitir reprogramar
  const [statusError, setStatusError] = useState<string | null>(null);

  // Horas/datos del DETALLE actual (lo que quieres mostrar en la tarjeta roja)
  const [origDate, setOrigDate] = useState<string>(currentDateISO || "");
  const [origStart, setOrigStart] = useState<string>(currentStartTime || "");
  const [origEnd, setOrigEnd] = useState<string>(currentEndTime || "");
  const [origBarberName, setOrigBarberName] = useState<string>(currentBarberName || "");

  useEffect(() => {
    let cancelled = false;
    async function fetchDetail() {
      if (!visible) return;
      try {
        setStatusLoading(true);
        setStatusError(null);
        const res = await api.get(`/appointments/${appointmentId}`);

        // Algunas APIs devuelven {data: {...}} y otras directamente {...}
        const d = res?.data?.data ?? res?.data ?? {};

        // 1) Estado para habilitar reprogramación
        const s = d?.status ?? "";
        if (!cancelled) setApptStatus(String(s));

        // 2) Valores reales del detalle (fecha y horas) — SIN contaminar con hora “actual”
        const rawDate  = d?.appointment_date ?? d?.dateISO ?? d?.date ?? null;
        const rawStart = d?.start_time      ?? d?.startISO ?? d?.start ?? null;
        const rawEnd   = d?.end_time        ?? d?.endISO   ?? d?.end   ?? null;

        const apiStart = rawStart ? pickTime(String(rawStart)) : ""; // "HH:mm" o ""
        const apiEnd   = rawEnd   ? pickTime(String(rawEnd))   : "";

        const safeDate  = rawDate  ? String(rawDate) : (currentDateISO || "");
        const safeStart = apiStart || pickTime(currentStartTime || "") || (currentStartTime || "");
        const safeEnd   = apiEnd   || pickTime(currentEndTime   || "") || (currentEndTime   || "");

        if (!cancelled) {
          if (__DEV__) {
            console.log("[Reschedule][DETAIL]", {
              fromApi: { date: rawDate, start: rawStart, end: rawEnd, status: d?.status },
              used: { date: safeDate, start: safeStart, end: safeEnd },
            });
          }

          setOrigDate(safeDate);
          setOrigStart(safeStart);
          setOrigEnd(safeEnd);
          setOrigBarberName(String(
            d?.barber?.name ?? d?.barber_name ?? d?.barberName ?? (currentBarberName || "")
          ));
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatusError(e?.response?.data?.message || "No se pudo obtener la cita.");
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    }
    fetchDetail();
    return () => { cancelled = true; };
  }, [visible, appointmentId, currentBarberName, currentDateISO, currentStartTime, currentEndTime]);

  const isReservada = statusKey(apptStatus) === "reservada";

  /* ---- 1) Barberos ---- */
  const { data: barbersApi = [], isFetching: loadingBarbers } = useBarbers({
    enabled: visible && step === 1,
  });

  const mergedBarbers: Barber[] = useMemo(() => {
    const map = new Map<number, Barber>();
    const push = (idRaw: number | string, name: string) => {
      const idNum = toNum(idRaw);
      if (idNum != null && name) map.set(idNum, { id: idNum, name });
    };
    for (const b of barbers ?? []) push(b.id, b.name);
    for (const raw of barbersApi as any[]) {
      const id = raw?.id ?? raw?.barber_id;
      const name = raw?.name;
      push(id, name);
    }
    return Array.from(map.values());
  }, [barbers, barbersApi]);

  const [selectedBarberId, setSelectedBarberId] = useState<number | string | null>(currentBarberId ?? null);

  useEffect(() => {
    if (!visible) return;
    if (!mergedBarbers.length) return;

    const selNum = toNum(selectedBarberId);
    const exists = selNum != null && mergedBarbers.some((b) => b.id === selNum);

    if (!exists) {
      const currentNum = toNum(currentBarberId);
      const fallback =
        (currentNum != null && mergedBarbers.find((b) => b.id === currentNum)?.id) ??
        mergedBarbers[0]?.id ??
        null;
      setSelectedBarberId(fallback);
    }
  }, [visible, mergedBarbers, currentBarberId, selectedBarberId]);

  const canNextFromBarber = useMemo(() => {
    if (!mergedBarbers.length) return false;
    const selNum = toNum(selectedBarberId);
    return selNum != null && mergedBarbers.some((b) => b.id === selNum);
  }, [selectedBarberId, mergedBarbers]);

  /* ---- 2) Fecha ---- */
  const [selectedDate, setSelectedDate] = useState<string>("");
  const canNextFromDate = !!selectedDate;

  /* ---- 3) Horarios ---- */
  const totalMinutes = Math.max(Number(services?.totalMinutes || 0), 5);
  const selBarberNum = toNum(selectedBarberId);
  const hasValidBarberNum = selBarberNum != null;
  const safeBarberIdNum: number = hasValidBarberNum ? selBarberNum! : 0;

  const enableSlotsQuery =
    Boolean(visible && step === 3 && selectedDate && totalMinutes && hasValidBarberNum);

  const {
    data: slotsApi = [],
    isLoading: loadingSlots,
    error: slotsError,
    refetch: refetchSlots,
  } = useAvailableSlots(
    { barberId: safeBarberIdNum, date: selectedDate, duration: totalMinutes },
    { enabled: !!enableSlotsQuery }
  );

  const timeSlots: string[] = useMemo(
    () =>
      Array.isArray(slotsApi) && slotsApi.length
        ? (slotsApi as any[]).map((s) => {
            const left = (s.startISO ?? s.start ?? "").trim();
            const right = (s.endISO ?? s.end ?? "").trim();
            return right ? `${left} - ${right}` : left;
          })
        : [],
    [slotsApi]
  );

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const { start, end } = useMemo(() => extractStartEndRaw(selectedTimeSlot), [selectedTimeSlot]);
  const canNextFromTime = Boolean(selectedTimeSlot);

  useEffect(() => {
    if (enableSlotsQuery) refetchSlots();
  }, [enableSlotsQuery, selectedDate, safeBarberIdNum, totalMinutes, refetchSlots]);

  /* ---- Reset al cerrar ---- */
  useEffect(() => {
    if (!visible) {
      setStep(1);
      setSelectedDate("");
      setSelectedTimeSlot("");
    }
  }, [visible]);

  /* ---- 4) Confirmar (PUT solo campos cambiados) ---- */
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    const selNum = toNum(selectedBarberId);
    if (selNum == null || !selectedDate || !start) return;

    const changed: Partial<{
      barber_id: number;
      appointment_date: string;
      start_time: string;
      end_time: string | null;
    }> = {};

    const currentNum = toNum(currentBarberId);
    if (currentNum == null || selNum !== currentNum) {
      changed.barber_id = selNum;
    }
    if (selectedDate && selectedDate !== origDate) {
      changed.appointment_date = selectedDate;
    }

    const normalize = (v: string) => (v && /^\d{1,2}:\d{2}$/.test(v) ? `${v}:00` : v);
    const newStart = normalize(start);
    const newEnd = end ? normalize(end) : null;

    const currentStartRaw = pickTime(origStart); // usa SIEMPRE lo traído del detalle
    const currentEndRaw = pickTime(origEnd || "");
    const normCurrentStart = normalize(currentStartRaw);
    const normCurrentEnd = currentEndRaw ? normalize(currentEndRaw) : null;

    if (newStart && (newStart !== normCurrentStart || (newEnd || "") !== (normCurrentEnd || ""))) {
      changed.start_time = newStart;
      changed.end_time = newEnd;
    }

    if (!changed.barber_id && !changed.appointment_date && !changed.start_time && !changed.end_time) {
      onClose();
      return;
    }

    try {
      setConfirming(true);
      await api.put(`/appointments/${appointmentId}`, changed);
      onConfirmed?.({ appointmentId, changed });
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudo reprogramar la cita.";
      Alert.alert("Error", msg);
    } finally {
      setConfirming(false);
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  // 👉 Si no está visible, no renderizamos nada
  if (!visible) return null;

  // 👉 Estados de carga/bloqueo SIN abrir el Modal grande
  if (statusLoading) {
    return (
      <InlineOverlay onBackdrop={onClose}>
        <View style={{ alignItems: "center", padding: 16 }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: COLORS.muted }}>Validando cita…</Text>
        </View>
      </InlineOverlay>
    );
  }

  if (statusError) {
    return (
      <InlineOverlay onBackdrop={onClose}>
        <Blocker title="No se pudo validar la cita" subtitle={statusError} onClose={onClose} />
      </InlineOverlay>
    );
  }

  if (!isReservada) {
    return (
      <InlineOverlay onBackdrop={onClose}>
        <Blocker
          title="No puedes reprogramar esta cita"
          subtitle="Solo las citas en estado Reservado pueden reprogramarse."
          onClose={onClose}
        />
      </InlineOverlay>
    );
  }

  // 👉 Solo si NO hay bloqueo mostramos la hoja (Modal) completa
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.backdrop}>
        <View style={S.sheet}>
          {/* Header */}
          <View style={S.header}>
            <TouchableOpacity onPress={onClose} style={S.iconBtn} hitSlop={10}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={S.headerTitle}>Reprogramar cita</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Stepper */}
          <View style={S.stepper}>
            <StepDot active={step >= 1} label="Barbero" />
            <Line />
            <StepDot active={step >= 2} label="Fecha" />
            <Line />
            <StepDot active={step >= 3} label="Hora" />
            <Line />
            <StepDot active={step >= 4} label="Resumen" />
          </View>

          {/* STEP 1: Barbero */}
          {step === 1 && (
            <View style={{ flex: 1 }}>
              <Text style={S.sectionTitle}>Selecciona un barbero</Text>

              {loadingBarbers && mergedBarbers.length === 0 ? (
                <LoaderRow />
              ) : mergedBarbers.length === 0 ? (
                <Empty label="No hay barberos disponibles." />
              ) : (
                <FlatList
                  data={mergedBarbers}
                  keyExtractor={(b) => String(b.id)}
                  extraData={selectedBarberId}
                  renderItem={({ item }) => {
                    const active = toNum(selectedBarberId) === item.id;
                    return (
                      <Pressable
                        onPress={() => setSelectedBarberId(item.id)}
                        style={[S.barberRow, active && S.barberRowActive]}
                      >
                        <View style={[S.avatar, active && { borderColor: COLORS.brand }]}>
                          <Text style={S.avatarText}>{initials(item.name)}</Text>
                        </View>
                        <Text style={S.barberName}>{item.name}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color={COLORS.ok} />}
                      </Pressable>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  contentContainerStyle={{ paddingBottom: 8 }}
                />
              )}

              <Footer onNext={() => setStep(2)} nextDisabled={!canNextFromBarber} />
            </View>
          )}

          {/* STEP 2: Fecha */}
          {step === 2 && (
            <View style={{ flex: 1 }}>
              <Text style={S.sectionTitle}>Selecciona la fecha</Text>

              <Calendar
                minDate={todayYMD()}
                onDayPress={(d: any) => {
                  setSelectedDate(d.dateString);
                  setSelectedTimeSlot("");
                }}
                markedDates={
                  selectedDate
                    ? { [selectedDate]: { selected: true, marked: false, selectedColor: COLORS.brand } }
                    : {}
                }
                theme={{
                  calendarBackground: COLORS.white,
                  dayTextColor: COLORS.text,
                  textDisabledColor: "#9CA3AF",
                  monthTextColor: COLORS.text,
                  textMonthFontWeight: "800",
                  arrowColor: COLORS.text,
                  todayTextColor: "#2563EB",
                }}
                style={[S.calendar, { marginTop: 6 }]}
              />

              <Footer onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!canNextFromDate} />
            </View>
          )}

          {/* STEP 3: Hora */}
          {step === 3 && (
            <View style={{ flex: 1 }}>
              <Text style={S.sectionTitle}>Selecciona la hora</Text>

              {loadingSlots && selectedDate && (
                <Text style={{ color: COLORS.muted, marginBottom: 8 }}>Cargando horarios…</Text>
              )}

              {!selectedDate ? (
                <Empty label="Primero selecciona una fecha." />
              ) : timeSlots.length === 0 ? (
                <Empty label="No hay horarios disponibles para ese día." />
              ) : (
                <View style={S.slotsWrap}>
                  {timeSlots.map((slot, idx) => {
                    const active = selectedTimeSlot === slot;
                    return (
                      <Pressable
                        key={`${slot}-${idx}`}
                        onPress={() => setSelectedTimeSlot(slot)}
                        disabled={loadingSlots}
                        style={[S.slotPill, active && S.slotPillActive, { width: "48%" }]}
                      >
                        <Text style={[S.slotPillText, active && S.slotPillTextActive]}>
                          {slotLabelFromRaw(slot)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {!!slotsError && selectedDate && (
                <Text style={{ color: COLORS.danger, marginTop: 4 }}>
                  No fue posible cargar los horarios disponibles o el barbero no trabaja ese día.
                </Text>
              )}

              <Footer onBack={() => setStep(2)} onNext={() => setStep(4)} nextDisabled={!canNextFromTime} />
            </View>
          )}

          {/* STEP 4: Resumen */}
          {step === 4 && (
            <View style={{ flex: 1 }}>
              <Text style={S.confirmTitle}>Confirmar Cambios</Text>
              <Text style={S.confirmSubtitle}>Revisa los detalles</Text>

              {/* Cita Original: usa lo traído del detalle */}
              <View style={[S.blockCard, { backgroundColor: COLORS.redSoft, borderColor: COLORS.redBorder }]}>
                <Text style={[S.blockTitle, { color: "#B91C1C" }]}>Cita Original</Text>

                <View style={S.kvRow}>
                  <Text style={S.kvKey}>Barbero:</Text>
                  <Text style={[S.kvVal, { color: "#B91C1C" }]}>{origBarberName || "—"}</Text>
                </View>

                <View style={S.kvRow}>
                  <Text style={S.kvKey}>Fecha:</Text>
                  <Text style={[S.kvVal, { color: "#B91C1C" }]}>{fmtDateLong(origDate)}</Text>
                </View>

                <View style={S.kvRow}>
                  <Text style={S.kvKey}>Hora:</Text>
                  <Text style={[S.kvVal, { color: "#B91C1C" }]}>
                    {fmtRangeFromProps(origStart, origEnd)}
                  </Text>
                </View>
              </View>

              {/* Nueva Cita */}
              <View style={[S.blockCard, { backgroundColor: COLORS.greenSoft, borderColor: COLORS.greenBorder }]}>
                <Text style={[S.blockTitle, { color: "#15803D" }]}>Nueva Cita</Text>

                <View style={S.kvRow}>
                  <Text style={S.kvKey}>Barbero:</Text>
                  <Text style={[S.kvVal, { color: "#15803D" }]}>
                    {mergedBarbers.find((b) => b.id === toNum(selectedBarberId))?.name ?? "—"}
                  </Text>
                </View>

                <View style={S.kvRow}>
                  <Text style={S.kvKey}>Fecha:</Text>
                  <Text style={[S.kvVal, { color: "#15803D" }]}>{fmtDateLong(selectedDate)}</Text>
                </View>

                <View style={S.kvRow}>
                  <Text style={S.kvKey}>Hora:</Text>
                  <Text style={[S.kvVal, { color: "#15803D" }]}>{slotLabelFromRaw(selectedTimeSlot)}</Text>
                </View>
              </View>

             

              {/* Botonera alineada */}
              <View style={S.footerRow}>
                <TouchableOpacity onPress={() => setStep(3)} style={[S.ctaBtn, S.ctaGhost]}>
                  <Text style={[S.ctaText, { color: COLORS.text }]}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={confirming}
                  style={[S.ctaBtn, confirming ? S.btnDisabled : S.btnPrimary]}
                  activeOpacity={confirming ? 1 : 0.9}
                >
                  {confirming ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[S.ctaText, { color: "#fff" }]}>✓ Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ------------------ Overlay inline (sin Modal) ------------------ */
function InlineOverlay({
  children,
  onBackdrop,
}: {
  children: React.ReactNode;
  onBackdrop?: () => void;
}) {
  return (
    <View style={S.inlineOverlayRoot} pointerEvents="box-none">
      {/* capa click-out */}
      <Pressable style={S.inlineOverlayBackdrop} onPress={onBackdrop} />
      <View style={S.inlineOverlayCard}>
        {children}
      </View>
    </View>
  );
}

/* ------------------ Footer (pasos) ------------------ */
function Footer({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <View style={S.footer}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={[S.btn, S.btnGhost]}>
          <Text style={[S.btnText, { color: COLORS.text }]}>Atrás</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 100 }} />
      )}

      {onNext && (
        <TouchableOpacity
          onPress={onNext}
          disabled={!!nextDisabled}
          style={[S.btn, nextDisabled ? S.btnDisabled : S.btnPrimary]}
          activeOpacity={nextDisabled ? 1 : 0.9}
        >
          <Text style={S.btnText}>Siguiente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ------------------ Bloqueador (contenido del pop-up) ------------------ */
function Blocker({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string | null;
  onClose: () => void;
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: COLORS.reservadoSoft, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Ionicons name="warning-outline" size={28} color={COLORS.reservado} />
      </View>

      <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.text, textAlign: "center" }}>{title}</Text>
      {subtitle ? <Text style={{ color: COLORS.muted, textAlign: "center", marginTop: 6 }}>{subtitle}</Text> : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <TouchableOpacity onPress={onClose} style={[S.btn, S.btnPrimary]}>
          <Text style={S.btnText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ------------------ UI helpers ------------------ */
function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: active ? COLORS.brand : COLORS.border }} />
      <Text style={{ color: active ? COLORS.text : COLORS.muted, fontSize: 11, marginTop: 6 }}>{label}</Text>
    </View>
  );
}
function Line() { return <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border, marginHorizontal: 6 }} />; }
function Empty({ label }: { label: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 20 }}>
      <Text style={{ color: COLORS.muted, textAlign: "center" }}>{label}</Text>
    </View>
  );
}
function LoaderRow() {
  return (
    <View style={{ paddingVertical: 20, alignItems: "center" }}>
      <ActivityIndicator />
    </View>
  );
}

/* ------------------ Styles ------------------ */
const S = StyleSheet.create({
  // Overlay inline (sin Modal)
  inlineOverlayRoot: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  inlineOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  inlineOverlayCard: {
    width: "88%",
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    // sombras
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  backdrop: { flex: 1, backgroundColor: COLORS.dim, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    minHeight: "80%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  headerTitle: { color: COLORS.text, fontWeight: "800", fontSize: 22 },

  stepper: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginVertical: 10 },

  calendar: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingBottom: 6,
  },

  barberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barberRowActive: { borderColor: COLORS.brand, backgroundColor: "#F9FAFB" },
  barberName: { color: COLORS.text, fontWeight: "700", marginLeft: 10, flex: 1 },

  avatar: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatarText: { color: COLORS.brand, fontWeight: "800" },

  slotsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  slotPill: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  slotPillActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  slotPillText: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  slotPillTextActive: { color: "#FFFFFF" },

  /* Resumen */
  confirmTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text, marginTop: 4 },
  confirmSubtitle: { color: COLORS.muted, marginBottom: 10 },

  blockCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  blockTitle: { fontSize: 16, fontWeight: "900", marginBottom: 8 },

  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  kvKey: { color: COLORS.text, fontWeight: "900", opacity: 0.9 },
  kvVal: { color: COLORS.text, fontWeight: "900" },

  summaryBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  summaryTitle: { color: COLORS.text, fontWeight: "900", marginBottom: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryKey: { color: COLORS.muted, fontWeight: "700" },
  summaryVal: { color: COLORS.text, fontWeight: "900" },

  /* Botonera resumen */
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  ctaBtn: {
    flex: 1,
    height: 30, // ← respeté tu valor original
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  ctaGhost: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: COLORS.border },
  ctaText: { fontSize: 16, fontWeight: "900" },

  /* Footer de pasos */
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  btn: { minWidth: 100, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  btnPrimary: { backgroundColor: COLORS.brand },
  btnDisabled: { backgroundColor: "#E5E7EB" },
  btnText: { color: COLORS.white, fontWeight: "800" },
});
