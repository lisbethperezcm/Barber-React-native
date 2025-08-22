// assets/src/features/barber/useAvailableSlots.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

type ApiSlot = {
  start_time: string; // ISO
  end_time: string;   // ISO
};

export type Slot = {
  startISO: string;
  endISO: string;
  durationMin: number;
};

function diffMinutes(startISO: string, endISO: string) {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const ms = Math.max(0, end - start);
  return Math.round(ms / 60000);
}

function normalize(s: ApiSlot): Slot {
  return {
    startISO: s.start_time,
    endISO: s.end_time,
    durationMin: diffMinutes(s.start_time, s.end_time),
  };
}

export function useAvailableSlots(
  params: { barberId: number | null; date: string; duration: number },
  options?: { enabled?: boolean }
) {
  const { barberId, date, duration } = params;

  return useQuery({
    queryKey: ["availableSlots", barberId, date, duration],
    queryFn: async (): Promise<Slot[]> => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return [];

      const { data } = await api.post<{ data?: ApiSlot[] }>(
        "/barbers/availableSlots",
        {
          barber_id: barberId,
          date,
          duration,
        }
      );

      const list = (data as any)?.data ?? (data as any) ?? [];
      return (list as ApiSlot[]).map(normalize);
    },
    enabled: Boolean(options?.enabled && barberId && date && duration),
    staleTime: 60_000,
  });
}
