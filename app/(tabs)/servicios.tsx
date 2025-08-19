// app/(tabs)/Servicios.tsx
import { useServices } from "@/assets/src/features/service/useServices";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Service = {
  id: number;
  name: string;
  description: string;
  durationMin: number;
  price: number;
};

const MOCK_SERVICES: Service[] = [
  {
    id: 1,
    name: "Corte clásico",
    description: "Corte tradicional con tijeras y máquina",
    durationMin: 30,
    price: 500,
  },
  {
    id: 2,
    name: "Corte y Barba",
    description: "Corte completo más arreglo de barba",
    durationMin: 45,
    price: 750,
  },
  {
    id: 3,
    name: "Arreglo de Barba",
    description: "Perfilado y arreglo de barba únicamente",
    durationMin: 20,
    price: 300,
  },
  {
    id: 4,
    name: "Corte Premium",
    description: "Corte, barba, lavado y tratamiento",
    durationMin: 60,
    price: 1000,
  },
];

export default function Servicios() {

  const { data, isLoading, error, isFetching, refetch } = useServices();
  const isRefreshing = !isLoading && isFetching;

  const services = data || [];
  const [refreshing, setRefreshing] = React.useState(false);
  React.useEffect(() => {
    if (error) {
      console.error("Error al cargar los servicios:", error);
    }
  }, [error]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600); // simula fetch
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Servicios</Text>

      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => <ServiceCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 24 }}>
            <Text style={styles.emptyText}>No hay servicios disponibles.</Text>
          </View>
        }
      />
    </View>
  );
}

function ServiceCard({ item }: { item}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name="cut-outline" size={28} color="#16A34A" />
      </View>

      <View style={styles.cardLeft}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>

        <Text style={styles.duration}>{item.durationMin} min</Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.price}>RD$ {formatMoney(item.price)}</Text>
      </View>
    </View>
  );
}

function formatMoney(n: number) {
  return n.toFixed(0);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyText: {
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E9FCEB", // verde claro
    alignItems: "center",
    justifyContent: "center",
  },
  cardLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  desc: {
    color: "#6B7280",
    fontSize: 14,
  },
  duration: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 13,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 80,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
});
