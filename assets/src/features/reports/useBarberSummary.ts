// assets/src/features/reports/useBarberSummary.ts
import { api } from "@/assets/src/lib/api";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import React from "react";

const DEBUG_SUMMARY = true; // <- ponlo en false cuando verifiques

export type NextAppointment = {
  id: number;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:mm:ss
  end_time: string;    // HH:mm:ss
  client: string;
  services: string[];
  total: number;
};

export type BarberSummary = {
  estimated_income: number;
  appointments_today: number;
  completed: number;
  pending: number;
  next_appointments: NextAppointment[];
};

type RawResponse = any;

/* ---------------- utils ---------------- */
function coerceBarberId(raw: string | null): number | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : null;
    }
    if (v && typeof v === "object") {
      const n = v.id ?? v.barber_id ?? v.barberId ?? null;
      if (typeof n === "number") return n;
      if (typeof n === "string") {
        const p = parseInt(n, 10);
        return Number.isFinite(p) ? p : null;
      }
    }
  } catch {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function num(...cands: any[]): number {
  for (const c of cands) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalize(payload: RawResponse): BarberSummary {
  // Laravel a veces envuelve en { headers, original, exception }
  const src = payload?.original ?? payload ?? {};

  // Intenta distintas rutas donde pueden venir los totales
  // completed / pending:
  const completed = num(
    src.completed,
    src.completed_today,
    src.today_completed,
    src.done,
    src.finished,
    src?.status_counts?.completed,
    src?.status?.completed,
    src?.counts?.completed,
    src?.stats?.completed,
    src?.stats?.today?.completed
  );

  const pending = num(
    src.pending,
    src.pending_today,
    src.today_pending,
    src.remaining,
    src.waiting,
    src?.status_counts?.pending,
    src?.status?.pending,
    src?.counts?.pending,
    src?.stats?.pending,
    src?.stats?.today?.pending
  );

  const appointments_today = num(
    src.appointments_today,
    src.today,
    src.count_today,
    src?.stats?.today?.total
  );

  const estimated_income = num(
    src.estimated_income,
    src.estimated,
    src.total_estimated,
    src?.stats?.estimated_income
  );

  // Lista de próximas citas
  const baseList = (src.next_appointments ?? src.next ?? []) as any[];
  const list = Array.isArray(baseList) ? baseList : [];

  const next_appointments: NextAppointment[] = list.map((a: any) => ({
    id: num(a.id),
    date: a.date ?? a.appointment_date ?? "",
    start_time: a.start_time ?? a.start ?? a.from_time ?? "",
    end_time: a.end_time ?? a.end ?? a.to_time ?? "",
    client: a.client ?? a.client_name ?? a.customer ?? "",
    services: Array.isArray(a.services)
      ? a.services.map((s: any) => (typeof s === "string" ? s : s?.name)).filter(Boolean)
      : [],
    total: num(a.total, a.amount, a.price),
  }));

  const normalized: BarberSummary = {
    estimated_income,
    appointments_today,
    completed,
    pending,
    next_appointments,
  };

  if (DEBUG_SUMMARY) {
    // Evita logs enormes
    const preview = (() => {
      try {
        const flat = JSON.parse(JSON.stringify(src));
        if (Array.isArray(flat?.next_appointments) && flat.next_appointments.length > 5) {
          flat.next_appointments = flat.next_appointments.slice(0, 5);
        }
        return flat;
      } catch { return src; }
    })();
    console.log("[BarberSummary][raw src]:", preview);
    console.log("[BarberSummary][normalized]:", normalized);
  }

  return normalized;
}

/* ---------------- hook ---------------- */
export function useBarberSummary(enabled = true) {
  const [barberId, setBarberId] = React.useState<number | null>(null);

  React.useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync("barber"),
      SecureStore.getItemAsync("barber_id"),
      SecureStore.getItemAsync("barberId"),
    ]).then(([a, b, c]) => {
      setBarberId(coerceBarberId(a) ?? coerceBarberId(b) ?? coerceBarberId(c));
    });
  }, []);

  return useQuery<BarberSummary>({
    queryKey: ["barber-summary", barberId],
    enabled: enabled && barberId !== null,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await api.get<RawResponse>(`/reports/barber-summary/${barberId}`);
      // IMPORTANTE: algunas APIs devuelven {data: {...}} dentro de data; maneja eso también
      const wrapped = (data && typeof data === "object" && "data" in data && !("original" in data))
        ? (data as any).data
        : data;
      return normalize(wrapped);
    },
  });
}
