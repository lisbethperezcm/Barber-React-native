// app/(booking)/new.tsx
import { Stack, useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthContext } from "@/assets/src/context/AuthContext";
import { useCreateAppointment } from "@/assets/src/features/appointment/useCreateAppointment";
import { useAvailableSlots } from "@/assets/src/features/barber/useAvailableSlots";
import { useBarbers } from "@/assets/src/features/barber/useBarbers";
import { Client, useClients } from "@/assets/src/features/client/useClients";
import { useServices } from "@/assets/src/features/service/useServices";
import Loader from "@/components/Loader";
import axios from "axios";

// 📅 Calendario UI (no cambia tu lógica de fetch)
import { Calendar } from "react-native-calendars";

// Tipo local para onDayPress (algunas versiones no exportan DateObject)
type RNCalDate = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

// Paleta
const COLORS = { bg: "#FFFFFF", text: "#111827", muted: "#6B7280", border: "#E5E7EB", brand: "#111827" };

function currencyDOP(v: number) {
  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `RD$ ${Math.round(v)}`;
  }
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
function todayYMD() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function formatLongEs(ymd: string) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Tipos locales
type BarberItem = { id: number; name: string; rating?: number };
type ServiceItem = { id: number; name: string; duration_minutes: number; price: number };

// Fallbacks (solo UI si no hay datos)
const SERVICES_FALLBACK: ServiceItem[] = [
  { id: 1, name: "Corte de pelo", duration_minutes: 30, price: 500 },
  { id: 2, name: "Recorte de barba", duration_minutes: 20, price: 250 },
  { id: 3, name: "Corte y barba", duration_minutes: 45, price: 600 },
  { id: 4, name: "Peinado", duration_minutes: 25, price: 200 },
  { id: 5, name: "Tinte", duration_minutes: 60, price: 650 },
];
const TIME_SLOTS_FALLBACK: string[] = [
  "9:00 AM - 9:50 AM",
  "9:30 AM - 10:20 AM",
  "10:00 AM - 10:50 AM",
  "10:30 AM - 11:20 AM",
  "11:00 AM - 11:50 AM",
  "11:30 AM - 12:20 PM",
  "1:00 PM - 1:50 PM",
  "1:30 PM - 2:20 PM",
  "2:00 PM - 2:50 PM",
  "2:30 PM - 3:20 PM",
  "3:00 PM - 3:50 PM",
  "3:30 PM - 4:20 PM",
  "4:00 PM - 4:50 PM",
  "4:30 PM - 5:20 PM",
];

// ⚠️ Esta función es la MISMA que tenías (no cambia formato que envías al API)
function extractStartEndRaw(slot: string) {
  const normalized = String(slot).replace(/\b(\d{1,2}:\d{2})(?!:\d{2})\b/g, "$1:00");
  const [left, right] = normalized.split("-", 2);
  const startT = (left ?? "").trim();
  const endT = (right ?? "").trim();
  return { start: startT, end: endT || null };
}

