// assets/src/features/client/useClients.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

// ---- Respuesta de la API
type ApiClient = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  adress: string;       // la API lo envía así
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  data: ApiClient[];
  errorCode: string;    // "200" cuando OK
};

// ---- Tipo normalizado para tu app
export type Client = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;      // normalizamos 'adress' -> 'address'
  createdAtISO: string;
  updatedAtISO: string;
};

function normalize(c: ApiClient): Client {
  return {
    id: c.id,
    name: `${c.first_name} ${c.last_name}`.trim(),
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email,
    address: c.adress ?? "",
    createdAtISO: c.created_at,
    updatedAtISO: c.updated_at,
  };
}

export function useClients(opts: { enabled?: boolean } = {}) {
  const { enabled = true } = opts;

  return useQuery({
    queryKey: ["clients", "all"],
    queryFn: async (): Promise<Client[]> => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return [];

      const res = await api.get<ApiResponse>("/clients"); // sin params
      const payload = res.data;

      if (payload?.errorCode && payload.errorCode !== "200") {
        throw new Error(`API errorCode: ${payload.errorCode}`);
      }

      const list = payload?.data ?? [];
      return list.map(normalize);
    },
    staleTime: 60_000,
    enabled,
  });
}
