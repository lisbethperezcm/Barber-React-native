// assets/src/features/appointment/useCreateAppointment.ts
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";

export type CreateAppointmentInput = {
  appointment_date: string;  // "YYYY-MM-DD"
  start_time: string;        // "HH:mm" | "HH:mm:ss"
  end_time?: string;
  barber_id: number;
  services: number[];
};

export type CreateAppointmentResponse = any; // simplificado

export function useCreateAppointment() {
  const mutation = useMutation<CreateAppointmentResponse, unknown, CreateAppointmentInput>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/appointments", payload);
      return data;
    },
  });

  return {
    createAppointment: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
