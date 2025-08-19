import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLORS = {
  bg: "#ffffff",
  text: "#111827",
  border: "#E5E7EB",
  badge: "#EF4444",
};

type Props = {
  notifications?: number;
};

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
          <Text style={{ fontSize: 20, color: COLORS.text }}>🔔</Text>
          {notifications > 0 && (
            <View style={styles.badge}>
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                {notifications}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View> // ✅ closes container View
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
    backgroundColor: COLORS.badge,
    alignItems: "center",
    justifyContent: "center",
  },
});
