// app/(auth)/register.tsx
import { useRegister } from "@/assets/src/features/auth/useRegister";


import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const COLORS = {
  bg: "#FFFFFF",
  text: "#111827",  // color principal
  muted: "#6B7280",
  border: "#E5E7EB",
  brand: "#0F172A",
};

export default function RegisterScreen() {
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const canSubmit = useMemo(() => {
    const emailOk = /\S+@\S+\.\S+/.test(email);
    const passOk = password.length >= 6 && password === confirm;
    return firstName && lastName && emailOk && phone && address && passOk;
  }, [firstName, lastName, email, phone, address, password, confirm]);

  const handleRegister = () => {
    // Validación mínima (el backend también valida)
    if (password !== confirm) {
      Alert.alert("Contraseña", "Las contraseñas no coinciden");
      return;
    }

    register(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
        phone_number: phone.trim(),
        address: address.trim(),
        // Si tu hook NO fija el rol internamente, descomenta:
        // role_id: 3,
      } as any,
      {
        onSuccess: () => {
          router.replace("/login");
          Alert.alert("Registro", "Cuenta creada con éxito. Por favor, inicia sesión.");
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "No se pudo completar el registro.";

          console.log("Error en el registro:", msg);
          Alert.alert("Error", "No se pudo completar el registro.");
        },
      }
    );
  };

  return (
    <>

      <Stack.Screen
        options={{ title: "Formulario de Registro", headerShown: false, headerBackVisible: false }}
      />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: "padding" })}
        style={{ flex: 1, backgroundColor: COLORS.bg }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Botón Back "<" con estilo */}
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={30} color={COLORS.text} />
          </Pressable>

          <Text style={styles.title}>Vip Stylist</Text>
          <Text style={styles.subtitle}>Crea tu cuenta</Text>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nombre"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellido"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="8091234567"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Ex: Calle, número, sector"
            placeholderTextColor={COLORS.muted}
          />

          {/* Contraseña con ojito + icono info */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.rowBetween}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="**********"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() =>
                Alert.alert(
                  "Requisitos de contraseña",
                  "- Mínimo 8 caracteres\n- Al menos una mayúscula\n- Al menos un número\n- Sin espacios"
                )
              }
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="information-circle-outline" size={22} color={COLORS.brand} />
            </Pressable>
          </View>

          {/* Confirmación con ojito */}
          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0 }]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="*********"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showConfirm}
            />
            <Pressable onPress={() => setShowConfirm((prev) => !prev)}>
              <Ionicons
                name={showConfirm ? "eye-off" : "eye"}
                size={22}
                color={COLORS.muted}
              />
            </Pressable>
          </View>

          <Pressable
            disabled={!canSubmit || isPending}
            onPress={handleRegister}
            style={[styles.button, (!canSubmit || isPending) && { opacity: 0.6 }]}
          >
            {isPending ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}>Registrando…</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace("/login")} style={{ marginTop: 16 }}>
            <Text style={{ textAlign: "center", color: COLORS.muted }}>
              ¿Ya tienes una cuenta?{" "}

              <Text
                style={{ textDecorationLine: "underline", color: COLORS.text }}
              >
                Inicia sesión

              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 20, gap: 5 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  backTxt: { fontSize: 30, fontWeight: "400", color: COLORS.text },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.muted,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#fff",
  },
  // 🔹 Añadidos sin alterar tu look&feel
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  row2: { flexDirection: "row", alignItems: "flex-start" },
  rowBetween: { flexDirection: "row", alignItems: "center" },
  button: {
    backgroundColor: COLORS.brand,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
