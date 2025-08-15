import { Appointment } from "@/assets/src/features/appointment/useAppointments";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

const COLORS = {
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  reserved: "#F97316",   // naranja
  confirmed: "#2563EB",  // azul
  completed: "#16A34A",  // verde
};

function statusColors(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "reservado") return { bg: "#FFF7ED", text: "#F97316", line: COLORS.reserved };      // bg naranja muy claro
  if (s === "confirmado") return { bg: "#EFF6FF", text: "#2563EB", line: COLORS.confirmed };    // bg azul muy claro
  if (s === "completado") return { bg: "#ECFDF5", text: "#16A34A", line: COLORS.completed };    // bg verde muy claro
  return { bg: "#F3F4F6", text: "#6B7280", line: "#9CA3AF" };
}

function formatDateShort(iso: string) {
  try {
    const d = new Date(iso);
    // 15 Mar 2025
    return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })
      .replace(".", ""); // algunos locales ponen punto en el mes
  } catch {
    return iso;
  }
}

function formatTime12(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return iso;
  }
}

function currencyDOP(amount: number) {
  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} DOP`;
  }
}

export const AppointmentCard = ({
  appointment,
  onPress,
  onPressMore,
}: {
  appointment: Appointment;
  onPress?: () => void;
  onPressMore?: () => void;
}) => {
  const palette = useMemo(() => statusColors(appointment.status), [appointment.status]);
  const dateText = formatDateShort(appointment.dateISO);
  const startText = formatTime12(appointment.startISO);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 14,
        opacity: pressed ? 0.98 : 1,
        // línea de estado a la izquierda
        borderLeftWidth: 4,
        borderLeftColor: palette.line,
      })}
    >
      {/* Título + estado + kebab */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>
            {appointment.serviceSummary || "Servicios"}
          </Text>
        </View>

        {/* badge de estado */}
        <View
          style={{
            backgroundColor: palette.bg,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            marginRight: 6,
          }}
        >
          <Text style={{ fontWeight: "800", color: palette.text, textTransform: "lowercase" }}>
            {appointment.status}
          </Text>
        </View>

        {/* kebab */}
        <Pressable onPress={onPressMore} hitSlop={10} style={{ padding: 2 }}>
          <Ionicons name="ellipsis-vertical" size={18} color={COLORS.text} />
        </Pressable>
      </View>

      {/* fecha/hora */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.text} />
        <Text style={{ color: COLORS.text }}>
          {dateText} - {startText}
        </Text>
      </View>

      {/* barber */}
      <Text style={{ color: COLORS.textMuted, marginTop: 4 }}>
        Con {appointment.barberName}
      </Text>

      {/* total */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <Text style={{ color: COLORS.textMuted, fontWeight: "700" }}>Total</Text>
        <Text style={{ color: COLORS.text, fontWeight: "800" }}>
          {currencyDOP(appointment.totalAmount)}
        </Text>
      </View>
    </Pressable>
  );
};
