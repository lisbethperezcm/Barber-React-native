// AssistantChat.tsx
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

// Hooks del backend (tu lógica existente)
import { useCreateAppointment } from "@/assets/src/features/appointment/useCreateAppointment";
import { useAvailableSlots } from "@/assets/src/features/barber/useAvailableSlots";
import { useBarbers } from "@/assets/src/features/barber/useBarbers";
import { useServices } from "@/assets/src/features/service/useServices";

interface Message { id: number; text: string; isBot: boolean; }
interface AssistantChatProps { isOpen: boolean; onClose: () => void; }

type Step = "intro" | "selectServices" | "selectBarber" | "pickDate" | "viewSlots" | "confirm" | "done";
type Slot = { start_time: string; end_time: string };

interface BookingCtx {
  service_ids: number[];
  total_duration: number; // min
  barber_id?: number;
  appointment_date?: string; // YYYY-MM-DD
  slots?: Slot[];
  chosen_slot?: Slot;
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

// -------- Helpers mínimos --------
const dlog = (...a: any[]) => console.log("[AssistantChat]", ...a);

function withSeconds(t?: string) {
  if (!t) return t as any;
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}:00`;
  return t;
}
const parseOptionNumber = (raw: string) => { const m = raw.trim().match(/^(\d{1,2})$/); return m ? Number(m[1]) : undefined; };
const isValidISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function AssistantChat({ isOpen, onClose }: AssistantChatProps) {
  const { height } = useWindowDimensions();
  const PANEL_HEIGHT = Math.min(Math.max(height * 0.6, 280), 520);

  // Mensajes
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "¡Hola! Soy tu asistente de Vip Stylist.", isBot: true },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Flujo + contexto
  const [step, setStep] = useState<Step>("intro");
  const [ctx, setCtx] = useState<BookingCtx>({ service_ids: [], total_duration: 0 });

  // Flags para listar una sola vez
  const servicesListed = useRef(false);
  const barbersListed = useRef(false);

  // Teclado
  const [kbHeight, setKbHeight] = useState(0);
  const [kbShown, setKbShown] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e: any) => { setKbShown(true); setKbHeight(e.endCoordinates?.height ?? 0); };
    const onHide = () => { setKbShown(false); setKbHeight(0); };
    const s = Keyboard.addListener(showEvt, onShow);
    const h = Keyboard.addListener(hideEvt, onHide);
    return () => { s.remove(); h.remove(); };
  }, []);

  const scrollRef = useRef<ScrollView>(null);
  const scrollToBottom = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  // === BASE QUE SÍ TE FUNCIONA (Railway) ===
  const API_BASE = useMemo(
    () =>
      Platform.select({
        android: "https://assistant-server-production-bc4b.up.railway.app",
        ios: "https://assistant-server-production-bc4b.up.railway.app",
        default: "https://assistant-server-production-bc4b.up.railway.app",
      })!,
    []
  );
  dlog("API_BASE", API_BASE, "Platform:", Platform.OS);

  const pushBot = (text: string) => setMessages((p) => [...p, { id: Date.now() + Math.random(), isBot: true, text }]);
  const pushUser = (text: string) => setMessages((p) => [...p, { id: Date.now() + Math.random(), isBot: false, text }]);

  // ================ IA ================
  // 🔴 Enviamos SIEMPRE con este shape:
  // {
  //   text: "<lo que toque>",
  //   meta: { step, system_hint, context: { ... } }
  // }
  async function aiSay(opts: { text: string; step: Step; system_hint: string; context?: any }) {
    // unimos el contexto del paso con TODO el estado actual de la reserva
    const fullCtx = {
      ...(opts.context || {}),
      service_ids: ctx.service_ids,
      total_duration: ctx.total_duration,
      barber_id: ctx.barber_id ?? null,
      appointment_date: ctx.appointment_date ?? null,
      chosen_slot: ctx.chosen_slot ?? null,
      slots: Array.isArray(ctx.slots) ? ctx.slots : [],
    };

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 12000);

    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: String(opts.text ?? ""),
          meta: {
            step: opts.step,
            system_hint: String(opts.system_hint || ""),
            context: fullCtx, // ← aquí van TODOS los parámetros
          },
        }),
        signal: controller.signal,
      });

      const raw = await resp.text();
      if (!resp.ok) return opts.system_hint;

      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { /* respuesta plain */ }

      const content =
        data?.content ??
        data?.message ??
        data?.reply ??
        data?.result ??
        data?.output ??
        data?.text ??
        "";

      if (typeof content === "string" && content.trim()) return content.trim();
      return opts.system_hint;
    } catch {
      return opts.system_hint;
    } finally {
      clearTimeout(to);
    }
  }
  // ====================================

  // -------- HOOKS de datos --------
  const { data: servicesApi = [], isFetching: loadingServices } = useServices({ enabled: true });
  const services = useMemo(
    () =>
      Array.isArray(servicesApi)
        ? servicesApi.map((s: any) => ({ id: s.id, name: s.name, durationMin: s.durationMin ?? s.duration_minutes ?? 0 }))
        : [],
    [servicesApi]
  );

  const { data: barbersApi = [], isFetching: loadingBarbers } = useBarbers({ enabled: step === "selectBarber" });
  const barbers = useMemo(
    () =>
      Array.isArray(barbersApi)
        ? barbersApi.map((b: any) => ({ id: b.id, name: b.name, rating: b.rating }))
        : [],
    [barbersApi]
  );

  const enableSlotsQuery = Boolean(ctx.appointment_date && ctx.total_duration && ctx.barber_id);
  const { data: slotsApi = [], refetch: refetchSlots } = useAvailableSlots(
    { barberId: ctx.barber_id, date: ctx.appointment_date, duration: ctx.total_duration },
    { enabled: enableSlotsQuery }
  );
  const slotsFromHook: Slot[] = useMemo(
    () =>
      Array.isArray(slotsApi)
        ? slotsApi.map((s: any) => ({
            start_time: withSeconds(s.startISO ?? s.start_time ?? s.start ?? ""),
            end_time: withSeconds(s.endISO ?? s.end_time ?? s.end ?? ""),
          }))
        : [],
    [slotsApi]
  );

  const { createAppointment } = useCreateAppointment();

  // ---- Logs de hooks ----
  useEffect(() => { dlog("hook: services", { loadingServices, count: services.length }); }, [loadingServices, services.length]);
  useEffect(() => { dlog("hook: barbers", { enabled: step === "selectBarber", loadingBarbers, count: barbers.length }); }, [step, loadingBarbers, barbers.length]);
  useEffect(() => { dlog("hook: slots", { enableSlotsQuery, date: ctx.appointment_date, duration: ctx.total_duration, barber_id: ctx.barber_id, count: slotsFromHook.length }); }, [enableSlotsQuery, ctx, slotsFromHook.length]);

  // ---- Efectos de arranque/listas ----
  useEffect(() => {
    if (step !== "intro") return;
    (async () => {
      const txt = await aiSay({
        text: "",
        step: "intro",
        system_hint: "¿Te gustaría agendar una cita ahora? Responde “sí” para continuar o “no” para salir.",
      });
      pushBot(txt);
    })();
  }, [step]);

  useEffect(() => {
    if (step !== "selectServices" || servicesListed.current || loadingServices) return;
    if (services.length) {
      const list = services.slice(0, 12);
      const lines = list.map((s, i) => `${i + 1}) ${s.name} — ${s.durationMin} min (id:${s.id})`).join("\n");
      pushBot(`Servicios disponibles:\n${lines}\n\nResponde con los **IDs o los números** de la lista (ej.: "1, 3" o "5, 7").`);
    } else {
      pushBot("Por ahora no hay servicios disponibles.");
    }
    servicesListed.current = true;
  }, [step, loadingServices, services]);

  useEffect(() => {
    if (step !== "selectBarber" || barbersListed.current || loadingBarbers) return;
    if (barbers.length) {
      const lines = barbers.slice(0, 9).map((b, i) => `${i + 1}) ${b.name} (id:${b.id})`).join("\n");
      pushBot(`Barberos disponibles:\n${lines}\n\nResponde con el número de tu preferencia.`);
    } else {
      pushBot("No encontré barberos disponibles ahora mismo.");
    }
    barbersListed.current = true;
  }, [step, loadingBarbers, barbers]);

  // -------- Handlers por paso --------
  async function handleIntro(userText: string) {
    const yes = /\b(s[ií]|si|yes|ok|claro|dale|va)\b/i.test(userText);
    const no  = /\b(no|luego|despu[eé]s|otro d[ií]a)\b/i.test(userText);
    if (no) { pushBot("Perfecto. Cuando quieras retomamos."); return; }
    if (!yes) { pushBot("¿Deseas agendar ahora? Responde “sí” para continuar."); return; }

    setStep("selectServices");
    servicesListed.current = false;
    barbersListed.current = false;

    const msg = await aiSay({
      text: userText,
      step: "selectServices",
      system_hint: "Elige uno o más servicios por número o por ID (ej.: 1, 3).",
    });
    pushBot(msg);
  }

  async function handleSelectServices(userText: string) {
    const display = services.slice(0, 12);
    const indexToId = (n: number) => display[n - 1]?.id;

    const tokens = userText.split(/[,\s]+/).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0);
    if (!tokens.length) { pushBot("Indica los servicios por número o ID. Ej.: 1, 3"); return; }

    const ids: number[] = [];
    for (const n of tokens) {
      if (services.some((s) => s.id === n)) ids.push(n);
      else { const maybeId = indexToId(n); if (maybeId) ids.push(maybeId); }
    }
    if (!ids.length) { pushBot("No reconocí esos servicios. Usa los números mostrados o los IDs."); return; }

    const duration = ids.reduce((acc, id) => acc + (services.find((s) => s.id === id)?.durationMin || 0), 0);
    setCtx((prev) => ({ ...prev, service_ids: ids, total_duration: duration }));

    setStep("selectBarber");
    barbersListed.current = false;

    const msg = await aiSay({
      text: userText,
      step: "selectBarber",
      system_hint: "Perfecto, elige un barbero escribiendo el número de la lista.",
      context: { service_count: ids.length, total_duration: duration },
    });
    pushBot(msg);
  }

  async function handleSelectBarber(userText: string) {
    const opt = parseOptionNumber(userText);
    const picked = typeof opt === "number" ? barbers[opt - 1] : undefined;
    if (!picked) { pushBot("Escribe el número del barbero que prefieras."); return; }

    setCtx((prev) => ({ ...prev, barber_id: picked.id }));
    setStep("pickDate");

    const msg = await aiSay({
      text: userText,
      step: "pickDate",
      system_hint: "Indica la fecha en formato YYYY-MM-DD (ej.: 2025-09-20).",
      context: { barber_id: picked.id, barber_name: picked.name },
    });
    pushBot(msg);
  }

  async function handlePickDate(userText: string) {
    const date = userText.trim();
    if (!isValidISODate(date)) { pushBot("Formato inválido. Usa YYYY-MM-DD (ej.: 2025-09-20)."); return; }

    const nextCtx = { ...ctx, appointment_date: date };
    setCtx(nextCtx);

    const res = await refetchSlots();
    const list: Slot[] =
      (res?.data as any[])?.length
        ? (res.data as any[]).map((s) => ({
            start_time: withSeconds(s.startISO ?? s.start_time ?? s.start ?? ""),
            end_time: withSeconds(s.endISO ?? s.end_time ?? s.end ?? ""),
          }))
        : slotsFromHook;

    if (!list || !list.length) {
      const msg = await aiSay({
        text: userText,
        step: "viewSlots",
        system_hint: "No hay horarios para esa fecha. Pide otra fecha (YYYY-MM-DD).",
        context: { date },
      });
      pushBot(msg);
      return;
    }

    setCtx({ ...nextCtx, slots: list });
    const lines = list.slice(0, 9).map((s, i) => `${i + 1}) ${s.start_time}–${s.end_time}`).join("\n");
    pushBot(`Horarios disponibles para ${date}:\n${lines}\n\nResponde con el número de tu preferencia.`);
    setStep("viewSlots");
  }

  async function handleViewSlots(userText: string) {
    const opt = parseOptionNumber(userText);
    const slot = typeof opt === "number" ? ctx.slots?.[opt - 1] : undefined;
    if (!slot) { pushBot("Elige un número de la lista."); return; }

    setCtx((prev) => ({ ...prev, chosen_slot: slot }));
    setStep("confirm");

    const msg = await aiSay({
      text: userText,
      step: "confirm",
      system_hint: "Resume la cita y pide confirmación con 'sí' o 'no'.",
      context: {
        service_count: ctx.service_ids.length,
        barber_id: ctx.barber_id,
        date: ctx.appointment_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      },
    });
    pushBot(msg);
  }

  async function handleConfirm(userText: string) {
    const ok = /\b(s[ií]|si|yes|ok|confirmo)\b/i.test(userText);
    if (!ok) {
      pushBot(await aiSay({
        text: userText,
        step: "confirm",
        system_hint: "Perfecto, no confirmo. Puedes indicar otra fecha (YYYY-MM-DD).",
      }));
      setStep("pickDate");
      return;
    }
    if (!ctx.barber_id || !ctx.appointment_date || !ctx.chosen_slot) {
      pushBot("Falta información para crear la cita. Indica una fecha (YYYY-MM-DD).");
      setStep("pickDate");
      return;
    }

    const startSec = withSeconds(ctx.chosen_slot.start_time);
    const endSec   = withSeconds(ctx.chosen_slot.end_time);

    const payload = {
      barber_id: ctx.barber_id,
      appointment_date: ctx.appointment_date,
      start_time: startSec,
      end_time: endSec,
      services: ctx.service_ids,
    };

    try {
      await createAppointment(payload as any);
      pushBot(await aiSay({
        text: userText,
        step: "done",
        system_hint: `¡Cita creada para ${ctx.appointment_date} de ${startSec} a ${endSec}! ¿Deseas algo más?`,
        context: { ...payload },
      }));
      setStep("done");
    } catch {
      pushBot(await aiSay({
        text: userText,
        step: "confirm",
        system_hint: "Hubo un problema creando la cita. Intenta nuevamente u ofrece otra fecha.",
        context: { ...payload },
      }));
      setStep("pickDate");
    }
  }

  // Router
  const handleUserInput = async (txt: string) => {
    switch (step) {
      case "intro":           await handleIntro(txt); break;
      case "selectServices":  await handleSelectServices(txt); break;
      case "selectBarber":    await handleSelectBarber(txt); break;
      case "pickDate":        await handlePickDate(txt); break;
      case "viewSlots":       await handleViewSlots(txt); break;
      case "confirm":         await handleConfirm(txt); break;
      case "done":
        pushBot(await aiSay({
          text: txt,
          step: "intro",
          system_hint: "¿Deseas agendar otra reserva? (sí/no)",
        }));
        setStep("intro");
        setCtx({ service_ids: [], total_duration: 0 });
        servicesListed.current = false;
        barbersListed.current = false;
        break;
    }
  };

  // Enviar

  const send = async () => {
    const txt = inputMessage.trim();
    if (!txt || sending) return;
    dlog("send >", txt);
    setInputMessage("");
    setSending(true);
    pushUser(txt);
    try { await handleUserInput(txt); }
    catch { pushBot("Ocurrió un error procesando tu mensaje."); }
    finally { setSending(false); scrollToBottom(); dlog("send < done"); }
  };

  if (!isOpen) return null;
  const bottomOffset = kbShown ? kbHeight + 16 : 90;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
      style={{ flex: 1 }}
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
                    { backgroundColor: m.isBot ? COLORS.card : COLORS.brand, alignSelf: m.isBot ? "flex-start" : "flex-end" },
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
  wrap: { position: "absolute", left: 16, right: 16 },
  chat: { backgroundColor: "#fff", borderColor: COLORS.border, borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  chatHeader: {
    backgroundColor: COLORS.brand,
    padding: 12,
    gap: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messages: { flex: 1 },
  bubble: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, maxWidth: 320 },
  chatInputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  input: { flex: 1, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, borderRadius: 10, height: 44, color: COLORS.text },
  sendBtn: { backgroundColor: COLORS.brand, paddingHorizontal: 16, borderRadius: 10, alignItems: "center", justifyContent: "center", minWidth: 52, height: 44 },
});
