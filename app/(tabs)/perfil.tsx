import { Text, TouchableOpacity, View } from "react-native";
import { useLogout } from "../../assets/src/features/auth/useLogout";


export default function Perfil() {
  const logout = useLogout();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Perfil</Text>

      <TouchableOpacity
        onPress={logout}
        style={{
          marginTop: 20,
          backgroundColor: "red",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white" }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

/*
// app/(tabs)/SlotsTest.tsx
import { useAvailableSlots } from "@/assets/src/features/barber/useAvailableSlots"; // ajusta la ruta si es necesario
import React, { useEffect } from "react";
import { Text, View } from "react-native";

export default function SlotsTest() {
  const { data: slots = [], isLoading, error } = useAvailableSlots({
    barberId: 6,
    date: "2025-08-12",
    duration: 120,
  });

  useEffect(() => {
    console.log("slots:", JSON.stringify(slots, null, 2));
  }, [slots]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {isLoading && <Text>Cargando slots...</Text>}
      {error && <Text>Error cargando slots</Text>}
      {!isLoading && !error && <Text>Revisa los logs en la consola 📜</Text>}
    </View>
  );
}
*/