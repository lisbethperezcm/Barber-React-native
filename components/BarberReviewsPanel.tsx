/*import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

// === DATA DUMMY ===
const DUMMY_REVIEWS: Review[] = [
  {
    id: 1,
    rating: 5,
    comment: "Excelente servicio, muy puntual.",
    createdAt: "2025-09-20T14:00:00Z",
  },
  {
    id: 2,
    rating: 4,
    comment: "Muy buen corte, volveré.",
    createdAt: "2025-09-19T10:30:00Z",
  },
  {
    id: 3,
    rating: 3,
    comment: "El corte estuvo bien, pero tardó un poco.",
    createdAt: "2025-09-18T16:15:00Z",
  },
  {
    id: 4,
    rating: 3,
    comment: "El corte estuvo bien, pero tardó un poco.",
    createdAt: "2025-09-18T16:15:00Z",
  },
  {
    id: 5,
    rating: 3,
    comment: "El corte estuvo bien, pero tardó un poco.",
    createdAt: "2025-09-18T16:15:00Z",
  },
];

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <Text style={{ fontSize: 14 }}>
      {"★".repeat(v)}
      <Text style={{ color: "#9CA3AF" }}>{"★".repeat(5 - v)}</Text>
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

export default function BarberReviewsPanel() {
  const avg = useMemo(() => {
    if (!DUMMY_REVIEWS.length) return 0;
    const sum = DUMMY_REVIEWS.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / DUMMY_REVIEWS.length) * 10) / 10;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Cabecera */
      /*<View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom:5}}>Mis Evaluaciones</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Stars value={avg} />
          <Text style={{ color: "#4B5563" }}>
            {DUMMY_REVIEWS.length ? `${avg} de 5` : "Sin calificaciones"}
          </Text>
          <Text style={{ color: "#9CA3AF" }}>
            · {DUMMY_REVIEWS.length}{" "}
            {DUMMY_REVIEWS.length === 1 ? "reseña" : "reseñas"}
          </Text>
        </View>
      </View>

      {/* Lista */
      /*<FlatList
        data={DUMMY_REVIEWS}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 16,
              padding: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#6B7280" }}>{formatDate(item.createdAt)}</Text>
              <Stars value={item.rating} />
            </View>
            <Text style={{ marginTop: 8 }}>{item.comment}</Text>
          </View>
        )}
      />
    </View>
  );
}*/

//NEW panel 
import { api } from "@/assets/src/lib/api"; // <- mismo helper que usas en citas
import { get as secureGet, set as secureSet } from "@/assets/src/lib/secure";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";

type Review = {
  id: number;
  rating: number;
  comment: string | null;
  client: string;
  barber: string;
  appointment_id: number;
  created_at: string;
};

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <Text style={{ fontSize: 14, color: "#FBBF24" }}>
      {"★".repeat(v)}
      <Text style={{ color: "#E5E7EB" }}>{"★".repeat(5 - v)}</Text>
    </Text>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "2-digit" });
}

/** Intenta resolver barberId como lo haría un módulo maduro: SecureStore -> user JSON -> backend (/me variantes) */
async function resolveBarberId(): Promise<{ id: string | null; debug: string[] }> {
  const dbg: string[] = [];

  // 1) claves directas
  const directKeys = ["barberId", "barber_id", "BARBER_ID"];
  for (const k of directKeys) {
    const v = await secureGet(k);
    dbg.push(`secure:${k}=${v ?? "null"}`);
    if (v && String(v).trim()) return { id: String(v).trim(), debug: dbg };
  }

  // 2) objetos de usuario guardados
  const userKeys = ["user", "currentUser", "auth", "profile"];
  for (const k of userKeys) {
    const raw = await secureGet(k);
    dbg.push(`secure:${k}=${raw ? "json" : "null"}`);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const candidate =
          u?.barber_id ?? u?.barberId ??
          u?.data?.barber_id ?? u?.data?.barberId ??
          u?.user?.barber_id ?? u?.user?.barberId ??
          u?.profile?.barber_id ?? u?.profile?.barberId;
        if (candidate) return { id: String(candidate), debug: dbg };
      } catch {
        dbg.push(`secure:${k}:json-parse-failed`);
      }
    }
  }
const barber = await SecureStore.getItemAsync("barber");
  // 3) pedir al backend (distintas rutas comunes)
  const endpoints = ["/me", "/auth/me", "/user/me"];
  for (const ep of endpoints) {
    try {
      const { data } = await api.get(ep);
      dbg.push(`GET ${ep}:ok`);
      const candidate =
        data?.barber_id ?? data?.barberId ??
        data?.data?.barber_id ?? data?.data?.barberId ??
        data?.user?.barber_id ?? data?.user?.barberId;
      if (candidate) {
        // Guardamos para futuras cargas rápidas
        await secureSet("barberId", String(candidate));
        return { id: String(candidate), debug: dbg };
      }
    } catch (e) {
      dbg.push(`GET ${ep}:fail`);
    }
  }

  return { id: null, debug: dbg };
}

export default function BarberReviewsPanel() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { id, debug } = await resolveBarberId();
        if (!cancelled) setDebug(debug);
     
        const barber = await SecureStore.getItemAsync("barber");
        const { data } = await api.get<Review[]>(`/barber-reviews?barber_id=${barber}`);
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Error al cargar reseñas");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const avg = useMemo(() => {
    if (!items.length) return 0;
    const sum = items.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((sum / items.length) * 10) / 10;
  }, [items]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Cargando reseñas…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 16, backgroundColor: "#fff" }}>
        <Text style={{ color: "#991B1B" }}>No se pudieron cargar reseñas: {error}</Text>
        {/* Debug visible opcional: comenta si no lo quieres en prod */}
        {debug?.length ? (
          <Text style={{ marginTop: 8, color: "#6B7280", fontSize: 12 }}>
            Debug: {debug.join(" | ")}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Encabezado */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Mis Evaluaciones
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Stars value={avg} />
          <Text style={{ color: "#4B5563" }}>
            {items.length ? `${avg} / 5` : "Sin calificaciones"}
          </Text>
          <Text style={{ color: "#9CA3AF" }}>
            · {items.length} {items.length === 1 ? "reseña" : "reseñas"}
          </Text>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ color: "#6B7280" }}>Aún no tienes evaluaciones.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            {/* Fecha + estrellas (sin nombre de cliente) */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#6B7280" }}>{formatDate(item.created_at)}</Text>
              <Stars value={item.rating} />
            </View>

            {/* Comentario con fallback */}
            {item.comment && item.comment.trim().length > 0 ? (
              <Text style={{ marginTop: 8 }}>{item.comment}</Text>
            ) : (
              <Text style={{ marginTop: 8, color: "#9CA3AF" }}>Sin comentarios</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}


