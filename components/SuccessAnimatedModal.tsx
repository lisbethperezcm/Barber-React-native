import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  title: string;          // ej: "¡Cita creada!"
  message?: string;       // ej: "Tu cita fue creada satisfactoriamente."
  durationMs?: number;    // cuánto dura la barra (default 5000)
  accentColor?: string;   // color de la barra e icono (default verde)
  emoji?: string;         // ej: "✅"
  onDone?: () => void;    // callback al terminar la animación / cierre
  showClose?: boolean;    // si quieres un botón de cerrar aparte
};

export default function SuccessAnimatedModal({
  visible,
  title,
  message,
  durationMs = 5000,
  accentColor = "#16A34A",
  emoji = "✅",
  onDone,
  showClose = false,
}: Props) {
  const [barWidth, setBarWidth] = useState(0);
  const barAnim = useRef(new Animated.Value(0)).current;

  // Reinicia y corre la animación cada vez que el modal se muestre
  useEffect(() => {
    if (!visible) return;
    // reset
    barAnim.stopAnimation();
    barAnim.setValue(0);

    // si ya tenemos el ancho, animamos hasta él; si no, se activará tras onLayout
    const run = () => {
      if (!visible) return;
      Animated.timing(barAnim, {
        toValue: barWidth,
        duration: durationMs,
        useNativeDriver: false, // width anim -> false
      }).start(({ finished }) => {
        if (finished) onDone?.();
      });
    };

    if (barWidth > 0) run();
    // si aún no hay ancho, la animación se lanzará en onLayout
  }, [visible, barWidth, durationMs, onDone, barAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDone}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { overflow: "hidden" }]}>
          {/* Barra superior */}
          <View
            style={[styles.progressTrack, { backgroundColor: `${accentColor}22` }]}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              setBarWidth(w);
              // si el modal está visible y recién tenemos ancho, arrancar anim
              if (visible) {
                barAnim.setValue(0);
                Animated.timing(barAnim, {
                  toValue: w,
                  duration: durationMs,
                  useNativeDriver: false,
                }).start(({ finished }) => {
                  if (finished) onDone?.();
                });
              }
            }}
            pointerEvents="none"
          >
            <Animated.View
              style={[
                styles.progressFill,
                { width: barAnim, backgroundColor: accentColor },
              ]}
            />
          </View>

          {/* Ícono */}
          <View style={[styles.icon, { backgroundColor: `${accentColor}1A` }]}>
            <Text style={{ fontSize: 28 }}>{emoji}</Text>
          </View>

          {/* Título y mensaje */}
          <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
          {message ? <Text style={styles.msg}>{message}</Text> : null}

          {/* (Opcional) botón cerrar manual */}
          {showClose ? (
            <Pressable onPress={onDone} style={[styles.btn, { backgroundColor: accentColor }]}>
              <Text style={styles.btnText}>Aceptar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  progressTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 6,
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  msg: {
    marginTop: 6,
    color: "#6B7280",
    textAlign: "center",
  },
  btn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
