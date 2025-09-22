// app/(tabs)/reviews.tsx
/*import { AuthContext } from "@/assets/src/context/AuthContext";
import React, { useContext } from "react";
import { ScrollView, Text, View } from "react-native";
// app/(tabs)/reviews.tsx
import BarberReviewsPanel from "@/components/BarberReviewsPanel";



export default function ReviewsScreen() {
  const { user, userRole, barberId: barberIdCtx } = useContext(AuthContext);
  const role = (userRole ?? user?.role ?? "client") as "barber" | "client";
  const barberId = Number(barberIdCtx ?? user?.barber_id ?? 0) || undefined;

  // si no es barbero, no mostramos nada (o un mensaje)
  if (role !== "barber" || !barberId) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text>Solo barberos pueden ver las evaluaciones.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <BarberReviewsPanel barberId={barberId} />
    </ScrollView>
  );
}
*/
/*import { AuthContext } from "@/assets/src/context/AuthContext";
import BarberReviewsPanel from "@/components/BarberReviewsPanel";
import React, { useContext } from "react";
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";

export default function ReviewsScreen() {
  const { loading, isBarber } = useContext(AuthContext);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isBarber) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Text>Solo barberos pueden ver las evaluaciones.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
        <BarberReviewsPanel />
      </View>
    </SafeAreaView>
  );
}
*/
import { AuthContext } from "@/assets/src/context/AuthContext";
import BarberReviewsPanel from "@/components/BarberReviewsPanel";
import React, { useContext } from "react";
import { ActivityIndicator, SafeAreaView, Text } from "react-native";

export default function ReviewsScreen() {
  const { loading, isBarber } = useContext(AuthContext);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Cargando…</Text>
      </SafeAreaView>
    );
  }

  if (!isBarber) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <Text>Solo barberos pueden ver las evaluaciones.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <BarberReviewsPanel />
    </SafeAreaView>
  );
}
