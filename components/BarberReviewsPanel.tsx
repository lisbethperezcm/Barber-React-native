// assets/src/components/BarberReviewsPanel.tsx
import { useBarberReviews } from "@/assets/src/features/reviews/useBarberReviews";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";

const UI = {
  bg: "#FFFFFF",
  cardBg: "#F9FAFB",
  cardBorder: "#E5E7EB",
  text: "#111827", // negro
  accent: "#FBBF24", // dorado para estrellas y chip
  accentSoft: "#FEF3C7", // fondo suave dorado
  danger: "#991B1B",
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  } as const,
};

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <Text style={{ fontSize: 14, color: UI.accent }}>
      {"★".repeat(v)}
      {/* estrellas vacías → gris */}
      <Text style={{ color: "#D1D5DB" }}>{"★".repeat(5 - v)}</Text>
    </Text>
  );
}



function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function EmptyState() {
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 48,
        backgroundColor: UI.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: UI.cardBorder,
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 20,
          backgroundColor: UI.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Ionicons name="chatbubbles-outline" size={40} color={UI.accent} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6, color: UI.text }}>
        Aún no tienes evaluaciones
      </Text>
      <Text
        style={{
          color: UI.text,
          textAlign: "center",
          paddingHorizontal: 24,
        }}
      >
        Cuando tus clientes califiquen tu servicio, verás aquí sus reseñas y el
        promedio.
      </Text>
    </View>
  );
}

// Avatar anónimo en blanco y negro
function InitialAvatar() {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        backgroundColor: "#E5E7EB", // gris claro
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
      }}
    >
      <Ionicons name="person" size={18} color="#111827" />
    </View>
  );
}

export default function BarberReviewsPanel() {
  const {
    data = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useBarberReviews({ enabled: true });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const avg = useMemo(() => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((sum / data.length) * 10) / 10;
  }, [data]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: UI.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: UI.text }}>Cargando reseñas…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: UI.danger, fontWeight: "600", marginBottom: 8 }}>
          No se pudieron cargar las reseñas.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.bg, padding: 16 }}>
      {/* Header */}
      <View
        style={{
          marginBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: UI.text }}>
            Mis Evaluaciones
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
            <Stars value={avg} />
            <Text style={{ color: UI.text }}>
              {data.length ? `${avg} / 5` : "Sin calificaciones"}
            </Text>
            <Text style={{ color: UI.text }}>
              · {data.length} {data.length === 1 ? "reseña" : "reseñas"}
            </Text>
            {isRefetching ? <ActivityIndicator style={{ marginLeft: 6 }} /> : null}
          </View>
        </View>

        {/* Chip promedio */}

        {/* Chip promedio */}
        <View
          style={{
            backgroundColor: UI.bg, // fondo blanco
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: UI.cardBorder,
            ...UI.shadow,
          }}
        >
          <Ionicons name="star" size={14} color={UI.accent} />
          <Text style={{ marginLeft: 6, color: UI.text, fontWeight: "700" }}>
            {avg.toFixed(1)}
          </Text>
        </View>


      </View>

      {/* Lista */}
      <FlatList
        data={data}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: UI.cardBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: UI.cardBorder,
              ...UI.shadow,
            }}
          >
            {/* Cabecera del item */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <InitialAvatar />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: UI.text }}>Cliente</Text>
                  <Text style={{ color: UI.text, fontSize: 12 }}>
                    {formatDate(item.createdAtISO)}
                  </Text>
                </View>
              </View>
              <Stars value={item.rating} />
            </View>

            {/* Comentario */}
            {item.comment && item.comment.trim().length > 0 ? (
              <Text style={{ marginTop: 4, color: UI.text }}>{item.comment}</Text>
            ) : (
              <Text style={{ marginTop: 4, color: UI.text }}>Sin comentarios</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}
