import { AuthContext } from "@/assets/src/context/AuthContext";
import BarberDashboard from "@/components/BarberDashboard";
import ClientDashboard from "@/components/ClientDashboard";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import AssistantChat from "../../components/AssistantChat";



const COLORS = {
  bg: "#ffffff",
  text: "#111827",          // gray-900
  textMuted: "#6B7280",     // gray-500/600
  border: "#E5E7EB",        // gray-200
  card: "#F9FAFB",          // gray-50
  brand: "#0F172A",         // slate-900 (botón principal)
  brandText: "#ffffff",
  badge: "#EF4444",         // red-500
};




export default function Dashboard() {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);

     const { isBarber, role, loading } = useContext(AuthContext);

     console.log(isBarber,role);
if (!role) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
 

   
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />

   

     
      {isBarber ? <BarberDashboard styles={styles} /> : <ClientDashboard styles={styles} />}
      
   
    
      {/* Botón flotante Chat */}
      <Pressable style={styles.fab} onPress={() => setIsChatOpen((v) => !v)}>
        <Text style={{ color: "#fff", fontSize: 18 }}>{isChatOpen ? "✖" : "💬"}</Text>
      </Pressable>

      <AssistantChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </View>
  );
}



const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  brand: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  bellBtn: { padding: 6 },
  badge: {
    position: "absolute", top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.badge,
    alignItems: "center", justifyContent: "center",
  },

  helloRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.text, alignItems: "center", justifyContent: "center" },
  hello: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  sub: { color: COLORS.textMuted, marginTop: 2 },

  cta: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 16 },
  ctaText: { color: COLORS.brandText, fontWeight: "700", fontSize: 16 },

  card: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  cardTitle: { color: COLORS.text, fontWeight: "700" },
  apptRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  circleAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.text, alignItems: "center", justifyContent: "center" },
  apptName: { color: COLORS.text, fontWeight: "700" },
  apptMeta: { color: COLORS.text, fontWeight: "600" },
  apptMuted: { color: COLORS.textMuted },
  apptAmount: { color: COLORS.text, fontWeight: "800", fontSize: 16 },

  sectionTitle: { color: COLORS.text, fontWeight: "700", marginBottom: 10, marginTop: 6 },
  quickRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  quickItem: {
    flex: 1, backgroundColor: "#fff", borderColor: COLORS.border, borderWidth: 1,
    borderRadius: 14, paddingVertical: 16, alignItems: "center", gap: 6,
  },
  quickText: { color: COLORS.text, fontWeight: "600" },

  banner: { width: 280, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, padding: 14 },
  bannerIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.text, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  bannerTitle: { color: COLORS.text, fontWeight: "700", marginBottom: 4 },
  bannerText: { color: COLORS.textMuted },

  fab: {
    position: "absolute", right: 16, bottom: 90, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.brand, alignItems: "center", justifyContent: "center", elevation: 4,
  },
});
