// app/(booking)/new.tsx  (o el path que uses)
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useCreateAppointment } from "@/assets/src/features/appointment/useCreateAppointment";
import { useAvailableSlots } from "@/assets/src/features/barber/useAvailableSlots";
import { useBarbers } from "@/assets/src/features/barber/useBarbers";
import { useServices } from "@/assets/src/features/service/useServices";
import Loader from "@/components/Loader";
import axios from "axios";



// Paleta usada en tu app
const COLORS = {
    bg: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    border: "#E5E7EB",
    brand: "#111827",
};

function currencyDOP(v: number) {
    try {
        return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(v);
    } catch {
        return `RD$ ${Math.round(v)}`;
    }
}

// Convierte "HH:mm" a "h:mm AM/PM"
function to12h(time24: string): string {
    const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec((time24 ?? "").trim());
    if (!m) return time24;
    let h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    const ampm = h < 12 ? "AM" : "PM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

// Acepta "HH:mm - HH:mm" (con o sin espacios) y devuelve "h:mm AM/PM - h:mm AM/PM"
function slotLabelFromRaw(raw: string): string {
    const re = /^\s*(\d{1,2}:\d{2})(?::\d{2})?\s*-\s*(\d{1,2}:\d{2})(?::\d{2})?\s*$/;
    const m = re.exec(raw ?? "");
    if (!m) {
        // también soporta un solo tiempo "HH:mm"
        const single = /^\s*(\d{1,2}:\d{2})(?::\d{2})?\s*$/.exec(raw ?? "");
        return single ? to12h(single[1]) : raw;
    }
    return `${to12h(m[1])} - ${to12h(m[2])}`;
}

// Fallbacks locales (si no vienen por API)
type BarberItem = { id: number; name: string; rating?: number };
type ServiceItem = { id: number; name: string; duration_minutes: number; price: number };

const SERVICES_FALLBACK: ServiceItem[] = [
    { id: 1, name: "Corte de pelo", duration_minutes: 30, price: 500 },
    { id: 2, name: "Recorte de barba", duration_minutes: 20, price: 250 },
    { id: 3, name: "Corte y barba", duration_minutes: 45, price: 600 },
    { id: 4, name: "Peinado", duration_minutes: 25, price: 200 },
    { id: 5, name: "Tinte", duration_minutes: 60, price: 650 },
];

const BARBERS_FALLBACK: BarberItem[] = [
    { id: 1, name: "Juan Pérez", rating: 4.8 },
    { id: 2, name: "Jhonny Bravo", rating: 4.9 },
    { id: 3, name: "Michael Benítez", rating: 4.6 },
    { id: 4, name: "Julio Damirón", rating: 4.7 },
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

export default function New() {
    const router = useRouter();


    // ===== Estado interno (idéntico visual) =====
    const [step, setStep] = useState(1);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
    const { start, end } = extractStartEndRaw(selectedTimeSlot);
     // ===== Crear cita (paso 4) =====
    const { createAppointment, isPending: creating } = useCreateAppointment();
    
    const canReserve =
        !!selectedDate &&
        !!selectedBarber &&
        !!selectedTimeSlot &&
        (selectedServices?.length ?? 0);

    const handleReserve = async () => {
        console.log("[reserve] pressed");
        if (!canReserve) return;
        try {

           const res = await createAppointment({
                appointment_date: selectedDate, // "YYYY-MM-DD"
                start_time: start,
                end_time: end,
                barber_id: selectedBarber!,
                services: selectedServices,
            });
           // console.log( selectedDate, start, end, selectedBarber, selectedServices);
           

            //Logica API retorna { message } o { data }, actúa en base a eso:
            // showSnackbar(res?.message ?? "Cita reservada exitosamente ✔");
            // Navega / cierra modal:
            // onClose();
        }
        catch (e) {
            if (axios.isAxiosError(e)) {
                const status = e.response?.status;
                const msg =
                    (e.response?.data as any)?.message ??
                    (status === 422
                        ? "Datos inválidos. Verifica la selección."
                        : "No se pudo crear la cita. Intenta nuevamente.");
                // showSnackbar(msg);
                console.log("[createAppointment][422/other]:", e.response?.data);
            } else {
                // showSnackbar("Error de red. Revisa tu conexión.");
                console.log("[createAppointment][network]:", e);
            }
        }
    };

    // Animaciones de entrada (sin cambios visuales)
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(16)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 260, mass: 0.6, useNativeDriver: true }),
        ]).start();
    }, [opacity, translateY]);

    // ===== Llamadas a la API (no afectan JSX) =====

    // 1) Servicios (paso 1)
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

    // 2) Barberos (paso 2)
    const { data: barbersApi, isFetching: loadingBarbers } = useBarbers({ enabled: step === 2 });
    const barbers: BarberItem[] = useMemo(
        () =>
            barbersApi?.length
                ? barbersApi.map((b: any) => ({ id: b.id, name: b.name, rating: b.rating }))
                : BARBERS_FALLBACK,
        [barbersApi]
    );

    // 3) Slots (cuando hay barbero, fecha y duración total)
    const selectedServiceDetails = useMemo(
        () => services.filter((s) => selectedServices.includes(s.id)),
        [services, selectedServices]
    );

    const totalMinutes = useMemo(
        () => selectedServiceDetails.reduce((acc, s) => acc + (s.duration_minutes || 0), 0),
        [selectedServiceDetails]
    );

    const totalPrice = useMemo(
        () => selectedServiceDetails.reduce((acc, s) => acc + (s.price || 0), 0),
        [selectedServiceDetails]
    );

    const enableSlotsQuery = Boolean(selectedBarber && selectedDate && totalMinutes);
    const {
        data: slotsApi = [],
        isLoading: loadingSlots,
        error: slotsError,
    } = useAvailableSlots({ barberId: selectedBarber, date: selectedDate, duration: totalMinutes }, { enabled: enableSlotsQuery });

    const timeSlots: string[] = useMemo(() => {
        if (Array.isArray(slotsApi) && slotsApi.length) {
            return slotsApi.map((s: any) => {
                const left = (s.startISO ?? "").trim();
                const right = (s.endISO ?? "").trim();
                return right ? `${left} - ${right}` : left;
            });
        }
        return TIME_SLOTS_FALLBACK;
    }, [slotsApi]);

   

  /*  const reserve = await createAppointment({
        appointment_date: selectedDate,
        start_time: start,
        end_time: end,
        barber_id: selectedBarber!,
        services: selectedServices,
    }).catch((e: any) => {
        console.log("[createAppointment][error]:", e?.response?.data ?? e?.message ?? e);
        return null; // evita que el await reviente
    });*/



    function extractStartEndRaw(slot: string): { start: string; end: string | null } {

  const normalized = String(slot).replace(/\b(\d{1,2}:\d{2})(?!:\d{2})\b/g, "$1:00");
  const [left, right] = normalized.split("-", 2);
  const start = (left ?? "").trim();
  const end = (right ?? "").trim();
  return { start, end: end || null };
}


    // ===== Derivados de UI (sin cambios visuales) =====
    const chosenBarber = useMemo(
        () => barbers.find((b) => b.id === selectedBarber) || null,
        [barbers, selectedBarber]
    );

    const toggleService = (serviceId: number) => {
        const next = selectedServices.includes(serviceId)
            ? selectedServices.filter((id) => id !== serviceId)
            : [...selectedServices, serviceId];
        setSelectedServices(next);
    };

    const canProceed =
        (step === 1 && selectedServices.length > 0) ||
        (step === 2 && selectedBarber !== null) ||
        (step === 3 && selectedDate && selectedTimeSlot) ||
        step === 4;

    const stepTitles = ["Selecciona los servicios", "Elige tu barbero", "Elige fecha y hora", "Resumen de la Reserva"];

    return (
        <>
            <Stack.Screen options={{ title: "Nueva reserva" }} />

            <Animated.View style={[styles.screen, { opacity, transform: [{ translateY }] }]}>
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
                        <Text style={styles.progressLabel}>Servicios</Text>
                        <Text style={styles.progressLabel}>Barbero</Text>
                        <Text style={styles.progressLabel}>Fecha y Hora</Text>
                        <Text style={styles.progressLabel}>Resumen</Text>
                    </View>
                </View>

                {/* Content */}
                <ScrollView contentContainerStyle={styles.content}>
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
                                            disabled={!!loadingServices}
                                            style={({ pressed }) => [
                                                styles.card,
                                                {
                                                    borderColor: selected ? COLORS.brand : COLORS.border,
                                                    backgroundColor: selected ? "#F9FAFB" : "#FFFFFF",
                                                    opacity: pressed ? 0.9 : loadingServices ? 0.6 : 1,
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
                                        <Text style={styles.summaryValue}>{currencyDOP(totalPrice)}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Paso 2: Barbero */}
                    {step === 2 && (
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
                                            disabled={!!loadingBarbers}
                                            style={({ pressed }) => [
                                                styles.card,
                                                {
                                                    borderColor: selected ? COLORS.brand : COLORS.border,
                                                    backgroundColor: selected ? "#F9FAFB" : "#FFFFFF",
                                                    opacity: pressed ? 0.9 : loadingBarbers ? 0.6 : 1,
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
                    )}

                    {/* Paso 3: Fecha y hora */}
                    {step === 3 && (
                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={styles.sectionTitle}>Selecciona la fecha</Text>
                                <TextInput
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#9CA3AF"
                                    value={selectedDate}
                                    onChangeText={setSelectedDate}
                                    style={styles.input}
                                />
                            </View>

                            <View>
                                <Text style={styles.sectionTitle}>Selecciona la hora</Text>
                                {loadingSlots && <Text style={{ color: COLORS.muted, marginBottom: 8 }}>Cargando horarios…</Text>}
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                                    {timeSlots.map((slot, idx) => {
                                        const active = selectedTimeSlot === slot; // ← comparación con el valor original
                                        return (
                                            <Pressable
                                                key={`${slot}-${idx}`} // evita colisiones si hay duplicados
                                                onPress={() => setSelectedTimeSlot(slot)} // ← guarda el original
                                                disabled={!!loadingSlots}
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
                                    <Text style={{ color: "#b91c1c", marginTop: 4 }}>No fue posible cargar los horarios disponibles.</Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Paso 4: Resumen */}
                    {step === 4 && (
                        <View style={{ gap: 16 }}>
                            {chosenBarber && (
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
                                    <Text style={{ color: COLORS.text, fontWeight: "800", fontSize: 16 }}>{currencyDOP(totalPrice)}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                  {/* Footer (visual intacto) */}
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
        {/* ⬆️ FALTABA cerrar este View */}
      </Animated.View>
    </>
  );
}
// ===== Estilos (sin cambios) =====
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
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
    input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text },
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
    btnText: { fontWeight: "800", fontSize: 16 },
});
