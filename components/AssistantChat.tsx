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

import * as chrono from 'chrono-node';
// Hooks del backend (tu lógica existente)
import { useCreateAppointment } from "@/assets/src/features/appointment/useCreateAppointment";
import { useAvailableSlots } from "@/assets/src/features/barber/useAvailableSlots";
import { useBarbers } from "@/assets/src/features/barber/useBarbers";
import { useServices } from "@/assets/src/features/service/useServices";

interface Message { id: number; text: string; isBot: boolean; }
interface AssistantChatProps { isOpen: boolean; onClose: () => void; }

type Step = "intro" | "selectServices" | "selectBarber" | "pickDate" | "viewSlots" | "confirm" | "done";
type Slot = { start_time: string; end_time: string };

// yyyy-mm-dd en hora local (no UTC)
const toISODateLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Convierte texto tipo "mañana", "próximo martes", "12 de noviembre",
 * "12/11", "12 nov 18:30" → "YYYY-MM-DD"
 * - forwardDate:true: "martes" se interpreta hacia el futuro.
 * - refDate: por defecto ahora (puedes pasar otro para tests).
 */
const parseHumanDate = (text: string, refDate: Date = new Date()): string | null => {
  // Prueba parsing completo (fecha/hora) en español
  const dt = chrono.es.parseDate(text, refDate, { forwardDate: true });
  if (!dt) return null;
  return toISODateLocal(dt);
};

interface BookingCtx {
  // Interno para backend
  service_ids: number[];
  barber_id?: number;

  // Solo para IA
  service_names?: string[];
  barber_name?: string;

