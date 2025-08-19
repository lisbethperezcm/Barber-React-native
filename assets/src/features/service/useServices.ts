// hooks/useServices.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api"; // ajusta la ruta si tu api está en otro lugar

/** ----- Tipos provenientes de la API ----- */
type ApiService = {
  id: number;
  name: string;
  current_price: number;
  previous_price: number | null;
  duration: number; // minutos
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ApiResponse = {
  data: ApiService[];
  errorCode?: string;
};

/** ----- Tipo normalizado para la app ----- */
export type Service = {
  id: number;
  name: string;
  price: number;                // current_price
  previousPrice: number | null; // previous_price
  durationMin: number;          // duration
  createdAtISO: string;
  updatedAtISO: string;
  updatedBy: number | null;
  isDeleted: boolean;           // !!deleted_at
  isActive: boolean;            // !deleted_at
};

/** ----- Normalizador ----- */
function normalize(s: ApiService): Service {
  return {
    id: s.id,
    name: s.name,
    price: Number(s.current_price) || 0,
    previousPrice: s.previous_price !== null ? Number(s.previous_price) : null,
    durationMin: Number(s.duration) || 0,
    createdAtISO: s.created_at,
    updatedAtISO: s.updated_at,
    updatedBy: s.updated_by,
    isDeleted: !!s.deleted_at,
    isActive: !s.deleted_at,
  };
}

/** ----- Hook principal ----- */
export function useServices(opts: { enabled?: boolean } = {}) {
    const { enabled = true } = opts;
  return useQuery({
    queryKey: ["services", "all"],
    queryFn: async (): Promise<Service[]> => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return [];

      // Ajusta el endpoint si tu backend expone otra ruta
      const { data } = await api.get<ApiResponse>("/servicios");

      const list = data?.data ?? [];
      return list.map(normalize);
    },
    staleTime: 60_000,
    enabled,
  });
}
