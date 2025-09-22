import { AuthContext } from "@/assets/src/context/AuthContext";
import { useAppointmentsByBarber } from "@/assets/src/features/appointment/useAppointmentsByBarber";
import { useAppointmentsByClient, type Appointment } from "@/assets/src/features/appointment/useAppointmentsByClient";
import { api } from "@/assets/src/lib/api";
import { AppointmentCard } from "@/components/AppointmentCard";
import Loader from "@/components/Loader";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";

// ⬇️ NUEVO: importa el sheet de reprogramar
import RescheduleAppointmentSheet from "@/components/RescheduleAppointmentSheet";

type Filter = "all" | "reservadas" | "en proceso" | "canceladas" | "completadas";

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
  reservado: "#F97316",
  confirmado: "#2563EB",
  completado: "#16A34A",
  danger: "#B91C1C",
};

// --- Helpers de normalización --- //
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

// Devuelve la categoría canónica que usan los tabs (en singular)
const statusKey = (
  raw: unknown
): "reservada" | "cancelada" | "completada" | "en proceso" | "" => {
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

  // 🔽 Estados para cancelar
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  // ✅ completar cita
const [confirmCompleteId, setConfirmCompleteId] = useState<number | null>(null);
const [completeLoading, setCompleteLoading] = useState(false);
const [successCompleteVisible, setSuccessCompleteVisible] = useState(false);

  // ⬇️ NUEVO: estado para reprogramar
  const [showReschedule, setShowReschedule] = useState(false);
  const [resel, setResel] = useState<null | {
    id: number | string;
    barberId: number | string;
    barberName: string;
    dateISO: string;
    start: string;
    end?: string;
    totalMinutes: number;
    totalPrice: number;
  }>(null);

  const clientQ = useAppointmentsByClient({ enabled: !isBarber });
  const barberQ = useAppointmentsByBarber({ enabled: isBarber });

  const data = (isBarber ? barberQ.data : clientQ.data) ?? [];
  const isLoading = isBarber ? barberQ.isLoading : clientQ.isLoading;
  const isFetching = isBarber ? barberQ.isFetching : clientQ.isFetching;
  const error = isBarber ? barberQ.error : clientQ.error;
  const refetch = isBarber ? barberQ.refetch : clientQ.refetch;

  const isRefreshing = !isLoading && isFetching;

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
    if ((error as any).response) {
      console.log("🔎 Error response data:", (error as any).response.data);
      console.log("🔎 Error response status:", (error as any).response.status);
    }
  }

  // Refetch al enfocar la pantalla (solo ANDROID)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return undefined; // no-op en iOS
      refetch();
      return () => { };
    }, [refetch, isBarber])
  );

  // Refetch al volver al foreground (solo ANDROID)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refetch();
      }
    });
    return () => sub.remove();
  }, [refetch]);

  const filtered = useMemo(() => {
    const list = (data ?? []) as Appointment[];
    const q = norm(query);

    return list.filter((a) => {
      const sk = statusKey(a.status);
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

  const renderItem = ({ item }: { item: Appointment }) => (
    <AppointmentCard
      appointment={item}
      onPressMore={() => {
        setActionId(item.id);     // ya lo tenías
        setActionItem(item);      // 👈 guarda la cita seleccionada
      }}
    />
  );

  // 🔽 Función de cancelación (PUT)
  async function cancelAppointment(appointmentId: number) {
    try {
      setCancelLoading(true);
      await api.put(`/appointments/${appointmentId}/status`, { status: 6 }); // 6 = Cancelado
      setConfirmId(null);
      setSuccessVisible(true);
      refetch(); // refresca la lista
      setTimeout(() => setSuccessVisible(false), 14000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo cancelar la cita.";
      Alert.alert("Error", msg);
    } finally {
      setCancelLoading(false);
    }
  }

  // ✅ Completar (PUT) — tatus: 7
async function completeAppointment(appointmentId: number) {
  try {
    setCompleteLoading(true);
    await api.put(`/appointments/${appointmentId}/status`, { status: 7 }); // 7 = Completada
    setConfirmCompleteId(null);
    setSuccessCompleteVisible(true);
    refetch(); // refresca la lista
    setTimeout(() => setSuccessCompleteVisible(false), 4000);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "No se pudo completar la cita.";
    Alert.alert("Error", msg);
  } finally {
    setCompleteLoading(false);
  }
}

  // ⬇️ NUEVO: lista de barberos derivada de las citas (si ya tienes hook propio, úsalo)
  const barbersList = useMemo(() => {
    const map = new Map<string, string>();
    (data as any[]).forEach((a) => {
      const id = String(a?.barber?.id ?? a?.barber_id ?? "");
      const name = a?.barber?.name ?? a?.barber_name ?? a?.barberName ?? "";
      if (id && name) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // ⬇️ NUEVO: wrappers a tu disponibilidad (ajusta si ya tienes hooks/servicios)
  async function getAvailableDays(barberId: number | string): Promise<string[]> {
    try {
      const res = await api.get(`/barbers/${barberId}/available-days`);
      return res.data?.data ?? res.data ?? [];
    } catch {
      return [];
    }
  }
  async function getAvailableSlots(barberId: number | string, dateISO: string): Promise<string[]> {
    try {
      const res = await api.get(`/barbers/${barberId}/available-slots`, { params: { date: dateISO } });
      return res.data?.data ?? res.data ?? [];
    } catch {
      return [];
    }
  }

  // ⬇️ NUEVO: abrir sheet con item seleccionado
  function openRescheduleFor(item: any) {
    const services = Array.isArray(item?.services) ? item.services : [];
    const totalMinutes = services.reduce((acc: number, s: any) => acc + (Number(s?.duration) || 0), 0);
    const totalPrice = services.reduce((acc: number, s: any) => acc + (Number(s?.price) || 0), 0);

    setResel({
      id: item?.id,
      barberId: item?.barber?.id ?? item?.barber_id,
      barberName: item?.barber?.name ?? item?.barber_name ?? item?.barberName ?? "",
      dateISO: item?.appointment_date ?? item?.dateISO ?? "",
      start: item?.start_time ?? item?.startISO ?? "",
      end: item?.end_time ?? item?.endISO ?? "",
      totalMinutes,
      totalPrice,
    });
    setShowReschedule(true);
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === "android" ? 8 : 0 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: COLORS.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View>{/*fffff*/}</View>

            {/* Agendar cita button */}
            <Pressable
              onPress={() => router.push("/booking/new")}
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
            { key: "reservadas" as const, label: "Reservadas" },
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
          // ✅ Pull-to-refresh (manual)
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
        />
      )}

      {/* Modal de acciones */}
      <Modal visible={actionId !== null} transparent animationType="fade" onRequestClose={() => setActionId(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} onPress={() => setActionId(null)} />

        <View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.text, marginBottom: 14 }}>
            Acciones:
          </Text>
          <View style={{ paddingBottom:5, gap: 12 }}>
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
                      client_id: String(a.client_id ?? a.clientId ?? a.client?.id ?? ""),

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

            {/* ⬇️ NUEVO: Reprogramar → abre sheet con la cita seleccionada */}
            <Pressable
              onPress={() => {
                if (actionId == null) return;
                const a: any =
                  actionItem ??
                  (Array.isArray(data) ? (data as Appointment[]).find(x => x.id === actionId) : null) ??
                  {};
                setActionId(null); // cerrar acciones
                requestAnimationFrame(() => {
                  openRescheduleFor(a); // abrir modal de reprogramar
                });
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
                /*if (actionId == null) return;
                const a: any =
                  actionItem ??
                  (Array.isArray(data) ? (data as Appointment[]).find(x => x.id === actionId) : null) ??
                  {};
                setActionId(null); // cerrar acciones
                requestAnimationFrame(() => {
                  openRescheduleFor(a); // abrir modal de reprogramar
                });*/
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 12,
                backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
              })}
            >
              <Text style={{ color: COLORS.confirmado, fontWeight: "700" }}>En proceso</Text>
            </Pressable>

             {/* 🔽 marcar completada */}
             <Pressable
              onPress={() => {
                if (actionId == null) return;
                setConfirmCompleteId(actionId); // abrir modal de confirmación
                setActionId(null);     // cerrar acciones
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 12,
                backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
              })}
            >
              <Text style={{ color: COLORS.completado  , fontWeight: "800" }}>Completar cita</Text>
            </Pressable>

            {/* 🔽 Cancelar → abre confirmación */}
            <Pressable
              onPress={() => {
                if (actionId == null) return;
                setConfirmId(actionId); // abrir modal de confirmación
                setActionId(null);      // cerrar acciones
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

      {/* Modal de confirmación de cancelación (centrado + icono de advertencia) */}
      <Modal
        visible={confirmId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmId(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              width: "100%",
              borderRadius: 16,
              padding: 18,
              alignItems: "center",
            }}
          >
            {/* Ícono de advertencia dentro de círculo rojo suave */}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#FEE2E2", // rojo suave
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Ionicons name="warning-outline" size={28} color={COLORS.danger} />
            </View>

            <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, textAlign: "center" }}>
              ¿Estás seguro que deseas cancelar la cita?
            </Text>

            <Text style={{ color: COLORS.textMuted, textAlign: "center", marginTop: 4 }}>
              Esta acción no se puede deshacer.
            </Text>

            {/* Botones centrados */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                justifyContent: "center",
                marginTop: 14,
                width: "100%",
              }}
            >
              <Pressable
                onPress={() => setConfirmId(null)}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  minWidth: 120,
                  alignItems: "center",
                  borderRadius: 12,
                  backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
                  borderWidth: 1,
                  borderColor: COLORS.border,
                })}
                disabled={cancelLoading}
              >
                <Text style={{ fontWeight: "700", color: COLORS.text }}>No</Text>
              </Pressable>

              <Pressable
                onPress={() => confirmId && cancelAppointment(confirmId)}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  minWidth: 120,
                  alignItems: "center",
                  borderRadius: 12,
                  backgroundColor: COLORS.danger,
                  opacity: pressed || cancelLoading ? 0.85 : 1,
                })}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontWeight: "800", color: "#fff" }}>Sí, cancelar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔽 Popup verde de éxito */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.25)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              width: "100%",
              borderRadius: 16,
              padding: 18,
              alignItems: "center",
              gap: 8,
              borderWidth: 2,
              borderColor: COLORS.completado,
            }}
          >
            <Text style={{ fontSize: 20 }}>✅</Text>
            <Text
              style={{ fontSize: 16, fontWeight: "800", color: COLORS.completado }}
            >
              Cita cancelada exitosamente
            </Text>
          </View>
        </View>
      </Modal>
      {/* Modal de confirmación de COMPLETAR */}