  // Comunes
  total_duration: number; // min
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

function to12h(time24: string) {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec((time24 ?? "").trim());
  if (!m) return time24;
  let h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}
function slotLabelFromRaw(raw: string) {
  const re = /^\s*(\d{1,2}:\d{2})(?::\d{2})?\s*-\s*(\d{1,2}:\d{2})(?::\d{2})?\s*$/;
  const m = re.exec(raw ?? "");
  if (!m) {
    const single = /^\s*(\d{1,2}:\d{2})(?::\d{2})?\s*$/.exec(raw ?? "");
    return single ? to12h(single[1]) : raw;
  }
  return `${to12h(m[1])} - ${to12h(m[2])}`;
}
const parseOptionNumber = (raw: string) => { const m = raw.trim().match(/^(\d{1,2})$/); return m ? Number(m[1]) : undefined; };
const isValidISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// Chip simple reutilizable
function Chip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 16,
          borderWidth: 1,
          marginRight: 8,
          marginBottom: 8,
        },
        selected
          ? { backgroundColor: COLORS.brand, borderColor: COLORS.brand }
          : { backgroundColor: "#fff", borderColor: COLORS.border },
        disabled && { opacity: 0.6 },
      ]}
    >
      <Text style={{ color: selected ? COLORS.brandText : COLORS.text, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AssistantChat({ isOpen, onClose }: AssistantChatProps) {
  const { height } = useWindowDimensions();
  const PANEL_HEIGHT = Math.min(Math.max(height * 0.6, 280), 520);

  // Mensajes
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "👋 ¡Hola! Soy tu asistente de VIP Stylist. Estoy aquí para ayudarte a reservar y gestionar tus citas fácilmente. ¿Quieres que agendemos tu próxima visita?",
      isBot: true
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Flujo + contexto
  const [step, setStep] = useState<Step>("intro");
  const [ctx, setCtx] = useState<BookingCtx>({ service_ids: [], total_duration: 0 });

  // Selección por chips (servicios)
  const [tempServiceIds, setTempServiceIds] = useState<number[]>([]);

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
  // { text, meta: { step, system_hint, context } }
  async function aiSay(opts: { text: string; step: Step; system_hint: string; context?: any }) {
    // Merge: estado actual + overrides del paso (opts.context gana)
    const fullCtx = {
      // Interno en estado (no se enviará a la IA)
      service_ids: ctx.service_ids,
      barber_id: ctx.barber_id ?? null,

      // Visibles para IA
      service_names: ctx.service_names ?? [],
      barber_name: ctx.barber_name ?? null,

      // Comunes
      total_duration: ctx.total_duration,
      appointment_date: ctx.appointment_date ?? null,
      chosen_slot: ctx.chosen_slot ?? null,
      slots: Array.isArray(ctx.slots) ? ctx.slots : [],

      ...(opts.context || {}),
    };

    // 🔒 Sanitizar: eliminar IDs antes de enviar a la IA
    const llmCtx: any = { ...fullCtx };
    delete llmCtx.service_ids;
    delete llmCtx.barber_id;

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
            context: llmCtx, // ← SOLO nombres (servicios y barbero) + resto
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

  // Precargar selección temporal de servicios cuando entras al paso
  useEffect(() => {
    if (step === "selectServices") setTempServiceIds(ctx.service_ids ?? []);
  }, [step]);

  // -------- Handlers por paso (texto) --------
  async function handleIntro(userText: string) {
    const yes = /\b(s[ií]|si|yes|ok|claro|dale|va)\b/i.test(userText);
    const no = /\b(no|luego|despu[eé]s|otro d[ií]a)\b/i.test(userText);
    if (no) { pushBot("Perfecto. Gracias por preferirnos!."); return; }
    if (!yes) { pushBot("¿Deseas agendar ahora? Responde “sí” para continuar."); return; }

    setStep("selectServices");

    const msg = await aiSay({
      text: userText,
      step: "selectServices",
      system_hint: "Selecciona tus servicios tocando los chips y luego pulsa Continuar.",
    });
    pushBot(msg);
  }

  async function handleSelectServices(userText: string) {
    // Soporte por texto (compatibilidad), ya no listamos: chips mandan.
    const display = services.slice(0, 12);
    const indexToId = (n: number) => display[n - 1]?.id;

    const tokens = userText.split(/[,\s]+/).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0);
    if (!tokens.length) { pushBot("Usa los chips para elegir servicios y pulsa Continuar."); return; }

    const ids: number[] = [];
    for (const n of tokens) {
      if (services.some((s) => s.id === n)) ids.push(n);
      else { const maybeId = indexToId(n); if (maybeId) ids.push(maybeId); }
    }
    if (!ids.length) { pushBot("No reconocí esos servicios. Toca los chips para seleccionar."); return; }

    const duration = ids.reduce((acc, id) => acc + (services.find((s) => s.id === id)?.durationMin || 0), 0);
    const names = ids.map(id => services.find(s => s.id === id)?.name).filter(Boolean) as string[];

    setCtx((prev) => ({ ...prev, service_ids: ids, service_names: names, total_duration: duration }));

    setStep("selectBarber");

    const msg = await aiSay({
      text: userText,
      step: "selectBarber",
      system_hint: "Elige un barbero tocando un chip.",
      context: { service_count: ids.length, total_duration: duration, service_names: names },
    });
    pushBot(msg);
  }

  async function handleSelectBarber(userText: string) {
    // Compatibilidad por texto (sin listado): pedir número no tiene sentido sin lista, guiamos a chips
    const opt = parseOptionNumber(userText);
    const picked = typeof opt === "number" ? barbers[opt - 1] : undefined;
    if (!picked) {
      pushBot("Toca un chip para seleccionar al barbero.");
      return;
    }

    setCtx((prev) => ({ ...prev, barber_id: picked.id, barber_name: picked.name }));
    setStep("pickDate");

    const msg = await aiSay({
      text: userText,
      step: "pickDate",
      system_hint: "Indica la fecha en para la cual quieres tu cita",
      context: { barber_name: picked.name }, // ← solo nombre para la IA
    });
    pushBot(msg);
  }

  async function handlePickDate(userText: string) {
    // 1) Intento natural-language
    const parsedHuman = parseHumanDate(userText);
    const date = parsedHuman ?? userText.trim();
    console.log(date);

    // 2) Validación final en ISO
    if (!isValidISODate(date)) {
      pushBot("No entendí la fecha. Prueba con algo como “mañana”, “próximo martes” o “2025-09-20”.");
      return;
    }

    const nextCtx = { ...ctx, appointment_date: date };
    setCtx(nextCtx);

    await new Promise((r) => setTimeout(r, 0));

    const res = await refetchSlots();
    const list: Slot[] =
      (res?.data.slots as any[])?.length
        ? (res.data.slots as any[]).map((s) => ({
          start_time: withSeconds(s.startISO ?? s.start_time ?? s.start ?? ""),
          end_time: withSeconds(s.endISO ?? s.end_time ?? s.end ?? ""),
        }))
        : slotsFromHook;

    if (!list || !list.length) {
      const msg = await aiSay({
        text: userText,
        step: "viewSlots",
        system_hint: "No hay horarios para esa fecha. Indica otra (“mañana”, “próximo viernes” o YYYY-MM-DD).",
        context: { date, barber_name: nextCtx.barber_name, service_names: nextCtx.service_names },
      });
      pushBot(msg);
      return;
    }

    setCtx({ ...nextCtx, slots: list });
    pushBot(`Horarios disponibles listos para ${date}. Toca un chip para elegir tu horario.`);
    setStep("viewSlots");
  }

  async function handleViewSlots(userText: string) {
    // Compatibilidad por texto: sin lista visible, guiamos a chips
    const opt = parseOptionNumber(userText);
    const slot = typeof opt === "number" ? ctx.slots?.[opt - 1] : undefined;
    if (!slot) { pushBot("Toca un chip para elegir el horario."); return; }

    setCtx((prev) => ({ ...prev, chosen_slot: slot }));
    setStep("confirm");

    const msg = await aiSay({
      text: userText,
      step: "confirm",
      system_hint: "Resume la cita y pide confirmación con 'sí' o 'no'.",
      context: {
        service_count: ctx.service_ids.length,
        service_names: ctx.service_names, // ← solo nombres
        barber_name: ctx.barber_name,     // ← solo nombre
        date: ctx.appointment_date,
        start_time: to12h(slot.start_time),
        end_time: to12h(slot.end_time),
      },
    });
    pushBot(msg);
  }

  async function handleConfirm(userText: string) {
    const ok = /\b(s[ií]|si|yes|ok|okay|confirmo|claro|vale|de acuerdo|correcto|afirmativo|perfecto)\b/i.test(userText);
    const no = /\b(no|nop|nunca|negativo|rechazo|cancelar|no quiero)\b/i.test(userText);

    // 1) Rechazo explícito
    if (no) {
      pushBot(await aiSay({
        text: userText,
        step: "confirm",
        system_hint: "Perfecto, no confirmo. Puedes indicar otra fecha",
      }));
      setStep("pickDate");
      return;
    }

    // 2) Respuesta ambigua (ni sí/ok ni no)
    if (!ok) {
      pushBot("No entendí tu respuesta. ¿Deseas confirmar la cita? Responde con “sí” o “no”.");
      // Nos quedamos en el paso de confirmación
      setStep("confirm");
      return;
    }

    // 3) Confirmación explícita
    if (!ctx.barber_id || !ctx.appointment_date || !ctx.chosen_slot) {
      pushBot("Falta información para crear la cita. Indica una fecha");
      setStep("pickDate");
      return;
    }

    const startSec = withSeconds(ctx.chosen_slot.start_time);
    const endSec = withSeconds(ctx.chosen_slot.end_time);

    const startSecForm = to12h(ctx.chosen_slot.start_time);
    const endSecForm = to12h(ctx.chosen_slot.end_time);

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
        system_hint: `¡Cita creada para ${ctx.appointment_date} de ${startSecForm} a ${endSecForm}! ¿Deseas algo más?`,
        context: {
          service_names: ctx.service_names,
          barber_name: ctx.barber_name,
          appointment_date: ctx.appointment_date,
          start_time: startSecForm,
          end_time: endSecForm,
        },
      }));
      setStep("done");
    } catch {
      pushBot(await aiSay({
        text: userText,
        step: "confirm",
        system_hint: "Hubo un problema creando la cita. Intenta nuevamente u ofrece otra fecha.",
        context: {
          service_names: ctx.service_names,
          barber_name: ctx.barber_name,
          appointment_date: ctx.appointment_date,
          start_time: startSecForm,
          end_time: endSecForm,
        },
      }));
      setStep("pickDate");
    }
  }

  // -------- Acciones para chips --------
  const toggleService = (id: number) => {
    setTempServiceIds((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const continueFromServicesChips = async () => {
    if (!tempServiceIds.length) {
      pushBot("Selecciona al menos un servicio.");
      return;
    }
    const duration = tempServiceIds.reduce((acc, id) => {
      const d = services.find(s => s.id === id)?.durationMin || 0;
      return acc + d;
    }, 0);

    const names = tempServiceIds.map(id => services.find(s => s.id === id)?.name).filter(Boolean) as string[];

    setCtx((prev) => ({ ...prev, service_ids: tempServiceIds, service_names: names, total_duration: duration }));
    setStep("selectBarber");

    const msg = await aiSay({
      text: "",
      step: "selectBarber",
      system_hint: "Perfecto, elige un barbero tocando un chip.",
      context: { service_count: tempServiceIds.length, total_duration: duration, service_names: names },
    });
    pushBot(msg);
  };

  const pickBarberChip = async (id: number, name?: string) => {
    setCtx((prev) => ({ ...prev, barber_id: id, barber_name: name }));
    setStep("pickDate");
    const msg = await aiSay({
      text: "",
      step: "pickDate",
      system_hint: "Indica la fecha para tu cita",
      context: { barber_name: name }, // ← solo nombre a la IA
    });
    pushBot(msg);
  };

  const pickSlotChip = async (slot: Slot) => {
    setCtx((prev) => ({ ...prev, chosen_slot: slot }));
    setStep("confirm");
    const msg = await aiSay({
      text: "",
      step: "confirm",
      system_hint: "Resume la cita y pide confirmación con 'sí' o 'no'.",
      context: {
        service_count: ctx.service_ids.length,
        service_names: ctx.service_names, // ← nombres
        barber_name: ctx.barber_name,     // ← nombre
        date: ctx.appointment_date,
        start_time: to12h(slot.start_time),
        end_time: to12h(slot.end_time),
      },
    });
    pushBot(msg);
  };

  // Router
  const handleUserInput = async (txt: string) => {
    switch (step) {
      case "intro": await handleIntro(txt); break;
      case "selectServices": await handleSelectServices(txt); break;
      case "selectBarber": await handleSelectBarber(txt); break;
      case "pickDate": await handlePickDate(txt); break;
      case "viewSlots": await handleViewSlots(txt); break;
      case "confirm": await handleConfirm(txt); break;
      case "done":
        pushBot(await aiSay({
          text: txt,
          step: "intro",
          system_hint: "¿Deseas agendar otra reserva? (sí/no)",
          context: "no indicar informacion adiccional ni solicitud",
        }));
        setStep("intro");
        setCtx({ service_ids: [], total_duration: 0 });
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

          {/* Mensajes + Chips dentro del chat */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            {/* Mensajes */}
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

            {/* Loader */}
            {sending && (
              <View style={{ alignItems: "flex-start", marginBottom: 8 }}>
                <View style={[styles.bubble, { backgroundColor: COLORS.card }]}>
                  <Text style={{ color: COLORS.textMuted }}>Escribiendo…</Text>
                </View>
              </View>
            )}

            {/* ===== Chips DENTRO del chat ===== */}

            {/* Servicios */}
            {step === "selectServices" && !!services.length && (
              <View style={{ alignItems: "flex-start", marginBottom: 8 }}>
                <View style={[styles.bubble, { backgroundColor: COLORS.card }]}>
                  <Text style={{ marginBottom: 8, color: COLORS.textMuted }}>
                    Toca para seleccionar servicios:
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {services.slice(0, 50).map(s => (
                      <Chip
                        key={s.id}
                        label={`${s.name} · ${s.durationMin}m`}
                        selected={tempServiceIds.includes(s.id)}
                        onPress={() => toggleService(s.id)}
                      />
                    ))}
                  </View>

                  <Pressable
                    onPress={continueFromServicesChips}
                    style={{
                      backgroundColor: COLORS.brand,
                      alignSelf: "flex-start",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 10,
                      marginTop: 6,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Continuar</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Barberos */}
            {step === "selectBarber" && !!barbers.length && (
              <View style={{ alignItems: "flex-start", marginBottom: 8 }}>
                <View style={[styles.bubble, { backgroundColor: COLORS.card }]}>
                  <Text style={{ marginBottom: 8, color: COLORS.textMuted }}>
                    Toca un barbero:
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {barbers.slice(0, 50).map(b => (
                      <Chip
                        key={b.id}
                        label={b.name || `Barbero ${b.id}`}
                        selected={ctx.barber_id === b.id}
                        onPress={() => pickBarberChip(b.id, b.name)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Horarios */}
            {step === "viewSlots" && Array.isArray(ctx.slots) && ctx.slots.length > 0 && (
              <View style={{ alignItems: "flex-start", marginBottom: 8 }}>
                <View style={[styles.bubble, { backgroundColor: COLORS.card }]}>
                  <Text style={{ marginBottom: 8, color: COLORS.textMuted }}>
                    Toca un horario:
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {ctx.slots.slice(0, 60).map((s, i) => (
                      <Chip
                        key={`${s.start_time}-${s.end_time}-${i}`}
                        label={`${to12h(s.start_time)}–${to12h(s.end_time)}`}
                        selected={
                          ctx.chosen_slot?.start_time === s.start_time &&
                          ctx.chosen_slot?.end_time === s.end_time
                        }
                        onPress={() => pickSlotChip(s)}
                      />
                    ))}
                  </View>
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
