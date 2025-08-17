// components/BookingFlow.native.tsx
// Pantalla completa (React Native) — sin DOM ni framer-motion
// Metro usará este archivo automáticamente cuando importes "@/components/BookingFlow"
// desde tu app móvil (porque termina en .native.tsx).

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";


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

// Datos fijos (UI solamente)
const SERVICES = [
  { id: 1, name: "Corte de pelo", duration_minutes: 30, price: 500 },
  { id: 2, name: "Recorte de barba", duration_minutes: 20, price: 250 },
  { id: 3, name: "Corte y barba", duration_minutes: 45, price: 600 },
  { id: 4, name: "Peinado", duration_minutes: 25, price: 200 },
  { id: 5, name: "Tinte", duration_minutes: 60, price: 650 },
] as const;

const BARBERS = [
  { id: 1, name: "Juan Pérez", rating: 4.8 },
  { id: 2, name: "Jhonny Bravo", rating: 4.9 },
  { id: 3, name: "Michael Benítez", rating: 4.6 },
  { id: 4, name: "Julio Damirón", rating: 4.7 },
] as const;

const TIME_SLOTS = [
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
] as const;

export default function BookingFlow({
  step,
  setStep,
  selectedServices,
  setSelectedServices,
  selectedBarber,
  setSelectedBarber,
  selectedDate,
  setSelectedDate,
  selectedTimeSlot,
  setSelectedTimeSlot,
  onClose,
  barbers: barbersProp,     
  loading,                  
}: {
  step: number;
  setStep: (step: number) => void;
  selectedServices: number[];
  setSelectedServices: (services: number[]) => void;
  selectedBarber: number | null;
  setSelectedBarber: (barber: number | null) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTimeSlot: string;
  setSelectedTimeSlot: (slot: string) => void;
  onClose: () => void;
  barbers?: { id: number; name: string; rating?: number }[]; 
  loading?: { barbers?: boolean };                            
})
{
  // Animaciones de entrada/salida (suaves)
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 260, mass: 0.6, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  // Derivados
  const selectedServiceDetails = useMemo(
    () => SERVICES.filter((s) => selectedServices.includes(s.id)),
    [selectedServices]
  );
  const totalMinutes = useMemo(
    () => selectedServiceDetails.reduce((acc, s) => acc + (s.duration_minutes || 0), 0),
    [selectedServiceDetails]
  );
  const totalPrice = useMemo(
    () => selectedServiceDetails.reduce((acc, s) => acc + (s.price || 0), 0),
    [selectedServiceDetails]
  );
  const chosenBarber = useMemo(() => BARBERS.find((b) => b.id === selectedBarber) || null, [selectedBarber]);

  // Acciones
  const toggleService = (serviceId: number) => {
    const next = selectedServices.includes(serviceId)
      ? selectedServices.filter((id) => id !== serviceId)
      : [...selectedServices, serviceId];
    setSelectedServices(next); // sin functional updater para que coincida con tu tipo
  };

  const canProceed =
    (step === 1 && selectedServices.length > 0) ||
    (step === 2 && selectedBarber !== null) ||
    (step === 3 && selectedDate && selectedTimeSlot) ||
    step === 4;

  const stepTitles = ["Selecciona los servicios", "Elige tu barbero", "Elige fecha y hora", "Resumen de la Reserva"];

  return (
    <Animated.View style={[styles.screen, { opacity, transform: [{ translateY }] }]}>      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agendar cita</Text>
        <Pressable onPress={onClose} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Cerrar">
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

        {/* Paso 1 */}
        {step === 1 && (
          <View style={{ gap: 12 }}>
            {SERVICES.map((s) => {
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
                  <Text style={styles.summaryValue}>{currencyDOP(totalPrice)}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Paso 2 SELECCIONAR BARBERO */}
        {step === 2 && (
          <View style={{ gap: 12 }}>
            {BARBERS.map((b) => {
              const selected = selectedBarber === b.id;
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
                      <Text style={{ color: COLORS.muted, fontWeight: "800" }}>
                        {b.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{b.name}</Text>
                      <Text style={styles.cardMeta}>★ {b.rating}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Paso 3 */}
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
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {TIME_SLOTS.map((slot) => {
                  const active = selectedTimeSlot === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => setSelectedTimeSlot(slot)}
                      style={({ pressed }) => [
                        styles.slot,
                        {
                          borderColor: active ? COLORS.brand : COLORS.border,
                          backgroundColor: active ? COLORS.brand : "#FFFFFF",
                          opacity: pressed ? 0.9 : 1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#FFFFFF" : COLORS.text }}>
                        {slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Paso 4 */}
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
                    <Text style={styles.cardMeta}>★ {chosenBarber.rating}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={{ gap: 6 }}>
              <Text style={styles.summaryRow}>📅 {selectedDate || "—"}</Text>
              <Text style={styles.summaryRow}>⏰ {selectedTimeSlot || "—"}</Text>
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
            else onClose(); // pantalla separada: cerrar vuelve atrás
          }}
          style={[styles.btn, !canProceed ? styles.btnDisabled : styles.btnPrimary]}
        >
          <Text style={[styles.btnText, { color: !canProceed ? "#6B7280" : "#fff" }]}>
            {step === 4 ? "Reservar Ahora" : "Siguiente"}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

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
