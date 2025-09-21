// assets/src/features/barber/useAvailableSlots.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

type ApiSlot = {
  start_time: string; // ISO o HH:mm según tu backend
  end_time: string;   // ISO o HH:mm
};

export type Slot = {
  startISO: string;
  endISO: string;
  durationMin: number;
};

export type AvailableSlotsResult = {
  slots: Slot[];
  suggestedBarber: number | null;
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
  params: { barberId?: number | null; date: string; duration: number },
  options?: { enabled?: boolean }
) {
  const { barberId, date, duration } = params;

  return useQuery<AvailableSlotsResult>({
    queryKey: ["availableSlots", barberId, date, duration],
    queryFn: async (): Promise<AvailableSlotsResult> => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        return { slots: [], suggestedBarber: null };
      }

      // Payload: solo manda barber_id si es numérico
      const payload: Record<string, any> = { date, duration };
      if (typeof barberId === "number") {
        payload.barber_id = barberId;
      }

      const { data } = await api.post(
        "/barbers/availableSlots",
        payload
      );

      const rawList = (data as any)?.data ?? (data as any) ?? [];
      const suggestedBarber: number | null = (data as any)?.suggested_barber ?? null;

      const slots = (Array.isArray(rawList) ? rawList : []).map(normalize);

      return { slots, suggestedBarber };
    },
    enabled: Boolean(options?.enabled && date && duration),
    staleTime: 60_000,
  });
}
