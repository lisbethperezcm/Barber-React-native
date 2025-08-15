"use client";

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLogin } from "../assets/src/features/auth/useLogin"; // ⬅️ ajusta si tu ruta cambia

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // usamos tu hook con React Query
  const { mutate, isPending } = useLogin();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }
    mutate(
      { email, password },
      {
        onSuccess: (data) => {
          console.log("Respuesta completa del login:", data); // <-- ver todo el objeto
          Alert.alert("Token recibido", data?.access_token ?? "No hay token");
          // éxito → llevar a tabs
          router.replace("/(tabs)");

          // Alert.alert("Token recibido", data.accessToken ?? "No hay token");
        },
        onError: (error) => {
          console.log("Error en el login:", error);
          Alert.alert("Error", "Credenciales inválidas o servidor no disponible");
        },
      }
    );
  };

  const handleForgotPassword = () => {
    Alert.alert("Recuperar Contraseña", "Se enviará un enlace a tu correo electrónico");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Vip Stylist</Text>
            <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isPending && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => Alert.alert("Registro", "Próximamente")}>
              <Text style={styles.signUpText}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 48 },
  title: { fontSize: 32, fontWeight: "700", color: "#111827", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: "#6B7280", fontWeight: "400" },
  form: { marginBottom: 32 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 8 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 32, marginTop: 4 },
  forgotPasswordText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  loginButton: {
    height: 52,
    backgroundColor: "#111827",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  loginButtonDisabled: { backgroundColor: "#9CA3AF" },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingBottom: 32 },
  footerText: { fontSize: 14, color: "#6B7280", marginRight: 4 },
  signUpText: { fontSize: 14, color: "#111827", fontWeight: "600" },
});

export default LoginScreen;
