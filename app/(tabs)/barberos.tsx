// app/(tabs)/BarberoStep.tsx
import { useBarbers } from "@/assets/src/features/barber/useBarbers";
import React from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


/*
type Barber = {
  id: number;
  firstName: string;
  lastName: string;
  rating: number; // ej: 4.8
};*/
/*
const MOCK_BARBERS: Barber[] = [
  { id: 1, firstName: "Juan", lastName: "Pérez", rating: 4.8 },
  { id: 2, firstName: "Jhonny", lastName: "Bravo", rating: 4.9 },
  { id: 3, firstName: "Michael", lastName: "Benítez", rating: 4.6 },
  { id: 4, firstName: "Julio", lastName: "Damirón", rating: 4.7 },
];*/

export default function BarberoStep({
  value,
  onChange,
}: {
  value?: number | null; // id seleccionado inicial
  onChange?: (barberId: number) => void;
}) {
  const [selectedId, setSelectedId] = React.useState<number | null>(
    value ?? null
  );

  const select = (id: number) => {
    setSelectedId(id);
    onChange?.(id);
  };

  const {data, isLoading, error, isFetching, refetch } = useBarbers();
 const isRefreshing = !isLoading && isFetching;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>Barberos</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => select(item.id)}
              style={[
                styles.card,
                selected && styles.cardSelected,
                selected && { borderColor: COLORS.brand, borderWidth: 2 },
              ]}
            >
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(item.firstName, item.lastName)}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.firstName} {item.lastName}
                </Text>

               {/* Rating 
               <View style={styles.ratingRow}>
                  <Ionicons
                    name="star"
                    size={14}
                    color={COLORS.amber}
                    style={{ marginRight: 4 }}
                  />
                 <Text style={styles.ratingText}>{item.rating.toFixed(1) ?? null}</Text> 
                </View>
                */}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

function getInitials(first: string, last: string) {
  const f = (first || "").trim().charAt(0).toUpperCase();
  const l = (last || "").trim().charAt(0).toUpperCase();
  return `${f}${l}`;
}

const COLORS = {
  bg: "#F7F7F8",
  text: "#0F172A",
  border: "#E5E7EB",
  brand: "#0F172A",
  cardBg: "#FFFFFF",
  cardSelectedBg: "#F3F4F6",
  amber: "#F59E0B",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: COLORS.cardSelectedBg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#64748B",
  },
  info: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
});
