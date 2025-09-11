// app/change-password.tsx
import { api } from "@/assets/src/lib/api";
import { Ionicons } from "@expo/vector-icons";
import type { AxiosError } from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLogout } from "../../assets/src/features/auth/useLogout";


export default function ChangePasswordScreen() {
  const router = useRouter();
 // const { logout } = useContext(AuthContext); // debe existir en tu contexto


 const logout = useLogout();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Popup de éxito
  const [showSuccess, setShowSuccess] = useState(false);

  const disabled = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return true;
    if (newPassword.length < 8) return true;
    if (newPassword !== confirmPassword) return true;
    if (submitting) return true;
    return false;
  }, [currentPassword, newPassword, confirmPassword, submitting]);

  function parseApiError(err: unknown): string {
    const e = err as AxiosError<any>;
    if (!e?.response) return "No hay conexión con el servidor.";
    const status = e.response.status;
    const body = e.response.data as { message?: string; errors?: Record<string, string[]> };

    if (status === 422 && body?.errors) {
      const first = Object.values(body.errors)[0]?.[0];
      return first || "Datos inválidos. Revisa el formulario.";
    }
    if (status === 400) return body?.message || "Solicitud inválida.";
    if (status === 401) return "Sesión expirada. Inicia sesión de nuevo.";
    return body?.message || "Ocurrió un error. Intenta más tarde.";
  }

  const handleSubmit = async () => {
    if (disabled) return;

    if (newPassword !== confirmPassword) {
      Alert.alert("Atención", "Las contraseñas no coinciden.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      };

      await api.post("/change-password", payload);

      // Limpia inputs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Muestra popup de éxito y, al terminar, desloguea
      setShowSuccess(true);
    } catch (err) {
      Alert.alert("Error", parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Cuando el popup se muestra, espera ~2.5s, hacemos logout y redirigir
  // logout después del popup
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(async () => {
      try {
        await logout(); // ✅ usamos la función directamente
      } finally {
        router.replace("/login");
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [showSuccess, logout, router]);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Wrapper con padding lateral */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Inputs */}
        <View style={styles.inputsGroup}>
          {/* Contraseña actual */}
          <View style={styles.inputContainer}>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Contraseña actual"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowCurrent((s) => !s)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Nueva contraseña */}
          <View style={styles.inputContainer}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nueva contraseña"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowNew((s) => !s)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Confirmar nueva contraseña */}
          <View style={styles.inputContainer}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar nueva contraseña"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((s) => !s)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Requisitos */}
        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Requisitos de contraseña:</Text>
          <Text style={styles.hintItem}>• Mínimo 8 caracteres</Text>
          <Text style={styles.hintItem}>• Se recomienda incluir números y símbolos</Text>
          <Text style={styles.hintItem}>• Evita usar información personal</Text>
        </View>

        {/* Botón actualizar */}
        <TouchableOpacity
          style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
          activeOpacity={disabled ? 1 : 0.85}
          onPress={handleSubmit}
        >
          <Ionicons name="checkmark-outline" size={18} color={disabled ? COLORS.textMuted : "#FFFFFF"} />
          <Text style={[styles.primaryBtnText, disabled && styles.primaryBtnTextDisabled]}>
            {submitting ? "Actualizando..." : "Actualizar Contraseña"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Popup de éxito reutilizable */}
      <SuccessPopup visible={showSuccess} message="Cambio de contraseña exitoso" />
    </SafeAreaView>
  );
}

/* ====== Popup de Éxito (similar al de crear cita) ====== */
function SuccessPopup({ visible, message }: { visible: boolean; message: string }) {
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: 5000, // barra de tiempo ~2.2s
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [visible, progress]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Barra superior que se consume */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: widthInterpolate }]} />
          </View>

          <View style={styles.successIcon}>
            <Text style={{ fontSize: 28 }}>✅</Text>
          </View>
          <Text style={styles.modalTitle}>¡Listo!</Text>
          <Text style={styles.modalMsg}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

/* ====== Paleta y Estilos ====== */
const COLORS = {
  bg: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  inputBg: "#F8FAFC",
  hintBg: "#F3F4F6",
  brand: "#0F172A",
  green: "#16A34A",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20, // padding izquierda/derecha
    paddingTop: 8,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginLeft: 6,
  },

  /* Inputs */
  inputsGroup: {
    gap: 14,
    marginBottom: 20,
  },
  inputContainer: {
    position: "relative",
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    paddingRight: 42,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10,
  },

  /* Tarjeta de requisitos */
  hintCard: {
    backgroundColor: COLORS.hintBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  hintItem: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },

  /* Botón actualizar */
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  primaryBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  primaryBtnTextDisabled: {
    color: "#6B7280",
  },

  /* Popup */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginHorizontal: -18,
    marginTop: -18,
    marginBottom: 12,
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.green,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
  },
  modalMsg: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