<Modal
  visible={confirmCompleteId !== null}
  transparent
  animationType="fade"
  onRequestClose={() => setConfirmCompleteId(null)}
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    }}
  >
    <View
      style={{
        backgroundColor: "#fff",
        width: "100%",
        borderRadius: 16,
        padding: 18,
        alignItems: "center",
      }}
    >
      {/* Ícono de ok dentro de círculo verde suave */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#DCFCE7", // verde suave
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Ionicons name="checkmark-done-outline" size={28} color={COLORS.completado} />
      </View>

      <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, textAlign: "center" }}>
        ¿Marcar esta cita como completada?
      </Text>

      <Text style={{ color: COLORS.textMuted, textAlign: "center", marginTop: 4 }}>
        Esta acción actualizará el estado de la cita a <Text style={{ fontWeight: "700" }}>Completada</Text>.
      </Text>

      <View
        style={{
          flexDirection: "row",
          gap: 12,
          justifyContent: "center",
          marginTop: 14,
          width: "100%",
        }}
      >
        <Pressable
          onPress={() => setConfirmCompleteId(null)}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 20,
            minWidth: 120,
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: pressed ? "#F3F4F6" : "#F9FAFB",
            borderWidth: 1,
            borderColor: COLORS.border,
          })}
          disabled={completeLoading}
        >
          <Text style={{ fontWeight: "700", color: COLORS.text }}>No</Text>
        </Pressable>

        <Pressable
          onPress={() => confirmCompleteId && completeAppointment(confirmCompleteId)}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 20,
            minWidth: 120,
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: COLORS.completado,
            opacity: pressed || completeLoading ? 0.85 : 1,
          })}
          disabled={completeLoading}
        >
          {completeLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontWeight: "800", color: "#fff" }}>Sí, completar</Text>
          )}
        </Pressable>
      </View>
    </View>
  </View>
