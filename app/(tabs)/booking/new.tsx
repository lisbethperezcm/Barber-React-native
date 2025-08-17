// app/(tabs)/citas/new.tsx  (o app/booking/new.tsx si esa es tu ruta)
import { useBarbers } from "@/assets/src/features/barber/useBarbers";
import BookingFlow from "@/components/BookingFlow.native"; // importa sin .native
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";

export default function NewBookingScreen() {
  const router = useRouter();

  // estado del flujo
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  // datos de API
  const { data: barbersApi, isLoading: loadingBarbers } = useBarbers();


  // adaptar al formato que consume BookingFlow
  const barbers = useMemo(
    () => (barbersApi ?? []).map(b => ({ id: b.id, name: b.name })),  // rating opcional
    [barbersApi]
  );

  return (
    <>
      <Stack.Screen options={{ title: "Nueva reserva" }} />
      <BookingFlow
        step={step}
        setStep={setStep}
        selectedServices={selectedServices}
        setSelectedServices={setSelectedServices}
        selectedBarber={selectedBarber}
        setSelectedBarber={setSelectedBarber}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTimeSlot={selectedTimeSlot}
        setSelectedTimeSlot={setSelectedTimeSlot}
        onClose={() => router.back()}

        // Enviar datos obtenido de la api
        barbers={barbers}
        loading={{ barbers: loadingBarbers }}
      />
    </>
  );
}
