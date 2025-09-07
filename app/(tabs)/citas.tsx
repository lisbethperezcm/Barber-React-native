import { AuthContext } from "@/assets/src/context/AuthContext";
import { useAppointmentsByBarber } from "@/assets/src/features/appointment/useAppointmentsByBarber";
import { useAppointmentsByClient, type Appointment } from "@/assets/src/features/appointment/useAppointmentsByClient";
import { AppointmentCard } from "@/components/AppointmentCard";
import Loader from "@/components/Loader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
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

type Filter = "all" | "reservadas" |"en proceso" | "canceladas" | "completadas";

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
): "reservada" | "cancelada" | "completada" |"en proceso" | "" => {
  const s = norm(raw);

  // sinónimos / variantes comunes
  if (["reservada", "reservado", "reserved", "reserva", "pendiente", "pending", "booked"].includes(s)) {
    return "reservada";
  }
  if (["cancelada", "cancelado", "cancelled"].includes(s)) {
    return "cancelada";
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
  const { isBarber, role, loading } = useContext(AuthContext);
  const [actionItem, setActionItem] = React.useState<any | null>(null);


  const clientQ = useAppointmentsByClient({ enabled: !isBarber });
  const barberQ = useAppointmentsByBarber({ enabled: isBarber });

  const data = (isBarber ? barberQ.data : clientQ.data) ?? [];
  const isLoading = isBarber ? barberQ.isLoading : clientQ.isLoading;
  const isFetching = isBarber ? barberQ.isFetching : clientQ.isFetching;
  const error = isBarber ? barberQ.error : clientQ.error;
  const refetch = isBarber ? barberQ.refetch : clientQ.refetch;

  const isRefreshing = !isLoading && isFetching;

  console.log(data)
  // Navegar al detalle desde el modal
  const handleViewDetail = () => {
    if (actionId == null) return;
    const id = String(actionId);
    setActionId(null); // cerrar modal primero
    requestAnimationFrame(() => {
      // OJO: el path navegable NO incluye el route group (tabs)
      router.push({ pathname: "/appointments/[id]", params: { id } });
      // Alternativa: router.push(`/citas/${id}`);
    });
  };

  if (error) {
    console.log("❌ Error useAppointments:", error);
    // si es axios error, puedes inspeccionar la respuesta
    if ((error as any).response) {
      console.log("🔎 Error response data:", (error as any).response.data);
      console.log("🔎 Error response status:", (error as any).response.status);
    }
  }


  const filtered = useMemo(() => {
    const list = (data ?? []) as Appointment[];
    const q = norm(query);

    return list.filter((a) => {
      const sk = statusKey(a.status); // ← normalizado a "reservada" | "cancelada" | "completada"

      const byStatus =
        filter === "all" ||
        (filter === "reservadas" && sk === "reservada") ||
        (filter === "canceladas" && sk === "cancelada") ||
        (filter === "en proceso" && sk === "en proceso") ||
        (filter === "completadas" && sk === "completada");

      const byQuery =
        !q ||
        norm(a.barberName).includes(q) ||
        norm(a.clientName).includes(q) ||
        norm(a.serviceSummary).includes(q);

      return byStatus && byQuery;
    });
  }, [data, filter, query]);

  /*const renderItem = ({ item }: { item: Appointment }) => (
    <AppointmentCard appointment={item} onPressMore={() => setActionId(item.id)} />
  );*/
  const renderItem = ({ item }: { item: Appointment }) => (
    <AppointmentCard
      appointment={item}
      onPressMore={() => {
        setActionId(item.id);     // ya lo tenías
        setActionItem(item);      // 👈 guarda la cita seleccionada
      }}
    />
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

        {/* Chips de filtro: Todas | Reservadas | canceladas | Completadas */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {[
            { key: "all" as const, label: "Todas" },
            { key: "reservadas" as const, label: "Reservadas" },   // ← claves en PLURAL para que coincidan con Filter
            { key: "canceladas" as const, label: "Canceladas" },
            { key: "completadas" as const, label: "Completadas" },
            { key: "en proceso" as const, label: "En proceso" },
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
      <Modal
        visible={actionId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionId(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
          onPress={() => setActionId(null)}
        />
        <View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 12 }}>
            Acciones
          </Text>
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => {
                if (actionId == null) return;

                // usa el item guardado; si por algo no está, lo buscamos en 'data'
                const a: any =
                  actionItem ??
                  (Array.isArray(data) ? (data as Appointment[]).find(x => x.id === actionId) : null) ??
                  {};

                setActionId(null); // cierra el modal primero

                requestAnimationFrame(() => {
                  router.push({
                    pathname: "/appointments/[id]",
                    params: {
                      id: String(a.id ?? actionId),

                      // 👇 mapeo 1:1 hacia los nombres que consume la vista de detalle
                      client_name: a.client_name ?? a.clientName ?? "",
                      barber_name: a.barber_name ?? a.barberName ?? "",
                      appointment_date: a.appointment_date ?? a.dateISO ?? "",

                      // horas ISO (la vista las formatea)
                      start_time: a.start_time ?? a.startISO ?? "",
                      end_time: a.end_time ?? a.endISO ?? "",

                      status: a.status ?? "",

                      // servicios como JSON string [{ name, price, duration }]
                      services: JSON.stringify(
                        (a.services ?? []).map((s: any) => ({
                          name: s.name,
                          price: Number(s.price) || 0,
                          duration: Number(s.duration) || 0,
                        }))
                      ),
                    },
                  });
                });
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
              onPress={() => { /* TODO: reprogramar */ setActionId(null); }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 12,
                backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
              })}
            >
              <Text style={{ color: COLORS.text, fontWeight: "700" }}>Reprogramar</Text>
            </Pressable>

            <Pressable
              onPress={() => { /* TODO: cancelar */ setActionId(null); }}
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
