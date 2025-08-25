// app/(tabs)/Notificaciones.tsx

import { useNotifications, type Notification } from "@/assets/src/features/notification/useNotifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NotificationType =
  | "new_appointment"
  | "reminder"
  | "canceled"
  | "payment"
  | "review";

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr} hora${diffHr > 1 ? "s" : ""}`;
  const diffDay = Math.floor(diffHr / 24);
  return `Hace ${diffDay} día${diffDay > 1 ? "s" : ""}`;
}

export default function Notificaciones() {
  const router = useRouter();
  const { data: items = [], isLoading, error } = useNotifications();

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      // Aquí podrías llamar a una función para marcar como leído en el backend si lo necesitas
      style={styles.card}
    >
      <View style={[styles.iconWrap, getIconBg(item.type as NotificationType)]}>
        <Ionicons
          name={getIconName(item.type as NotificationType)}
          size={18}
          color={getIconColor(item.type as NotificationType)}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title} 
          </Text>
          {item.read_at === null ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.cardMessage} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.cardTime}>{getTimeAgo(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={renderItem}
        />
      </View>
    </SafeAreaView>
  );
}
//Helpers visuales 
function getIconName(type: NotificationType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "new_appointment":
      return "calendar-outline";
    case "reminder":
      return "time-outline";
    case "canceled":
      return "close-circle-outline";
    case "payment":
      return "card-outline";
    case "review":
      return "star-outline";
  }
}

function getIconBg(type: NotificationType) {
  switch (type) {
    case "new_appointment":
      return { backgroundColor: "#EAF2FF" };
    case "reminder":
      return { backgroundColor: "#FFF4E5" };
    case "canceled":
      return { backgroundColor: "#FFECEC" };
    case "payment":
      return { backgroundColor: "#ECFDF3" };
    case "review":
      return { backgroundColor: "#F5F3FF" };
  }
}

function getIconColor(type: NotificationType) {
  switch (type) {
    case "new_appointment":
      return "#1D4ED8"; // azul
    case "reminder":
      return "#F59E0B"; // ámbar
    case "canceled":
      return "#DC2626"; // rojo
    case "payment":
      return "#16A34A"; // verde
    case "review":
      return "#7C3AED"; // morado
  }
}

const COLORS = {
  bg: "#F7F7F8",
  text: "#0F172A",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  cardBg: "#FFFFFF",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  /* Contenedor estilo “sheet” con bordes superiores redondeados */
  sheet: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#2563EB", // azul
    marginLeft: 8,
  },
  cardMessage: {
    marginTop: 6,
    color: COLORS.text,
    opacity: 0.9,
  },
  cardTime: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
