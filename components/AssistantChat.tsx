import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}
interface AssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = {
  bg: "#ffffff",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  card: "#F9FAFB",
  brand: "#0F172A",
  brandText: "#ffffff",
};

export default function AssistantChat({ isOpen, onClose }: AssistantChatProps) {
  const { height } = useWindowDimensions();
  const PANEL_HEIGHT = Math.min(Math.max(height * 0.6, 280), 520);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "¡Hola! Soy tu asistente de Vip Stylist. ¿Te gustaría agendar una cita?", isBot: true },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);

  // --- NUEVO: controlar altura del teclado para panel absoluto
  const [kbHeight, setKbHeight] = useState(0);
  const [kbShown, setKbShown] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      setKbShown(true);
      setKbHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      setKbShown(false);
      setKbHeight(0);
    };

    const s = Keyboard.addListener(showEvt, onShow);
    const h = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const scrollRef = useRef<ScrollView>(null);

  const API_BASE = useMemo(() => {
    return Platform.select({
      android: "http://10.0.0.15:7070",
      ios: "http://10.0.0.15:7070",
      default: "http://10.0.0.15:7070",
    })!;
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const send = async () => {
    const txt = inputMessage.trim();
    if (!txt || sending) return;

    const userMsg: Message = { id: Date.now(), text: txt, isBot: false };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setSending(true);
    scrollToBottom();

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12000);

    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: txt }),
        signal: controller.signal,
      });

      const data = await resp.json().catch(() => ({}));
      const botText =
        (typeof data?.content === "string" && data.content) ||
        (data?.error ? `Error: ${data.error}` : "Respuesta vacía 🤔");

      setMessages((prev) => [...prev, { id: Date.now() + 1, isBot: true, text: botText }]);
      scrollToBottom();
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, isBot: true, text: "No pude conectar con la IA. Verifica IP/puerto/firewall." },
      ]);
      scrollToBottom();
    } finally {
      clearTimeout(t);
      setSending(false);
    }
  };

  if (!isOpen) return null;

  // Cuando el teclado está visible, movemos el panel hacia arriba
  const bottomOffset = kbShown ? kbHeight + 16 : 90;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
      style={{ flex: 1 }}  // <--- KAV a pantalla completa
      enabled
    >
      <View style={[styles.wrap, { bottom: bottomOffset }]}>
        <View style={[styles.chat, { height: PANEL_HEIGHT }]}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Asistente Vip Stylist</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>✖</Text>
            </Pressable>
          </View>

          {/* Mensajes */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            {messages.map((m) => (
              <View key={m.id} style={{ alignItems: m.isBot ? "flex-start" : "flex-end", marginBottom: 8 }}>
                <View
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: m.isBot ? COLORS.card : COLORS.brand,
                      alignSelf: m.isBot ? "flex-start" : "flex-end",
                    },
                  ]}
                >
                  <Text style={{ color: m.isBot ? COLORS.text : "#fff" }}>{m.text}</Text>
                </View>
              </View>
            ))}
            {sending && (
              <View style={{ alignItems: "flex-start" }}>
                <View style={[styles.bubble, { backgroundColor: COLORS.card }]}>
                  <Text style={{ color: COLORS.textMuted }}>Escribiendo…</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.chatInputRow}>
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder={sending ? "Enviando..." : "Escribe tu mensaje…"}
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              onFocus={scrollToBottom}
              onSubmitEditing={send}
              returnKeyType="send"
              editable={!sending}
            />
            <Pressable style={[styles.sendBtn, sending && { opacity: 0.6 }]} onPress={send} disabled={sending}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>{sending ? "…" : "➤"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ahora el panel flotante se mueve con bottom dinámico
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  chat: {
    backgroundColor: "#fff",
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  chatHeader: {
    backgroundColor: COLORS.brand,
    padding: 12,
    gap: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messages: {
    flex: 1,
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    maxWidth: 320,
  },
  chatInputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
    color: COLORS.text,
  },
  sendBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
    height: 44,
  },
});
