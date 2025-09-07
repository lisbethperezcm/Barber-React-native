// app/(tabs)/Servicios.tsx
import { useServices } from "@/assets/src/features/service/useServices";
import Loader from "@/components/Loader";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
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

export default function Servicios() {
  const { data, isLoading, error, isFetching, refetch } = useServices();
  const isRefreshing = !isLoading && isFetching;
  const services = data || [];

  React.useEffect(() => {
    if (error) console.error("Error al cargar los servicios:", error);
  }, [error]);

  // ✅ Refetch al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Servicios</Text>



      {/* Lista */}
      {isLoading ? (
        <Loader text="Cargando servicios..." />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          renderItem={({ item }) => <ServiceCard item={item} />}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 24 }}>
              <Text style={styles.emptyText}>No hay servicios disponibles.</Text>
            </View>
          }
        />
      )}
    </View>


  );
}

function ServiceCard({ item }: { item: Service }) {
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
    backgroundColor: "#FFFFFF",
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
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0.5,
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
