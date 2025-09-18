// components/AppointmentRatingSection.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Si luego activas API, descomenta y ajusta tu import:
// import api from "@/assets/src/lib/http";

type Props = {
  appointmentId: number | string;
  initialRating?: number | null;          // rating existente (si ya estaba calificada)
  onSubmitted?: (rating: number) => void; // opcional: invalidar queries afuera
  lockAfterSubmit?: boolean;              // default: true (bloquea edición tras enviar)
};

export default function AppointmentRatingSection({
  appointmentId,
  initialRating = null,
  onSubmitted,
  lockAfterSubmit = true,
}: Props) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [showModal, setShowModal] = useState(false);
  const [locked, setLocked] = useState<boolean>(!!initialRating); // 🔒 comienza bloqueado si ya había rating

  // Si el padre cambia el initialRating (por refetch), sincronizamos:
  useEffect(() => {
    setRating(initialRating ?? null);
    setLocked(!!initialRating);
  }, [initialRating]);

  const label = rating ? `${rating} ${rating === 1 ? "estrella" : "estrellas"}` : "Sin calificación";

  return (
    <>
      {/* ===== Fila estilo Uber (Calificación) ===== */}
      <View style={S.itemRow}>
        <View style={S.itemLeftIconWrap}>
          {/* ✅ Ícono cambia: outline gris normalmente, estrella rellena negra cuando quede calificado */}
          <Ionicons
            name={locked ? "star" : "star-outline"}
            size={20}
            color={locked ? C.text /* negro */ : C.textMuted /* gris */}
          />
        </View>

        <View style={S.itemTextCol}>
          <Text style={S.itemTitle}>Calificación</Text>
          <Text style={S.itemSubtitle}>{label}</Text>
        </View>

        {/* ✅ Botón: activo para calificar/editar; inactivo y “Calificado” cuando esté bloqueado */}
        <TouchableOpacity
          style={[S.itemActionBtn, locked && S.itemActionBtnDisabled]}
          onPress={() => !locked && setShowModal(true)}
          activeOpacity={locked ? 1 : 0.9}
          disabled={locked}
        >
          <Text style={[S.itemActionText, locked && S.itemActionTextDisabled]}>
            {locked ? "Calificado" : rating ? "Editar" : "Calificar"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== Modal ===== */}
      <FeedbackModal
        visible={showModal}
        appointmentId={appointmentId}
        defaultRating={rating ?? 0}
        onClose={() => setShowModal(false)}
        onSubmitted={(newRating) => {
          setRating(newRating);
          onSubmitted?.(newRating);
          if (lockAfterSubmit) setLocked(true); // 🔒 bloquea después de enviar
          setShowModal(false);
        }}
      />
    </>
  );
}

/* =================== Modal interno =================== */
type ModalProps = {
  visible: boolean;
  appointmentId: number | string;
  defaultRating?: number;
  onClose: () => void;
  onSubmitted: (rating: number) => void;
};

function FeedbackModal({
  visible,
  appointmentId,
  defaultRating = 0,
  onClose,
  onSubmitted,
}: ModalProps) {
  const [rating, setRating] = useState<number>(defaultRating);
  const [comment, setComment] = useState<string>("");
  const [sending, setSending] = useState(false);

  // Sincroniza si cambia defaultRating al reabrir (caso raro)
  useEffect(() => {
    setRating(defaultRating);
  }, [defaultRating]);

  const labels = useMemo(() => ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"], []);
  const currentLabel = rating > 0 ? labels[rating - 1] : "";
  const canSubmit = rating > 0 && !sending;

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert("Calificación requerida", "Selecciona una calificación para continuar.");
      return;
    }

    try {
      setSending(true);

      // ===== Llamada a tu API (DEJADA COMENTADA) =====
      // await api.post(`/appointments/${appointmentId}/review`, {
      //   rating,
      //   comment: comment.trim() || null,
      // });
      // ===============================================

      onSubmitted(rating);
      Alert.alert("¡Gracias!", "Tu opinión fue registrada.");
      setComment("");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Ocurrió un error al enviar tu opinión.";
      Alert.alert("Error", msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={S.backdrop}>
        <View style={S.card}>
          {/* Cerrar */}
          <TouchableOpacity style={S.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>

          <Text style={S.title}>¿Cómo fue tu experiencia?</Text>
          <Text style={S.subtitle}>Tu opinión nos ayuda a mejorar</Text>

          <Text style={S.sectionLabel}>Califica nuestro servicio</Text>

          {/* Estrellas (en el modal siguen siendo ámbar cuando están activas) */}
          <View style={S.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => {
              const n = i + 1;
              const active = n <= rating;
              return (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={8} style={S.starHit}>
                  <Ionicons
                    name={active ? "star" : "star-outline"}
                    size={28}
                    color={active ? C.star : C.starMuted}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={S.ratingText}>{currentLabel || " "}</Text>

          {/* Comentarios */}
          <View style={{ alignSelf: "stretch", marginTop: 16 }}>
            <Text style={S.commentLabel}>Comentarios adicionales (opcional)</Text>
            <TextInput
              style={S.textarea}
              multiline
              numberOfLines={4}
              placeholder="Cuéntanos más sobre tu experiencia..."
              placeholderTextColor={C.textMuted}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* Enviar */}
          <TouchableOpacity
            style={[S.submitBtn, !canSubmit && S.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={canSubmit ? 0.9 : 1}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={S.submitText}>Enviar Opinión</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* =================== Estilos/tema =================== */
const C = {
  text: "#0F172A",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  card: "#FFFFFF",
  brand: "#0F172A",
  bgDim: "rgba(0,0,0,0.35)",
  star: "#FBBF24",
  starMuted: "#D1D5DB",
};

const S = StyleSheet.create({
  // Fila
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  itemLeftIconWrap: { width: 28, alignItems: "center", marginRight: 12 },
  itemTextCol: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "700", color: C.text },
  itemSubtitle: { fontSize: 13, color: C.textMuted, marginTop: 2 },

  // Botón activo/inactivo
  itemActionBtn: {
    backgroundColor: "#2B2F37",
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  itemActionBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  itemActionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  itemActionTextDisabled: {
    color: C.textMuted,
    fontWeight: "700",
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: C.bgDim,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: C.text, textAlign: "center", marginTop: 6 },
  subtitle: { fontSize: 13, color: C.textMuted, textAlign: "center", marginTop: 4, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: C.text, textAlign: "center", marginBottom: 10 },
  starsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  starHit: { padding: 6 },
  ratingText: { textAlign: "center", color: C.textMuted, fontSize: 14, marginTop: 6 },
  commentLabel: { fontSize: 13, color: C.text, fontWeight: "700", marginBottom: 8, marginLeft: 4 },
  textarea: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    color: C.text,
    backgroundColor: "#FFFFFF",
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: C.brand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  submitBtnDisabled: { backgroundColor: "#E5E7EB" },
  submitText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});
