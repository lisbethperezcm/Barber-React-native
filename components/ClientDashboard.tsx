import { AuthContext } from "@/assets/src/context/AuthContext";
import api from "@/assets/src/lib/http";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, AppState, Pressable, ScrollView, Text, View } from "react-native";

/** Utils muy pequeños para formateo y cálculos sin librerías extra */
function formatDateISOToLong(dateISO?: string) {
  if (!dateISO) return "";
  const date = new Date(dateISO + "T00:00:00");
  return date.toLocaleDateString("es-DO", { weekday: "long", day: "2-digit", month: "long" });
}
function formatTimeTo12h(time?: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
}
function minutesBetween(start?: string, end?: string) {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const diff = Math.max(0, endMin - startMin);
  return `${diff} min`;
}
function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return `${(parts[0][0] || "").toUpperCase()}${(parts[1][0] || "").toUpperCase()}` || "?";
}

type NextAppointment = {
  id: number;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:mm:ss"
  end_time: string;   // "HH:mm:ss"
  barber: string;
  services: string[];
  status: string;
  total: number;
};

type CareTip = {
  id: number;
  service_id: number;
  service_name: string;
  name: string;
  description: string;
};

export default function ClientDashboard({ styles }: { styles: any }) {
  const router = useRouter();
  const { userName } = useContext(AuthContext) as { userName?: string };

  const userFirstName = useMemo(
    () => ((userName ?? "").trim().split(/\s+/)[0]) || "",
    [userName]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  const [careTips, setCareTips] = useState<CareTip[]>([]);

  // ✅ Función reutilizable para cargar datos (se usa en focus + foreground + primer render)
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Obtener clientId desde SecureStore.
      const raw = await SecureStore.getItemAsync("client");
      if (!raw) {
        throw new Error("No se encontró el cliente en el dispositivo.");
      }

      // Puede venir como JSON { id: number, ... } o como string con el id.
      let clientId: string | number | undefined;
      try {
        const parsed = JSON.parse(raw);
        clientId = parsed?.id ?? parsed?.client_id ?? parsed; // fallback si guardaste el objeto completo
      } catch {
        clientId = raw; // si era un string simple
      }

      if (clientId === undefined || clientId === null || `${clientId}`.trim() === "") {
        throw new Error("clientId inválido o vacío.");
      }

      // 2) Llamar a tu endpoint (usa tu instancia axios `api`).
      const res = await api.get(`/reports/client-summary/${clientId}`);

      // 3) Normalizar payload (a veces viene en `original`, otras en `data`).
      const payload =
        res?.data?.original ??
        res?.data?.data ??
        res?.data ??
        {};

      const appointment = payload?.next_appointment ?? null;
      const tips = Array.isArray(payload?.care_tips) ? payload.care_tips : [];

      setNextAppointment(appointment);
      setCareTips(tips);
    } catch (e: any) {
      setError(e?.message || "Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ▶️ Primer render
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // 🔄 Refetch al enfocar la pantalla (multiplataforma)
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      return () => {};
    }, [loadDashboard])
  );

  // 🔄 Refetch al volver del background (multiplataforma)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadDashboard();
      }
    });
    return () => sub.remove();
  }, [loadDashboard]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Saludo */}
      <View style={styles.helloRow}>
        <View style={styles.avatar}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{getInitials(userFirstName || "Cliente")}</Text>
        </View>
        <View>
          <Text style={styles.hello}>Hola, {userFirstName} 👋</Text>
          <Text style={styles.sub}>¿Listo para tu próximo corte?</Text>
        </View>
      </View>

      {/* CTA principal */}
      <Pressable style={styles.cta} onPress={() => router.push("/(tabs)/booking/new")}>
        <Text style={styles.ctaText}>Reservar Cita</Text>
      </Pressable>

      {/* Estados de carga/error */}
      {loading && (
        <View style={[styles.card, { alignItems: "center", justifyContent: "center", paddingVertical: 24 }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Cargando tu información…</Text>
        </View>
      )}
      {error && !loading && (
        <View style={[styles.card, { paddingVertical: 16 }]}>
          <Text style={styles.cardTitle}>Próxima Cita</Text>
          <Text style={{ color: "#B00020", marginTop: 4 }}>{error}</Text>
        </View>
      )}

      {/* Próxima cita (dinámica) */}
      {!loading && !error && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Próxima Cita</Text>
          </View>

          {nextAppointment ? (
            <View style={styles.apptRow}>
              <View style={styles.circleAvatar}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{getInitials(nextAppointment.barber)}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.apptName}>{nextAppointment.barber}</Text>
                <Text style={styles.apptMeta}>
                  {formatDateISOToLong(nextAppointment.date)}, {formatTimeTo12h(nextAppointment.start_time)} – {formatTimeTo12h(nextAppointment.end_time)}
                </Text>
                <Text style={styles.apptMuted}>
                  {Array.isArray(nextAppointment.services) ? nextAppointment.services.join(", ") : ""}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.apptAmount}>RD$ {Number(nextAppointment.total || 0).toLocaleString("es-DO")}</Text>
                <Text style={styles.apptMuted}>{minutesBetween(nextAppointment.start_time, nextAppointment.end_time)}</Text>
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 8 }}>
              <Text style={styles.apptMuted}>No tienes citas próximas.</Text>
            </View>
          )}
        </View>
      )}

      {/* Acceso Rápido */}
      <Text style={styles.sectionTitle}>Acceso Rápido</Text>
      <View style={styles.quickRow}>
        <Pressable style={styles.quickItem} onPress={() => router.push("/(tabs)/servicios")}>
          <Text style={{ fontSize: 22 }}>✂️</Text>
          <Text style={styles.quickText}>Servicios</Text>
        </Pressable>
      </View>

      {/* Recomendaciones (dinámicas) */}
      <Text style={styles.sectionTitle}>Recomendaciones para Ti</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {careTips?.length ? (
          careTips.map((tip) => (
            <View key={tip.id} style={styles.banner}>
              <View style={styles.bannerIcon}>
                <Text style={{ color: "#fff" }}>💡</Text>
              </View>
              <Text style={styles.bannerTitle}>
                {tip.service_name ? `${tip.service_name}: ` : ""}{tip.name}
              </Text>
              <Text style={styles.bannerText}>{tip.description}</Text>
            </View>
          ))
        ) : (
          <View style={styles.banner}>
            <View style={styles.bannerIcon}><Text style={{ color: "#fff" }}>💬</Text></View>
            <Text style={styles.bannerTitle}>Agenda tu cita YA!</Text>
            <Text style={styles.bannerText}>Te invitamos a agendar tu próxima cita con tu barbero de preferencia.</Text>
          </View>
        )}
      </ScrollView>
    </ScrollView>
  );
}
