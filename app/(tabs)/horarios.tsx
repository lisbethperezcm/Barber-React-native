import { useBarberSchedules } from "@/assets/src/features/barber/useBarberSchedule";
import { api } from "@/assets/src/lib/api";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
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
  statusId: number; // 1 activo, 2 inactivo
  dayName: string;
  startTime: string;
  endTime: string;
};

type LunchDTO = {
  lunch_start?: string | null;
  lunch_end?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

function pickLunchTimes(src?: LunchDTO | null) {
  if (!src) return { start: null as string | null, end: null as string | null };
  const start =
    src.lunch_start ?? src.start_time ?? src.startTime ?? null;
  const end =
    src.lunch_end ?? src.end_time ?? src.endTime ?? null;
  return { start, end };
}

function formatTime12(hms: string): string {
  if (!hms) return "";
  const [hStr, mStr] = hms.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hms;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function HorariosScreen() {
  const { data = [], isLoading, refetch } = useBarberSchedules() as {
    data: Row[];
    isLoading: boolean;
    refetch: () => Promise<any>;
  };

  // Lunch state
  const [lunchLoading, setLunchLoading] = useState<boolean>(true);
  const [lunchRaw, setLunchRaw] = useState<LunchDTO | null>(null);
  const [lunchError, setLunchError] = useState<string | null>(null);
  const lunch = useMemo(() => pickLunchTimes(lunchRaw), [lunchRaw]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const barber = await SecureStore.getItemAsync("barber");
        setLunchLoading(true);
        const { data } = await api.get(`/barbers/lunch_time/${barber}`);
        const payload = (data?.data ?? data) as LunchDTO | null;
        if (mounted) setLunchRaw(payload);
      } catch (e) {
        if (mounted) setLunchError("No se pudo cargar el horario de comida.");
      } finally {
        if (mounted) setLunchLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // UI states
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [dayToToggle, setDayToToggle] = useState<number | null>(null);
  const [rowLoading, setRowLoading] = useState<number | null>(null);
  const [optimistic, setOptimistic] = useState<Record<number, boolean>>({});
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
      setOptimistic((prev) => ({ ...prev, [id]: nextActive }));
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    try {
      const started = Date.now();
      const { data, status } = await api.post(`/schedules/toggle-status`, { id });
      if (status === 200) {
        await refetch();
      }
      const elapsed = Date.now() - started;
      if (elapsed < MIN_SPINNER_MS) await wait(MIN_SPINNER_MS - elapsed);
    } catch (e) {
      setOptimistic((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });
      let msg = "No se pudo actualizar el estado del día.";
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as any)?.message || msg;
      }
      setErrorMsg(msg);
      setErrorVisible(true);
    } finally {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setRowLoading(null);
      setOptimistic((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });
    }
  };

  const handleTogglePress = (row: Row, active: boolean) => {
    if (active) {
      setDayToToggle(row.id);
      setConfirmVisible(true);
    } else {
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
            {/* Horario de comida */}
            <View style={styles.cardWeb}>
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={[styles.dot, { backgroundColor: COLORS.gray }]} />
                  <View>
                    <Text style={styles.cardTitle}>Horario de comida</Text>
                    {lunchLoading ? (
                      <Text style={styles.subtleText}>Cargando...</Text>
                    ) : lunchError ? (
                      <Text style={styles.errorInline}>{lunchError}</Text>
                    ) : !lunch.start || !lunch.end ? (
                      <Text style={styles.subtleText}>No está asignado</Text>
                    ) : (
                      <Text style={styles.cardHours}>
                        {formatTime12(lunch.start!)} - {formatTime12(lunch.end!)}
                      </Text>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.pill,
                    lunch.start && lunch.end ? styles.pillSuccess : styles.pillMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      lunch.start && lunch.end ? styles.pillTextSuccess : styles.pillTextMuted,
                    ]}
                  >
                    {lunch.start && lunch.end ? "asignado" : "sin asignar"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Lista de días */}
            {rows.map((row) => {
              const serverActive = row.statusId === 1;
              const active = optimistic[row.id] ?? serverActive;
              const isRowLoading = rowLoading === row.id;

              return (
                <View
                  key={row.id}
                  style={[styles.cardWeb, { paddingVertical: 18 }]}
                  pointerEvents={isRowLoading ? "none" : "auto"}
                >
                  <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: active ? COLORS.green : COLORS.gray },
                        ]}
                      />
                      <View>
                        <Text style={styles.cardTitle}>{row.dayName}</Text>
                        <Text
                          style={[
                            styles.cardHours,
                            { color: active ? COLORS.text : COLORS.muted },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {active
                            ? `${formatTime12(row.startTime)} - ${formatTime12(row.endTime)}`
                            : "Cerrado"}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={[
                          styles.pill,
                          active ? styles.pillSuccess : styles.pillMuted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            active ? styles.pillTextSuccess : styles.pillTextMuted,
                          ]}
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
                          trackColor={{ false: "#0B1220", true: "#0B1220" }}
                          thumbColor="#FFFFFF"
                          ios_backgroundColor="#0B1220"
                          style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Confirm modal */}
      <Modal transparent visible={confirmVisible} animationType="fade">
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

      {/* Error popup */}
      <Modal transparent visible={errorVisible} animationType="fade">
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
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text, marginBottom: 20 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 112 },

  cardWeb: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginBottom: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },

  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  cardHours: { marginTop: 4, fontSize: 15, fontWeight: "450", color: COLORS.text },
  subtleText: { color: COLORS.muted, fontSize: 14 },
  errorInline: { color: COLORS.redDark, fontSize: 14, fontWeight: "600" },

  dot: { width: 12, height: 12, borderRadius: 999 },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSuccess: { backgroundColor: COLORS.greenSoft, borderColor: "#B7F0C0" },
  pillMuted: { backgroundColor: COLORS.graySoft, borderColor: "#E5E7EB" },
  pillText: { fontWeight: "800", fontSize: 12 },
  pillTextSuccess: { color: COLORS.green },
  pillTextMuted: { color: COLORS.muted },

  loaderBox: {
    width: 52,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  // Dialog
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

  // Error popup
  errorCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.redSoft,
    borderColor: COLORS.redSoftBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  errorHeader: { marginBottom: 8 },
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
    textAlign: "center",
  },
  errorOkBtn: {
    alignSelf: "center",
    backgroundColor: COLORS.red,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorOkText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
});
