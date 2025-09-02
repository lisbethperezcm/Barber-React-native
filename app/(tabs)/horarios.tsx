import { useBarberSchedules } from "@/assets/src/features/barber/useBarberSchedule";
import { api } from "@/assets/src/lib/api";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
} from "react-native";

const COLORS = {
  bg: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  card: "#F9FAFC",
  overlay: "rgba(0,0,0,0.4)",
  white: "#FFFFFF",
  red: "#DC2626",
  redDark: "#991B1B",
  redSoft: "#FEE2E2",
  redSoftBorder: "#FCA5A5",
  green: "#16A34A",
  greenSoft: "#DCFCE7",
  gray: "#9CA3AF",
  graySoft: "#F3F4F6",
};

type Row = {
  id: number;
  statusId: number;   // 1 activo, 2 inactivo
  dayName: string;
  startTime: string;
  endTime: string;
};

export default function HorariosScreen() {
  const { data = [], isLoading, refetch } = useBarberSchedules() as {
    data: Row[];
    isLoading: boolean;
    refetch: () => Promise<any>;
  };

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [dayToToggle, setDayToToggle] = useState<number | null>(null);

  // Loader por fila
  const [rowLoading, setRowLoading] = useState<number | null>(null);

  // UI optimista por fila (id -> active?)
  const [optimistic, setOptimistic] = useState<Record<number, boolean>>({});

  // Popup de error
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const rows: Row[] = useMemo(() => data ?? [], [data]);

  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const toggleDay = async (id: number, nextActive?: boolean) => {
    const MIN_SPINNER_MS = 350;

    setRowLoading(id);
    if (typeof nextActive === "boolean") {
      // UI optimista inmediata
      setOptimistic((prev) => ({ ...prev, [id]: nextActive }));
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    try {
      const started = Date.now();
      const { data, status } = await api.post(`/schedules/toggle-status`, { id });

      if (status === 200) {
        console.log("[toggleDay][success]:", data);
        await refetch(); // Trae estado real del server
      }

      const elapsed = Date.now() - started;
      if (elapsed < MIN_SPINNER_MS) await wait(MIN_SPINNER_MS - elapsed);
    } catch (e) {
      // Revertir optimista si falla
      setOptimistic((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });

      let msg = "No se pudo actualizar el estado del día.";
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as any)?.message || msg;
      }
      //console.error("[toggleDay][error]:", msg);

      // 👉 Mostrar popup rojo claro con el mensaje
      setErrorMsg(msg);
      setErrorVisible(true);
    } finally {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setRowLoading(null);
      // Limpia override optimista (si refetch ya sincronizó, no hace falta mantenerlo)
      setOptimistic((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });
    }
  };

  const handleTogglePress = (row: Row, active: boolean) => {
    if (active) {
      // activo → inactivo requiere confirmación
      setDayToToggle(row.id);
      setConfirmVisible(true);
    } else {
      // inactivo → activo: optimista inmediato
      toggleDay(row.id, true);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Horarios de Trabajo</Text>

        {isLoading ? (
          <Text style={{ color: COLORS.muted }}>Cargando horarios...</Text>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <View style={styles.card}>
              {rows.map((row) => {
                const serverActive = row.statusId === 1;
                const active = optimistic[row.id] ?? serverActive;
                const isRowLoading = rowLoading === row.id;
                const hours = active ? `${row.startTime} - ${row.endTime}` : "Cerrado";

                return (
                  <View
                    key={row.id}
                    style={[styles.row, isRowLoading && { opacity: 0.7 }]}
                    pointerEvents={isRowLoading ? "none" : "auto"}
                  >
                    {/* IZQUIERDA */}
                    <View style={styles.left}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: active ? COLORS.green : COLORS.gray },
                        ]}
                      />
                      <View style={styles.nameAndHours}>
                        <Text style={styles.day} numberOfLines={1} ellipsizeMode="tail">
                          {row.dayName}
                        </Text>
                        <Text
                          style={[
                            styles.hoursInline,
                            { color: active ? COLORS.text : COLORS.muted },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {hours}
                        </Text>
                      </View>
                    </View>

                    {/* DERECHA */}
                    <View style={styles.right}>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: active ? COLORS.greenSoft : COLORS.graySoft,
                            borderColor: active ? COLORS.green : COLORS.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? COLORS.green : COLORS.muted,
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                          numberOfLines={1}
                        >
                          {active ? "activo" : "inactivo"}
                        </Text>
                      </View>

                      {isRowLoading ? (
                        <View style={styles.loaderBox}>
                          <ActivityIndicator />
                        </View>
                      ) : (
                        <Switch
                          value={active}
                          onValueChange={() => handleTogglePress(row, active)}
                          disabled={isRowLoading}
                          trackColor={{ false: "#D1D5DB", true: "#111827" }}
                          thumbColor="#FFFFFF"
                          ios_backgroundColor="#D1D5DB"
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Modal confirmación (activo → inactivo) */}
      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Confirmar desactivación</Text>
            <Text style={styles.dialogText}>
              ¿Estás seguro que deseas desactivar este día? No podrás recibir citas en este día.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                style={styles.outlineBtn}
                onPress={() => {
                  setConfirmVisible(false);
                  setDayToToggle(null);
                }}
              >
                <Text style={styles.outlineBtnText}>No</Text>
              </Pressable>
              <Pressable
                style={styles.dangerBtn}
                onPress={async () => {
                  if (dayToToggle !== null) {
                    await toggleDay(dayToToggle, false);
                  }
                  setConfirmVisible(false);
                  setDayToToggle(null);
                }}
              >
                <Text style={styles.dangerBtnText}>Sí</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔴 Popup de error rojo claro con botón OK */}
      <Modal
        transparent
        visible={errorVisible}
        animationType="fade"
        onRequestClose={() => setErrorVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Text style={styles.errorTitle}>No se pudo realizar la acción</Text>
            </View>
            <Text style={styles.errorMsg}>
              {errorMsg ??
                "Ha ocurrido un error al actualizar el estado del horario. Intenta de nuevo."}
            </Text>

            <Pressable
              style={styles.errorOkBtn}
              onPress={() => {
                setErrorVisible(false);
                setErrorMsg(null);
              }}
            >
              <Text style={styles.errorOkText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text, marginBottom: 25 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 50 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    minHeight: 86,
  },

  left: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 999, marginTop: 6, marginRight: 10 },

  nameAndHours: { flexShrink: 1 },
  day: { fontSize: 17, fontWeight: "600", color: COLORS.text },

  hoursInline: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "500",
    fontVariant: Platform.OS === "ios" ? ["tabular-nums"] : undefined,
  },

  right: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderBox: {
    width: 52,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  dialog: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
  },
  dialogTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  dialogText: { fontSize: 14, color: COLORS.muted, lineHeight: 20 },
  dialogActions: {
    flexDirection: "row",
    marginTop: 18,
    gap: 12,
    ...(Platform.OS === "android" ? { justifyContent: "space-between" } : {}),
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  outlineBtnText: { color: COLORS.text, fontWeight: "700" },
  dangerBtn: {
    flex: 1,
    backgroundColor: COLORS.red,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerBtnText: { color: COLORS.white, fontWeight: "800" },

  // 🔴 Estilos del popup de error
  errorCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.redSoft,
    borderColor: COLORS.redSoftBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  errorHeader: {
    marginBottom: 8,
  },
  errorTitle: {
    color: COLORS.redDark,
    fontWeight: "800",
    fontSize: 16,
    alignSelf: "center",
  },
  errorMsg: {
    color: COLORS.redDark,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    textAlign:"center"
  },
  errorOkBtn: {
    alignSelf: "center",
    backgroundColor: COLORS.red,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorOkText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
  },
});