export default function New() {
  const router = useRouter();

  // ===== Estado base =====
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(""); // ⬅️ vacío hasta que elijas en el calendario
  const [showCalendar, setShowCalendar] = useState(false);       // ⬅️ muestra/oculta calendario
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const { start, end } = extractStartEndRaw(selectedTimeSlot);
  const [selectedClient, setSelectedClient] = useState<number | string | null>(null);
  const [qClient, setQClient] = useState("");
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);

  // ✅ Popup de éxito
  const [showSuccess, setShowSuccess] = useState(false);

  // Role
  const { isBarber } = useContext(AuthContext);

  // ===== Data hooks (NO tocan tu lógica de traer citas) =====
  const { data: servicesApi, isFetching: loadingServices } = useServices({ enabled: step === 1 });
  const services: ServiceItem[] = useMemo(
    () =>
      servicesApi?.length
        ? servicesApi.map((s: any) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration_minutes: s.durationMin,
        }))
        : SERVICES_FALLBACK,
    [servicesApi]
  );

  const { data: barbersApi = [], isFetching: loadingBarbers } = useBarbers({
    enabled: !isBarber && step === 2,
  });
  const { data: clientsAll = [], isFetching: loadingClients } = useClients({
    enabled: isBarber && step === 2,
  });

  const barbers: BarberItem[] = useMemo(
    () =>
      Array.isArray(barbersApi)
        ? barbersApi.map((b: any) => ({ id: b.id, name: b.name, rating: b.rating }))
        : [],
    [barbersApi]
  );

  const clients = useMemo(() => {
    const q = qClient.trim().toLowerCase();
    if (!q) return clientsAll;
    return clientsAll.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const idStr = String(c.id).toLowerCase();
      return name.includes(q) || email.includes(q) || idStr.includes(q);
    });
  }, [qClient, clientsAll]);

  const selectedServiceDetails = useMemo(
    () => services.filter((s) => selectedServices.includes(s.id)),
    [services, selectedServices]
  );
  const totalMinutes = useMemo(
    () => selectedServiceDetails.reduce((acc, s) => acc + (s.duration_minutes || 0), 0),
    [selectedServiceDetails]
  );
  const enableSlotsQuery = Boolean(selectedDate && totalMinutes && (!isBarber ? selectedBarber : true));

  const {
    data: slotsApi = [],
    isLoading: loadingSlots,
    error: slotsError,
    refetch: refetchSlots,
  } = useAvailableSlots(
    {
      barberId: !isBarber ? selectedBarber : undefined,
      date: selectedDate,
      duration: totalMinutes,
    },
    { enabled: enableSlotsQuery }
  );

  const timeSlots: string[] = useMemo(
    () =>
      Array.isArray(slotsApi) && slotsApi.length
        ? slotsApi.map((s: any) => {
          const left = (s.startISO ?? "").trim();
          const right = (s.endISO ?? "").trim();
          return right ? `${left} - ${right}` : left;
        })
        : TIME_SLOTS_FALLBACK,
    [slotsApi]
  );

  useEffect(() => {
    if (enableSlotsQuery) refetchSlots();
  }, [enableSlotsQuery, selectedDate, selectedBarber, totalMinutes, refetchSlots]);

  const chosenBarber = useMemo(() => barbers.find((b) => b.id === selectedBarber) || null, [barbers, selectedBarber]);
  // @ts-ignore (tipo Client del hook local)
  const chosenClient = useMemo(() => clients.find((c: Client) => c.id === selectedClient) || null, [clients, selectedClient]);

  const toggleService = (id: number) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedServices([]);
    setSelectedDate("");
    setShowCalendar(false);
    setSelectedTimeSlot("");
    setSelectedClient(null);
    setSelectedBarber(null);
    setQClient("");
  };

  // Pasos por rol (solo UI)
  const stepTitles = isBarber
    ? ["Selecciona los servicios", "Elige el cliente", "Elige fecha y hora", "Resumen de la Reserva"]
    : ["Selecciona los servicios", "Elige el barbero", "Elige fecha y hora", "Resumen de la Reserva"];
  const tabTitle = isBarber ? ["Servicios", "Cliente", "Fecha y Hora", "Resumen"] : ["Servicios", "Barbero", "Fecha y Hora", "Resumen"];

  const canProceed =
    (step === 1 && selectedServices.length > 0) ||
    (step === 2 && (isBarber ? selectedClient !== null : selectedBarber !== null)) ||
    (step === 3 && selectedDate && selectedTimeSlot) ||
    step === 4;

  // ===== Crear cita (NO modifico tu lógica de listar citas) =====
  const { createAppointment, isPending: creating } = useCreateAppointment();
  const handleReserve = async () => {
    const validRoleFields = isBarber ? selectedClient != null : selectedBarber != null;
    if (!(selectedDate && selectedTimeSlot && selectedServices.length && validRoleFields)) return;

    try {
      const payload: any = {
        appointment_date: selectedDate,
        start_time: start, // se mantiene igual que antes
        end_time: end,     // se mantiene igual que antes
        services: selectedServices,
      };
      if (isBarber) payload.client_id = selectedClient; // 👈 sin cambios
      else payload.barber_id = selectedBarber;          // 👈 sin cambios

      await createAppointment(payload);

      // UI de éxito
      setShowSuccess(true);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const msg =
          (e.response?.data as any)?.message ??
          (status === 422 ? "Datos inválidos. Verifica la selección." : "No se pudo crear la cita. Intenta nuevamente.");
        console.log("[createAppointment][422/other]:", e.response?.data, msg);
      } else {
        console.log("[createAppointment][network]:", e);
      }
    }
  };

  // Animaciones
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 260, mass: 0.6, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);


  // 1) Hooks para la animación (colócalos junto a tus otros estados)
  const barAnim = useRef(new Animated.Value(0)).current; // ancho animado en px
  const [barWidth, setBarWidth] = useState(0);           // ancho real medido del track

  useEffect(() => {
    if (!showSuccess || barWidth <= 0) return;
    barAnim.setValue(barWidth); // inicia lleno
    const anim = Animated.timing(barAnim, {
      toValue: 0,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,   // width en px
    });
    anim.start(({ finished }) => {
      if (finished) {
        setShowSuccess(false);
        resetFlow();                       // 🔄 limpiar estado local del flujo
        router.replace("/(tabs)/citas");   // ⬅️ ir a Citas al terminar
      }
    });
    return () => anim.stop();
  }, [showSuccess, barWidth]);

  return (
    <>
      <Stack.Screen options={{ title: "Nueva reserva" }} />
      <Animated.View style={{ flex: 1, backgroundColor: COLORS.bg, opacity, transform: [{ translateY }] }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Agendar cita</Text>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Text style={{ fontSize: 18, color: COLORS.muted }}>×</Text>
          </Pressable>
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            {[1, 2, 3, 4].map((n) => (
              <View
                key={n}
                style={[styles.progressBar, { backgroundColor: n === step ? COLORS.brand : n < step ? "#D1D5DB" : "#F3F4F6" }]}
              />
            ))}
          </View>
          <View style={styles.progressLabels}>
            {tabTitle.map((title) => (
              <Text key={title} style={styles.progressLabel}>
                {title}
              </Text>
            ))}
          </View>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepTitle}>{stepTitles[step - 1]}</Text>

          {/* Paso 1: Servicios */}
          {step === 1 && (
            <View style={{ gap: 12 }}>
              {loadingServices && <Loader text="Cargando servicios..." />}
              {!loadingServices &&
                services.map((s) => {
                  const selected = selectedServices.includes(s.id);
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => toggleService(s.id)}
                      style={({ pressed }) => [
                        styles.card,
                        {
                          borderColor: selected ? COLORS.brand : COLORS.border,
                          backgroundColor: selected ? "#F9FAFB" : "#FFFFFF",
                          opacity: pressed ? 0.9 : 1,
                        },
                      ]}
                    >
                      <View style={styles.cardRow}>
                        <View style={styles.cardLeft}>
                          <View style={styles.iconCircle} />
                          <View>
                            <Text style={styles.cardTitle}>{s.name}</Text>
                            <Text style={styles.cardMeta}>{s.duration_minutes} min</Text>
                          </View>
                        </View>
                        <View style={styles.cardRight}>
                          <Text style={styles.price}>{currencyDOP(s.price)}</Text>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 2,
                              borderColor: selected ? COLORS.brand : COLORS.border,
                              backgroundColor: selected ? COLORS.brand : "transparent",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {selected && <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text>}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              {selectedServices.length > 0 && (
                <View style={styles.summaryBox}>
                  <View style={styles.summaryRowBetween}>
                    <Text style={styles.summaryLabel}>Servicios seleccionados:</Text>
                    <Text style={styles.summaryValue}>{selectedServices.length}</Text>
                  </View>
                  <View style={styles.summaryRowBetween}>
                    <Text style={styles.summaryLabel}>Total estimado:</Text>
                    <Text style={styles.summaryValue}>
                      {currencyDOP(selectedServiceDetails.reduce((acc, s) => acc + s.price, 0))}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Paso 2 (dinámico): Cliente (barbero) o Barbero (cliente) */}
          {step === 2 &&
            (isBarber ? (
              <View style={{ gap: 12 }}>
                <TextInput
                  placeholder="Buscar por nombre o correo"
                  placeholderTextColor={COLORS.muted}
                  value={qClient}
                  onChangeText={setQClient}
                  style={styles.input}
                />
                {loadingClients && <Loader text="Cargando clientes..." />}
                {!loadingClients && clients.length === 0 && (
                  <View style={styles.summaryBox}>
                    <Text style={{ color: COLORS.text, fontWeight: "800", marginBottom: 4 }}>Sin resultados</Text>
                    <Text style={{ color: COLORS.muted }}>Verifica el nombre o busca por correo.</Text>
                  </View>
                )}
                {!loadingClients &&
                  // @ts-ignore (tipo del hook local)
                  clients.map((c: Client) => {
                    const selected = String(selectedClient ?? "") === String(c.id);
                    const fullName = c.name;
                    const initials = fullName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setSelectedClient(c.id)}
                        style={({ pressed }) => [
                          styles.card,
                          {
                            borderColor: selected ? COLORS.brand : COLORS.border,
                            backgroundColor: selected ? "#F9FAFB" : "#FFFFFF",
                            opacity: pressed ? 0.9 : 1,
                          },
                        ]}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                          <View style={styles.avatar}>
                            <Text style={{ color: COLORS.muted, fontWeight: "800" }}>{initials}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{fullName}</Text>
                            {c.email && <Text style={styles.cardMeta}>{c.email}</Text>}
                          </View>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 2,
                              borderColor: selected ? COLORS.brand : COLORS.border,
                              backgroundColor: selected ? COLORS.brand : "transparent",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {selected && <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text>}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {loadingBarbers && <Loader text="Cargando barberos..." />}
                {!loadingBarbers &&
                  barbers.map((b) => {
                    const selected = selectedBarber === b.id;
                    const initials = b.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("");
                    return (
                      <Pressable
                        key={b.id}
                        onPress={() => setSelectedBarber(b.id)}
                        style={({ pressed }) => [
                          styles.card,
                          {
                            borderColor: selected ? COLORS.brand : COLORS.border,
                            backgroundColor: selected ? "#F9FAFB" : "#FFFFFF",
                            opacity: pressed ? 0.9 : 1,
                          },
                        ]}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                          <View style={styles.avatar}>
                            <Text style={{ color: COLORS.muted, fontWeight: "800" }}>{initials}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{b.name}</Text>
                            {"rating" in b && b.rating != null && <Text style={styles.cardMeta}>★ {b.rating}</Text>}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
              </View>
            ))}

          {/* Paso 3: Fecha (campo + calendario) y hora */}
          {step === 3 && (
            <View style={{ gap: 16 }}>
              {/* Campo de fecha: abre/cierra calendario */}
              <View>
                <Text style={styles.sectionTitle}>Selecciona la fecha</Text>

                <Pressable
                  onPress={() => setShowCalendar((v) => !v)}
                  style={[
                    styles.input,
                    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                  ]}
                >
                  <Text style={{ color: selectedDate ? COLORS.text : "#9CA3AF" }}>
                    {selectedDate ? formatLongEs(selectedDate) : "Toca para elegir una fecha"}
                  </Text>
                  <Text style={{ color: COLORS.muted }}>{showCalendar ? "▲" : "▼"}</Text>
                </Pressable>

                {showCalendar && (
                  <Calendar
                    minDate={todayYMD()}
                    onDayPress={(d: RNCalDate) => {
                      setSelectedDate(d.dateString);
                      setSelectedTimeSlot(""); // limpiar slot al cambiar fecha
                      setShowCalendar(false);   // cerrar calendario
                    }}
                    markedDates={
                      selectedDate
                        ? { [selectedDate]: { selected: true, marked: false, selectedColor: COLORS.brand } }
                        : {}
                    }
                    theme={{
                      calendarBackground: COLORS.bg,
                      dayTextColor: COLORS.text,
                      textDisabledColor: "#9CA3AF",
                      monthTextColor: COLORS.text,
                      textMonthFontWeight: "800",
                      arrowColor: COLORS.text,
                      todayTextColor: "#2563EB",
                    }}
                    style={[styles.calendar, { marginTop: 10 }]}
                  />
                )}
              </View>

              {/* Horarios */}
              <View>
                <Text style={styles.sectionTitle}>Selecciona la hora</Text>
                {loadingSlots && <Text style={{ color: COLORS.muted, marginBottom: 8 }}>Cargando horarios…</Text>}

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {timeSlots.map((slot, idx) => {
                    const active = selectedTimeSlot === slot;
                    return (
                      <Pressable
                        key={`${slot}-${idx}`}
                        onPress={() => setSelectedTimeSlot(slot)}
                        disabled={!!loadingSlots || !selectedDate}
                        style={({ pressed }) => [
                          styles.slot,
                          {
                            width: "48%",
                            borderColor: active ? COLORS.brand : COLORS.border,
                            backgroundColor: active ? COLORS.brand : "#FFFFFF",
                            opacity: pressed ? 0.9 : loadingSlots ? 0.6 : 1,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#FFFFFF" : COLORS.text }}>
                          {slotLabelFromRaw(slot)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {!!slotsError && (
                  <Text style={{ color: "#b91c1c", marginTop: 4 }}>
                    No fue posible cargar los horarios disponibles.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Paso 4: Resumen */}
          {step === 4 && (
            <View style={{ gap: 16 }}>
              {!isBarber && chosenBarber && (
                <View style={{ backgroundColor: "#F9FAFB", borderRadius: 16, padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <View style={styles.avatar}>
                      <Text style={{ color: COLORS.muted, fontWeight: "800" }}>
                        {chosenBarber.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>{chosenBarber.name}</Text>
                      {"rating" in chosenBarber && chosenBarber.rating != null && (
                        <Text style={styles.cardMeta}>★ {chosenBarber.rating}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {isBarber && chosenClient && (
                <View style={{ backgroundColor: "#F9FAFB", borderRadius: 16, padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <View style={styles.avatar}>
                      <Text style={{ color: COLORS.muted, fontWeight: "800" }}>
                        {chosenClient.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>{chosenClient.name}</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={{ gap: 6 }}>
                <Text style={styles.summaryRow}>📅 {selectedDate || "—"}</Text>
                <Text style={styles.summaryRow}>⏰ {slotLabelFromRaw(selectedTimeSlot) || "—"}</Text>
              </View>

              <View>
                <Text style={styles.sectionTitle}>Servicios:</Text>
                <View style={{ gap: 8 }}>
                  {selectedServiceDetails.map((s) => (
                    <View key={s.id} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: COLORS.text }}>{s.name}</Text>
                      <Text style={{ color: COLORS.text, fontWeight: "700" }}>{currencyDOP(s.price)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 12, gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: COLORS.muted }}>Duración total</Text>
                  <Text style={{ color: COLORS.text, fontWeight: "700" }}>{totalMinutes} min</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: COLORS.text, fontWeight: "800", fontSize: 16 }}>Total:</Text>
                  <Text style={{ color: COLORS.text, fontWeight: "800", fontSize: 16 }}>
                    {currencyDOP(selectedServiceDetails.reduce((acc, s) => acc + s.price, 0))}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 1 && (
            <Pressable onPress={() => setStep(step - 1)} style={[styles.btn, styles.btnSecondary]}>
              <Text style={[styles.btnText, { color: COLORS.text }]}>Anterior</Text>
            </Pressable>
          )}
          <Pressable
            disabled={!canProceed}
            onPress={() => {
              if (step < 4) setStep(step + 1);
              else handleReserve();
            }}
            style={[styles.btn, !canProceed ? styles.btnDisabled : styles.btnPrimary]}
          >
            <Text style={[styles.btnText, { color: !canProceed ? "#6B7280" : "#fff" }]}>
              {step === 4 ? (creating ? "Reservando..." : "Reservar Ahora") : "Siguiente"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
           {/*modal con animaciones*/}
      <Modal visible={showSuccess} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBackdrop}>
          {/* overflow: 'hidden' para que la barra respete EXACTAMENTE el borde redondeado */}
          <View style={[styles.modalCard, { overflow: "hidden" }]}>
            {/* Barra superior de progreso (mismo borderRadius que la card) */}
            <View
              style={modalStyles.progressTrack}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              pointerEvents="none"
            >
              <Animated.View style={[modalStyles.progressFill, { width: barAnim }]} />
            </View>

            <View style={styles.successIcon}>
              <Text style={{ fontSize: 28 }}>✅</Text>
            </View>
            <Text style={styles.modalTitle}>¡Cita creada!</Text>
            <Text style={styles.modalMsg}>Tu cita fue creada satisfactoriamente.</Text>

            {/* 🔕 Sin botón: la barra se consume y navega sola en 5s */}
          </View>
        </View>
      </Modal>


    </>
  );
}
// 3) Estilos auxiliares SOLO para la barra 
const CARD_RADIUS = 16; // ⬅️ usa el mismo radio que tu styles.modalCard
const modalStyles = StyleSheet.create({
  progressTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#E5E7EB", // pista gris
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    // El overflow real lo hace la card (modalCard) con overflow: 'hidden'
    zIndex: 1,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#16A34A", // verde éxito
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
});

// ===== Estilos =====
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  iconBtn: { padding: 8, borderRadius: 999, backgroundColor: "#F3F4F6" },

  progressWrap: { paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderColor: "#F3F4F6" },
  progressRow: { flexDirection: "row", gap: 8 },
  progressBar: { flex: 1, height: 8, borderRadius: 999 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressLabel: { fontSize: 11, color: COLORS.muted },

  content: { padding: 24 },
  stepTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 16 },

  card: { borderWidth: 2, borderRadius: 16, padding: 16 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#E5E7EB" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  cardMeta: { fontSize: 12, color: COLORS.muted },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  price: { fontWeight: "800", color: COLORS.text },

  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
  },

  // 📅 calendario
  calendar: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingBottom: 6,
  },

  slot: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },

  summaryBox: { backgroundColor: "#F9FAFB", borderRadius: 16, padding: 16 },
  summaryRow: { color: COLORS.text, fontSize: 14 },
  summaryRowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  summaryLabel: { color: COLORS.text, fontWeight: "600" },
  summaryValue: { color: COLORS.text, fontWeight: "800" },

  footer: { padding: 24, borderTopWidth: 1, borderColor: "#F3F4F6", flexDirection: "row", gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnPrimary: { backgroundColor: COLORS.brand },
  btnSecondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border },
  btnDisabled: { backgroundColor: "#E5E7EB" },
  btnText: { fontWeight: "800", fontSize: 16, color: "#fff" },

  // Modal éxito
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modalTitle: { color: COLORS.text, fontWeight: "900", fontSize: 18 },
  modalMsg: { color: COLORS.muted, textAlign: "center", marginTop: 6 },
});
