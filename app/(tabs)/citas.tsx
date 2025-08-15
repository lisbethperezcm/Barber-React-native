import { useAppointments } from "@/assets/src/features/appointment/useAppointments";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
/*
export default function Citas() {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-foreground text-xl font-bold mb-4">Mis Citas</Text>
      <Text className="text-muted-foreground">Aquí irá la lista de citas.</Text>
    </View>
  );
}*/


/*
export default function TestScreen() {
  const { data, isLoading, isError, error } = useAppointments();

  console.log("isLoading:", isLoading);
  console.log("isError:", isError);
  console.log("data:", JSON.stringify(data, null, 2));
  console.log("error:", error);

  return null; // Solo logs
}
*/

export default function AppointmentsScreen() {
  const { data: appointments, isLoading, isError } = useAppointments();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando citas...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text>Error cargando citas.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={appointments}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.barber}>{item.barberName}</Text>
          <Text>{item.dateISO}</Text>
          <Text>Total: ${item.totalAmount}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  barber: { fontWeight: "bold", fontSize: 16 },
});