</Modal>

{/* ✅ Popup verde de éxito (completada) */}
<Modal
  visible={successCompleteVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setSuccessCompleteVisible(false)}
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.25)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    }}
  >
    <View
      style={{
        backgroundColor: "#fff",
        width: "100%",
        borderRadius: 16,
        padding: 18,
        alignItems: "center",
        gap: 8,
        borderWidth: 2,
        borderColor: COLORS.completado,
      }}
    >
      <Text style={{ fontSize: 20 }}>✅</Text>
      <Text
        style={{ fontSize: 16, fontWeight: "800", color: COLORS.completado }}
      >
        Cita marcada como completada
      </Text>
    </View>
  </View>
</Modal>


      {/* ⬇️ Modal de reprogramar */}
      {resel && (
        <RescheduleAppointmentSheet
          visible={showReschedule}
          onClose={() => setShowReschedule(false)}
          onConfirmed={(_payload) => {
            setShowReschedule(false);
            refetch(); // refresca la lista
          }}
          appointmentId={resel.id}
          currentBarberId={resel.barberId}
          currentBarberName={resel.barberName}
          currentDateISO={resel.dateISO}
          currentStartTime={resel.start}
          currentEndTime={resel.end}
          services={{ totalMinutes: resel.totalMinutes, totalPrice: resel.totalPrice }}
          barbers={barbersList.length ? barbersList : [{ id: resel.barberId, name: resel.barberName }]}
        />
      )}

    </View>
  );
}
