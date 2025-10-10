// assets/src/features/reviews/useBarberReviews.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

// ---- API: tal como llega del backend ----
type ApiReview = {
  id: number;
  rating: number;
  comment: string | null;
  client: string;         // "Bryan Marte"
  barber: string;         // "Miguel García"
  appointment_id: number; // 144
  created_at: string;     // ISO
  created_by: string | null;
  updated_at: string;     // ISO
  updated_by: string | null;
};

// ---- App (normalizado a camelCase) ----
export type BarberReview = {
  id: number;
  rating: number;
  comment: string;       // nunca null
  clientName: string;
  barberName: string;
  appointmentId: number;
  createdAtISO: string;
  updatedAtISO: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

// Body para crear
export type CreateBarberReviewBody = {
  client_id: number;
  appointment_id: number | string;
  rating: number;
  comment?: string;
};

// Normalizador
function normalize(r: ApiReview): BarberReview {
  return {
    id: r.id,
    rating: Number(r.rating) || 0,
    comment: r.comment ?? "",
    clientName: r.client ?? "",
    barberName: r.barber ?? "",
    appointmentId: Number(r.appointment_id),
    createdAtISO: r.created_at ?? "",
    updatedAtISO: r.updated_at ?? "",
    createdBy: r.created_by ?? null,
    updatedBy: r.updated_by ?? null,
  };
}

// Listado por barbero (lee "barber" del SecureStore y lo manda como barber_id)
export function useBarberReviews(opts: { enabled?: boolean } = {}) {
  const { enabled = false } = opts;

  return useQuery({
    queryKey: ["barberReviews", "byBarber"],
    queryFn: async (): Promise<BarberReview[]> => {
      const barber = await SecureStore.getItemAsync("barber");
      let barberId: number | null = null;

      if (barber) {
        try {
          const parsed = JSON.parse(barber);
          barberId = typeof parsed === "number" ? parsed : Number(parsed?.id ?? parsed);
          if (!Number.isFinite(barberId)) barberId = null;
        } catch {
          const n = Number(barber);
          barberId = Number.isFinite(n) ? n : null;
        }
      }

      const { data } = await api.get<{ data: ApiReview[] }>("/barber-reviews", {
        params: barberId ? { barber_id: barberId } : undefined,
      });

      const list = data?.data ?? [];
      return list.map(normalize);
    },
    staleTime: 60_000,
    enabled,
  });
}

// Crear review + invalidar cache
export function useCreateBarberReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateBarberReviewBody) => {
      const { data } = await api.post("/barber-reviews", body);
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["barberReviews"] }),
        qc.invalidateQueries({ queryKey: ["barberReviews", "byBarber"] }),
      ]);
    },
  });
}