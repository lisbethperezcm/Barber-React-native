// app/(tabs)/horarios.tsx
import React, { useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

type DayRow = { day: string; hours: string; active: boolean };

const COLORS = {
    bg: "#F5F7FA",
    card: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    border: "#E5E7EB",
    green: "#16A34A",
    greenSoft: "#DCFCE7",
    graySoft: "#F3F4F6",
    gray: "#9CA3AF",
    red: "#DC2626",
    white: "#FFFFFF",
    overlay: "rgba(0,0,0,0.45)",
};

export default function HorariosScreen() {
    const [schedule, setSchedule] = useState<DayRow[]>([
        { day: "Lunes", hours: "9:00 - 18:00", active: true },
        { day: "Martes", hours: "9:00 - 18:00", active: true },
        { day: "Miércoles", hours: "9:00 - 18:00", active: true },
        { day: "Jueves", hours: "9:00 - 18:00", active: true },
        { day: "Viernes", hours: "9:00 - 20:00", active: true },
        { day: "Sábado", hours: "8:00 - 16:00", active: true },
        { day: "Domingo", hours: "Cerrado", active: false },
    ]);

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [dayToToggle, setDayToToggle] = useState<number | null>(null);

    const toggleDay = (index: number) => {
        setSchedule(prev =>
            prev.map((d, i) => {
                if (i !== index) return d;
                const nextActive = !d.active;
                const defaultHours =
                    d.day === "Viernes" ? "9:00 - 20:00" : d.day === "Sábado" ? "8:00 - 16:00" : "9:00 - 18:00";
                return { ...d, active: nextActive, hours: nextActive ? defaultHours : "Cerrado" };
            }),
        );
    };

    const handleTogglePress = (i: number) => {
        schedule[i].active ? (setDayToToggle(i), setConfirmVisible(true)) : toggleDay(i);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>Horarios de Trabajo</Text>

                {/* Scroll con scrollbar visible */}
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
                    <View style={styles.card}>
                        {schedule.map((row, i) => (
                            <View key={row.day} style={styles.row}>
                                {/* IZQUIERDA: punto + stack (día arriba / horario horizontal debajo) */}
                                <View style={styles.left}>
                                    <View
                                        style={[
                                            styles.dot,
                                            { backgroundColor: row.active ? COLORS.green : COLORS.gray },
                                        ]}
                                    />
                                    <View style={styles.nameAndHours}>
                                        <Text style={styles.day} numberOfLines={1} ellipsizeMode="tail">
                                            {row.day}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.hoursInline,
                                                { color: row.active ? COLORS.text : COLORS.muted },
                                            ]}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {row.hours}
                                        </Text>
                                    </View>
                                </View>

                                {/* DERECHA: badge + switch (misma fila, siempre visibles) */}
                                <View style={styles.right}>
                                    <View
                                        style={[
                                            styles.badge,
                                            {
                                                backgroundColor: row.active ? COLORS.greenSoft : COLORS.graySoft,
                                                borderColor: row.active ? COLORS.green : COLORS.border,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                color: row.active ? COLORS.green : COLORS.muted,
                                                fontWeight: "700",
                                                fontSize: 12,
                                            }}
                                            numberOfLines={1}
                                        >
                                            {row.active ? "activo" : "inactivo"}
                                        </Text>
                                    </View>

                                    <Switch
                                        value={row.active}
                                        onValueChange={() => handleTogglePress(i)}
                                        trackColor={{ false: "#D1D5DB", true: "#111827" }}   // pista negra cuando está ON
                                        thumbColor={row.active ? "#FFFFFF" : "#FFFFFF"}      // pulgar blanco (mejor contraste)
                                        ios_backgroundColor="#D1D5DB"
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Modal confirmación */}
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
                            ¿Estás seguro que deseas desactivar el día{" "}
                            <Text style={{ fontWeight: "700" }}>
                                {dayToToggle !== null ? schedule[dayToToggle].day : ""}
                            </Text>
                            ? No podrás recibir citas en este día.
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
                                onPress={() => {
                                    if (dayToToggle !== null) toggleDay(dayToToggle);
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
    title: { fontSize: 26, fontWeight: "900", color: COLORS.text, marginBottom: 12 },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 120 },

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

    // Fila
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

    // Izquierda: punto + (día / horario debajo)
    left: {
        flexDirection: "row",
        alignItems: "flex-start",
        flexGrow: 1,
        flexShrink: 1,
        paddingRight: 10,
    },
    dot: { width: 10, height: 10, borderRadius: 999, marginTop: 6, marginRight: 10 },

    nameAndHours: { flexShrink: 1 },
    day: { fontSize: 18, fontWeight: "800", color: COLORS.text },

    // horario horizontal debajo del día
    hoursInline: {
        marginTop: 2,
        fontSize: 14,
        fontWeight: "700",
        fontVariant: Platform.OS === "ios" ? ["tabular-nums"] : undefined,
    },

    // Derecha: badge + toggle
    right: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    // Modal
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
});
