// hooks/useNotifications.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

type ApiNotification = {
  id: string;
  data?: {
    title?: string;
    body?: string;
  };
  read_at: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "all"],
    queryFn: async (): Promise<Notification[]> => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return[];

      // Usa exactamente /api/v1/notifications como pediste
      const { data } = await api.get<{ data: ApiNotification[] }>("/v1/notifications");

      const list = data?.data ?? [];
      return list.map((n) => ({
        id: n.id,
        title: n.data?.title ?? "",
        body: n.data?.body ?? "",
        read_at: n.read_at ?? null,
        created_at: n.created_at ?? "",
      }));
    },
    staleTime: 60_000,
  });
}
