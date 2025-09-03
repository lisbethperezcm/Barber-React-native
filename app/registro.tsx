// app/(auth)/register.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
  text: "#111827",  // color más oscuro
  muted: "#6B7280", // gris para placeholder
  border: "#E5E7EB",
  brand: "#0F172A",
};

export default function RegisterScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const canSubmit = useMemo(() => {
    const emailOk = /\S+@\S+\.\S+/.test(email);
    const passOk = password.length >= 6 && password === confirm;
    return firstName && lastName && emailOk && phone && address && passOk;
  }, [firstName, lastName, email, phone, address, password, confirm]);

  return (
    <>

      <Stack.Screen options={{ title: "Formulario de Registro", headerShown: false, headerBackVisible: false }} />
      
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: "padding"})}
        style={{ flex: 1, backgroundColor: COLORS.bg }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
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

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="**********"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar contraseña</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="*********"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
          />

          <Pressable
            disabled={!canSubmit}
            onPress={() => console.log("UI only, values OK")}
            style={[styles.button, !canSubmit && { opacity: 0.6 }]}
          >
            <Text style={styles.buttonText}>Registrarse</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/login")}
            style={{ marginTop: 16 }}
          >
            <Text style={{ textAlign: "center", color: COLORS.muted }}>
              ¿Ya tienes una cuenta?{" "}
              <Text
                style={{ textDecorationLine: "underline", color: COLORS.text }}
              >
                Iniciar Sesión
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 36, gap: 8 },
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
    fontWeight: "600",      // más fuerte
    color: COLORS.text,     // más oscuro como en login
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14, // placeholder más pequeño
    color: COLORS.text,
    backgroundColor: "#fff",
  },
  row2: { flexDirection: "row", alignItems: "flex-start" },
  button: {
    backgroundColor: COLORS.brand,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
