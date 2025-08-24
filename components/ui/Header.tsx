import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const COLORS = {
  bg: "#ffffff",
  text: "#111827",
  border: "#E5E7EB",
  badge: "#EF4444",
};

type Props = {
  notifications?: number;
};

// Icono “flat” estilo fi-rs-bell (trazo simple, fondo transparente)
function BellRSIcon({ size = 22, color = COLORS.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* campana */}
      <Path
        d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 00-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* badajo / sonrisa inferior */}
      <Path
        d="M13.5 21a2 2 0 01-3 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function Header({ notifications = 3 }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Text style={styles.brand}>Vip Stylist</Text>
      <View>
        <Pressable
          style={styles.bellBtn}
          onPress={() => router.push("/notificaciones")}
        >
          {/* 🔔 reemplazado por icono plano estilo fi-rs-bell */}
          <BellRSIcon size={26} color={COLORS.text} />

          {notifications > 0 && (
            <View style={styles.badge}>
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                {notifications}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bg,
  },
  brand: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  bellBtn: { padding: 6, position: "relative" },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.badge, // rojo
    alignItems: "center",
    justifyContent: "center",
  },
});
