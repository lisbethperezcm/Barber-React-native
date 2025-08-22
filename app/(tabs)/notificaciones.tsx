// app/(tabs)/Notificaciones.tsx

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

/*
import { useNotifications } from "@/assets/src/features/notification/useNotifications"; // ajusta la ruta si no usas alias "@"
import { useEffect } from "react";

export default function DebugNotifications() {
  const { data, isLoading, error } = useNotifications();

  useEffect(() => {
    if (isLoading) console.log("🔔 Cargando notificaciones…");
    if (error) console.log("❌ Error notificaciones:", error);
  }, [isLoading, error]);

  useEffect(() => {
    if (data) console.log("✅ Notificaciones:", JSON.stringify(data, null, 2));
  }, [data]);

  return null; // componente solo para logs
}*/


type NotificationType =
  | "new_appointment"
  | "reminder"
  | "canceled"
  | "payment"
  | "review";

type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timeAgo: string; // ej: "Hace 5 min"
  unread?: boolean;
};

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    type: "new_appointment",
    title: "Nueva cita agendada",
    message: "Carlos Mendoza agendó una cita para mañana a las 10:00 AM",
    timeAgo: "Hace 5 min",
    unread: true,
  },
  {
    id: "2",
    type: "reminder",
    title: "Recordatorio de cita",
    message: "Miguel Torres tiene cita en 30 minutos - Corte clásico",
    timeAgo: "Hace 10 min",
    unread: true,
  },
  {
    id: "3",
    type: "canceled",
    title: "Cita cancelada",
    message: "Roberto Silva canceló su cita de las 3:00 PM",
    timeAgo: "Hace 1 hora",
  },
  {
    id: "4",
    type: "payment",
    title: "Pago recibido",
    message: "Juan Pérez completó el pago de $750 por corte y barba",
    timeAgo: "Hace 2 horas",
  },
  {
    id: "5",
    type: "review",
    title: "Nueva reseña",
    message: "María Ruiz dejó una reseña 5★ por su servicio",
    timeAgo: "Hace 3 horas",
  },
];

export default function Notificaciones() {
  const router = useRouter();
  const [items, setItems] = React.useState<AppNotification[]>(
    MOCK_NOTIFICATIONS
  );

  const markAsRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => markAsRead(item.id)}
      style={styles.card}
    >
      {/* Icono por tipo */}
      <View style={[styles.iconWrap, getIconBg(item.type)]}>
        <Ionicons
          name={getIconName(item.type)}
          size={18}
          color={getIconColor(item.type)}
        />
      </View>

      {/* Contenido */}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.unread ? <View style={styles.unreadDot} /> : null}
        </View>

        <Text style={styles.cardMessage} numberOfLines={2}>
          {item.message}
        </Text>

        <Text style={styles.cardTime}>{item.timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.sheet}>
        {/* Header */}
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
