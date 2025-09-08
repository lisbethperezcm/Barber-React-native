// app/change-password.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const disabled = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return true;
    if (newPassword.length < 6) return true;
    if (newPassword !== confirmPassword) return true;
    return false;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSubmit = () => {
    if (disabled) return;
    // 👉 Aquí conectarás tu API real
    alert("Contraseña actualizada (demo)");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
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
        <Text style={styles.hintItem}>• Mínimo 6 caracteres</Text>
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
          Actualizar Contraseña
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ====== Paleta y Estilos (mismo look que tu web/Tailwind) ====== */
const COLORS = {
  bg: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  inputBg: "#F8FAFC",
  hintBg: "#F3F4F6",
  brand: "#0F172A",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
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
    backgroundColor: COLORS.inputBg, // gris claro como la web
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56, // alto consistente
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    paddingRight: 42, // espacio para el icono del ojo
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
});
