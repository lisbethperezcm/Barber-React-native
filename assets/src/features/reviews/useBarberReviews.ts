// assets/src/features/reviews/useBarberReviews.ts
import { api } from "@/assets/src/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import * as secure from "../../lib/secure";



export type BarberReview = {
  id: number;
  rating: number;
  comment: string;
  client: string;
  barber: string;
  appointment_id: number;
  created_at: string;
};

type RawList = any;
type CreateBody = {
  client_id: number;
  appointment_id: number | string;
  rating: number;
  comment?: string;
};

function coerceList(payload: RawList): BarberReview[] {
  const src = payload?.original ?? payload ?? {};
  const list = Array.isArray(src?.data) ? src.data : (Array.isArray(src) ? src : []);
  return list.map((r: any) => ({
    id: Number(r.id),
    rating: Number(r.rating),
    comment: String(r.comment ?? ""),
    client: String(r.client ?? ""),
    barber: String(r.barber ?? ""),
    appointment_id: Number(r.appointment_id),
    created_at: String(r.created_at ?? ""),
  }));
}

async function getToken(): Promise<string | null> {
  return (await secure.get("accessToken")) ?? null;
}

/** LISTAR reviews (scope por barbero logueado -> ?barber_id=) */
export function useBarberReviews(opts?: { barberScoped?: boolean }) {
  const { barberScoped = true } = opts || {};
  const [barberId, setBarberId] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      const a = await secure.get("barber");
      const b = await secure.get("barber_id");
      const c = await secure.get("barberId");
      const parseId = (v: string | null) => {
        if (!v) return null;
        try {
          const j = JSON.parse(v);
          const raw = j?.id ?? j?.barber_id ?? j?.barberId ?? j;
          const n = Number(raw);
          return Number.isFinite(n) ? n : null;
        } catch {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        }
      };
      setBarberId(parseId(a) ?? parseId(b) ?? parseId(c));
    })();
  }, []);

  return useQuery({
    queryKey: ["barber-reviews", barberScoped ? barberId : "all"],
    enabled: barberScoped ? barberId !== null : true,
    queryFn: async () => {
      const token = await getToken();
      const params = barberScoped && barberId ? { barber_id: barberId } : undefined;
      const { data } = await api.get("/barber-reviews", {
        params,
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return coerceList(data);
    },
  });
}

/** CREAR review */
export function useCreateBarberReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateBody) => {
      const token = await getToken();
      const { data } = await api.post("/barber-reviews", body, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["barber-reviews"] }),
        qc.invalidateQueries({ queryKey: ["barber-reviews", "all"] }),
      ]);
    },
  });
}
