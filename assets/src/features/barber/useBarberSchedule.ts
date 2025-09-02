// hooks/useBarberSchedules.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

type ApiSchedule = {
  id: number;
  barber_id: number;
  day_id: number;
  day_name: string;
  start_time: string; // "09:00:00"
  end_time: string;   // "17:00:00"
  status_id: number;
};

export type Schedule = {
  id: number;
  barberId: number;
  dayId: number;
  dayName: string;
  startTime: string; // puedes usar ISO si lo transformas con Date
  endTime: string;
  statusId: number;

};

function normalize(s: ApiSchedule): Schedule {
  return {
    id: s.id,
    barberId: s.barber_id,
    dayId: s.day_id,
    dayName: s.day_name,
    startTime: s.start_time,
    endTime: s.end_time,
    statusId: s.status_id,

  };
}

export function useBarberSchedules() {


  return useQuery({
    queryKey: ["schedules", "barber"],
    queryFn: async (): Promise<Schedule[]> => {
      const token = await SecureStore.getItemAsync("accessToken");
    /*  const barber = await SecureStore.getItemAsync("barber");

      const barberParsed = barber ? JSON.parse(barber) : null;
      if (!token) return [];
      
       params: barberParsed ? { barber_id: barberParsed } : undefined,*/

      // ⚡ Llamada al endpoint /barber-schedules
      const { data } = await api.get<{ data: ApiSchedule[] }>("/barbers/schedules");

      const list = data?.data ?? [];
      return list.map(normalize);
    },
    staleTime: 60_000,
  
  });
}
