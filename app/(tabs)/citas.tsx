import { useAppointments, type Appointment } from "@/assets/src/features/appointment/useAppointments";
import { AppointmentCard } from "@/components/AppointmentCard";
import Loader from "@/components/Loader";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View
} from "react-native";
type Filter = "all" | "reservadas" | "confirmadas" | "completadas";

const COLORS = {
  bg: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  chipActiveBg: "#111827",
  chipInactiveBg: "#FFFFFF",
  chipInactiveBorder: "#E5E7EB",
  brand: "#111827",
  // estados
  reservado: "#F97316",   // naranja 500
  confirmado: "#2563EB",  // azul 600
  completado: "#16A34A",  // verde 600
  danger: "#B91C1C",
};

// --- Helpers de normalización --- //
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

// Devuelve la categoría canónica que usan los tabs (en singular)
const statusKey = (
  raw: unknown
): "reservada" | "confirmada" | "completada" | "" => {
  const s = norm(raw);

  // sinónimos / variantes comunes
  if (["reservada", "reservado", "reserved", "reserva", "pendiente", "pending", "booked"].includes(s)) {
    return "reservada";
  }
  if (["confirmada", "confirmado", "confirmed"].includes(s)) {
    return "confirmada";
  }
  if (["completada", "completado", "completed", "finalizada", "finalizado", "done"].includes(s)) {
    return "completada";
  }
  return s as any; // "" u otro valor desconocido
};

export default function CitasScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);


  const { data, isLoading, isFetching, refetch } = useAppointments();
  const isRefreshing = !isLoading && isFetching;



  const filtered = useMemo(() => {
    const list = (data ?? []) as Appointment[];
    const q = norm(query);

    return list.filter((a) => {
      const sk = statusKey(a.status); // ← normalizado a "reservada" | "confirmada" | "completada"

      const byStatus =
        filter === "all" ||
        (filter === "reservadas" && sk === "reservada") ||
        (filter === "confirmadas" && sk === "confirmada") ||
        (filter === "completadas" && sk === "completada");

      const byQuery =
        !q ||
        norm(a.barberName).includes(q) ||
        norm(a.clientName).includes(q) ||
        norm(a.serviceSummary).includes(q);

      return byStatus && byQuery;
    });
  }, [data, filter, query]);

  const renderItem = ({ item }: { item: Appointment }) => (
    <AppointmentCard appointment={item} onPressMore={() => setActionId(item.id)} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === "android" ? 8 : 0 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: COLORS.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View>{/* espacio para notificaciones si lo necesitas */}</View>

            {/* Agendar cita button */}
            <Pressable
              onPress={() => router.push("/booking/new")}   // 👈 solo este cambio
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: COLORS.brand,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Título de sección */}
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text, marginTop: 16 }}>Citas</Text>
      </View>

      {/* Search & Tabs */}
      <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 4 }}>
        {/* Buscador simple */}
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <TextInput
            placeholder="Buscar por barbero, servicio o cliente"
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9CA3AF"
            style={{ color: COLORS.text }}
          />
        </View>

        {/* Chips de filtro: Todas | Reservadas | Confirmadas | Completadas */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {[
            { key: "all" as const, label: "Todas" },
            { key: "reservadas" as const, label: "Reservadas" },   // ← claves en PLURAL para que coincidan con Filter
            { key: "confirmadas" as const, label: "Confirmadas" },
            { key: "completadas" as const, label: "Completadas" },
          ].map((opt) => {
            const active = filter === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setFilter(opt.key)}
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: active ? COLORS.chipActiveBg : COLORS.chipInactiveBorder,
                  backgroundColor: active ? COLORS.chipActiveBg : COLORS.chipInactiveBg,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    color: active ? "#FFFFFF" : COLORS.text,
                    fontWeight: "700",
                    fontSize: 14,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Lista */}
      {isLoading ? (

          <Loader text="Cargando citas..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ color: COLORS.textMuted }}>No hay citas para mostrar.</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
        />
      )}

      {/* Modal de acciones (kebab) */}
      <Modal visible={actionId !== null} transparent animationType="fade" onRequestClose={() => setActionId(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} onPress={() => setActionId(null)} />
        <View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 12 }}>Acciones</Text>
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => {
                /* TODO: navegar a detalle */ setActionId(null);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 12,
                backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
              })}
            >
              <Text style={{ color: COLORS.text, fontWeight: "700" }}>Ver detalle</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                /* TODO: reprogramar */ setActionId(null);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 12,
                backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
              })}
            >
              <Text style={{ color: COLORS.text, fontWeight: "700" }}>Reprogramar</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                /* TODO: cancelar */ setActionId(null);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 12,
                backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
              })}
            >
              <Text style={{ color: COLORS.danger, fontWeight: "800" }}>Cancelar cita</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

     
    </View>
  );





}
