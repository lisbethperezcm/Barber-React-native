// assets/src/features/barbers/useBarbers.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api"; // ajusta la ruta si tu api está en otro lugar

// ---- Respuesta de la Api
type ApiBarber = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  status: string;
  commission: number;
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  data: ApiBarber[];
  errorCode: string; // "200" cuando OK
};

// ---- Tipo normalizado para tu app ----
export type Barber = {
  id: number;
  name: string;          // first_name + last_name
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  commission: number;
  createdAtISO: string;
  updatedAtISO: string;
};

function normalize(b: ApiBarber): Barber {
  return {
    id: b.id,
    name: `${b.first_name} ${b.last_name}`.trim(),
    firstName: b.first_name,
    lastName: b.last_name,
    email: b.email,
    status: b.status,
    commission: b.commission,
    createdAtISO: b.created_at,
    updatedAtISO: b.updated_at,
  };
}

export function useBarbers() {
  return useQuery({
    queryKey: ["barbers", "all"],
    queryFn: async (): Promise<Barber[]> => {
      // igual que tu useAppointments: si no hay token, no llamamos
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return [];

      const res = await api.get<ApiResponse>("/api/barbers");
      const payload = res.data;

      if (payload?.errorCode && payload.errorCode !== "200") {
        throw new Error(`API errorCode: ${payload.errorCode}`);
      }

      const list = payload?.data ?? [];
      return list.map(normalize);
    },
    staleTime: 60_000, // 1 min, igual que appointments
  });
}
