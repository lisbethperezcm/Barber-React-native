// components/booking/SelectClientStep.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export type Client = {
  id: string | number;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  last_visit?: string | null;
  tags?: string[]; // ["VIP","Deuda"]
};

type Props = {
  selectedId?: string | number | null;
  onSelect: (client: Client) => void;
  fetchClients: (q: string) => Promise<Client[]>; // <- llamada al backend
};

const C = {
  bg: "#fff", text: "#111827", muted: "#6B7280", border: "#E5E7EB",
  brand: "#0F172A", card: "#F9FAFB",
};

const initials = (c: Client) => `${c.first_name?.[0] ?? ""}${c.last_name?.[0] ?? ""}`.toUpperCase() || "CL";
const shortId  = (id: string | number) => "#" + String(id).slice(-4).toUpperCase();
const last4    = (p?: string | null) => (p ? p.replace(/\D/g, "").slice(-4) : "");

export default function SelectClientStep({ selectedId, onSelect, fetchClients }: Props) {
  const [q, setQ] = useState("");
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Primer load (sin query) y debounce en cambios
  useEffect(() => {
    const run = async (term: string) => {
      setLoading(true);
      try { setData(await fetchClients(term)); }
      finally { setLoading(false); }
    };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(q.trim()), 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);

  const list = useMemo(() => data, [data]);

  const renderItem = ({ item }: { item: Client }) => {
    const selected = String(selectedId ?? "") === String(item.id);
    return (
      <Pressable
        onPress={() => onSelect(item)}
        style={({ pressed }) => [
          s.row,
          { borderColor: selected ? C.brand : C.border, backgroundColor: selected ? "#F8FAFC" : C.bg, opacity: pressed ? 0.95 : 1 },
        ]}
      >
        <View style={s.avatar}><Text style={{ color: "#fff", fontWeight: "700" }}>{initials(item)}</Text></View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={s.name}>{item.first_name} {item.last_name}</Text>
            <Text style={s.code}>{shortId(item.id)}</Text>
          </View>
          <Text style={s.meta}>{item.phone ? `Tel: •••• ${last4(item.phone)}` : item.email ?? "—"}</Text>
          {!!item.last_visit && <Text style={s.metaMuted}>Última visita: {item.last_visit}</Text>}
          {!!item.tags?.length && (
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              {item.tags.map(t => (
                <View key={t} style={[s.badge, t === "Deuda" ? s.badgeDanger : s.badgeOk]}>
                  <Text style={s.badgeTxt}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[s.radio, selected && s.radioOn]} />
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        placeholder="Buscar por nombre, teléfono, correo o ID"
        placeholderTextColor={C.muted}
        value={q}
        onChangeText={setQ}
        style={s.search}
      />

      {loading && (
        <View style={s.loading}><ActivityIndicator /><Text style={{ color: C.muted, marginLeft: 8 }}>Buscando…</Text></View>
      )}

      {!loading && list.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Sin resultados</Text>
          <Text style={s.emptyText}>Verifica el nombre o busca por teléfono/correo/ID.</Text>
        </View>
      )}

      <FlatList
        data={list}
        keyExtractor={(c) => String(c.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const s = StyleSheet.create({
  search: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text },
  loading: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  empty: { padding: 14, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.card },
  emptyTitle: { color: C.text, fontWeight: "800", marginBottom: 6 },
  emptyText: { color: C.muted },

  row: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brand, alignItems: "center", justifyContent: "center" },
  name: { color: C.text, fontWeight: "800" },
  code: { color: C.muted, fontWeight: "700" },
  meta: { color: C.text, fontWeight: "600" },
  metaMuted: { color: C.muted },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeOk: { backgroundColor: "rgba(22,163,74,0.12)", borderWidth: 1, borderColor: "rgba(22,163,74,0.35)" },
  badgeDanger: { backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.35)" },

  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border },
  radioOn: { borderColor: C.brand, backgroundColor: C.brand },
});
