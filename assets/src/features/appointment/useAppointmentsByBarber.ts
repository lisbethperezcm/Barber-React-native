// hooks/useAppointments.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

type ApiService = { name: string; price: number; duration: number };
type ApiAppointment = {
  id: number;
  client_id: number;
  client_name: string;
  barber_name: string;
  appointment_date: string; // "2025-08-05"
  start_time: string;       // ISO
  end_time: string;         // ISO
  status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  services: ApiService[];
};

export type Appointment = {
  id: number;
  clientId: number;
  clientName: string;
  barberName: string;
  dateISO: string;     // appointment_date (si necesitas)
  startISO: string;    // start_time
  endISO: string;      // end_time
  status: string;
  createdAtISO: string;
  updatedAtISO: string;
  totalAmount: number;
  totalDurationMin: number;
  services: { name: string; price: number; duration: number }[];
  serviceSummary: string; // "Corte, Afeitado (+1)"
};


function normalize(a: ApiAppointment): Appointment {
  const totalAmount = (a.services ?? []).reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  const totalDurationMin = (a.services ?? []).reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  const names = (a.services ?? []).map((s) => s.name);
  const serviceSummary =
    names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} (+${names.length - 2})`;

  return {
    id: a.id,
    clientId: a.client_id,
    clientName: a.client_name,
    barberName: a.barber_name,
    dateISO: a.appointment_date,
    startISO: a.start_time,
    endISO: a.end_time,
    status: a.status,
    createdAtISO: a.created_at,
    updatedAtISO: a.updated_at,
    totalAmount,
    totalDurationMin,
    services: a.services?.map((s) => ({
      name: s.name,
      price: Number(s.price) || 0,
      duration: Number(s.duration) || 0,
    })) ?? [],
    serviceSummary,
  };
}


export function useAppointmentsByBarber(opts: { enabled?: boolean } = {}) {
      const { enabled = false } = opts;

  return useQuery({
    queryKey: ["appointments", "byBarber"],
    queryFn: async (): Promise<Appointment[]> => {
      const token = await SecureStore.getItemAsync("accessToken");
      const barber = await SecureStore.getItemAsync("barber");
    //  console.log("🔎 Request GET /clients/appointments", client);

      const barberParsed = barber ? JSON.parse(barber) : null;
      if (!token) return [];
      console.log(barber);

      const { data } = await api.get<{ data: ApiAppointment[] }>("/barbers-appointments", {
        params: barberParsed ? { barber_id: barberParsed } : undefined,
      });
      const list = data?.data ?? [];
      return list.map(normalize);
    },
    staleTime: 60_000,
    enabled
  });
}
