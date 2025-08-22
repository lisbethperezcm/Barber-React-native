import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ClientDashboard({ styles }: { styles: any }) {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Saludo */}
      <View style={styles.helloRow}>
        <View style={styles.avatar}><Text style={{ color: "#fff", fontWeight: "700" }}>C</Text></View>
        <View>
          <Text style={styles.hello}>Hola, Carlos 👋</Text>
          <Text style={styles.sub}>¿Listo para tu próximo corte?</Text>
        </View>
      </View>

      {/* CTA principal */}
      <Pressable style={styles.cta} onPress={() => router.push("/(tabs)/booking/new")}>
        <Text style={styles.ctaText}>Reservar Cita</Text>
      </Pressable>

      {/* Próxima cita */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}><Text style={styles.cardTitle}>Próxima Cita</Text></View>
        <View style={styles.apptRow}>
          <View style={styles.circleAvatar}><Text style={{ color: "#fff", fontWeight: "700" }}>JP</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.apptName}>Juan Pérez</Text>
            <Text style={styles.apptMeta}>Mañana, 10:00 AM</Text>
            <Text style={styles.apptMuted}>Corte y barba</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.apptAmount}>$750</Text>
            <Text style={styles.apptMuted}>50 min</Text>
          </View>
        </View>
      </View>

      {/* Acceso Rápido */}
      <Text style={styles.sectionTitle}>Acceso Rápido</Text>
      <View style={styles.quickRow}>
        <Pressable style={styles.quickItem} onPress={() => router.push("/(tabs)/servicios")}>
          <Text style={{ fontSize: 22 }}>✂️</Text>
          <Text style={styles.quickText}>Servicios</Text>
        </Pressable>
        <Pressable style={styles.quickItem} onPress={() => router.push("/(tabs)/perfil")}>
          <Text style={{ fontSize: 22 }}>⭐</Text>
          <Text style={styles.quickText}>Evaluaciones</Text>
        </Pressable>
      </View>

      {/* Recomendaciones */}
      <Text style={styles.sectionTitle}>Recomendaciones para Ti</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        <View style={styles.banner}>
          <View style={styles.bannerIcon}><Text style={{ color: "#fff" }}>💬</Text></View>
          <Text style={styles.bannerTitle}>Evitar productos agresivos</Text>
          <Text style={styles.bannerText}>Después de un corte y afeitado, evita alcohol directo en la piel.</Text>
        </View>
        <View style={styles.banner}>
          <View style={styles.bannerIcon}><Text style={{ color: "#fff" }}>💧</Text></View>
          <Text style={styles.bannerTitle}>Hidratación diaria</Text>
          <Text style={styles.bannerText}>Usa crema sin fragancia en el rostro tras el afeitado.</Text>
        </View>
      </ScrollView>
    </ScrollView>
  );
}
