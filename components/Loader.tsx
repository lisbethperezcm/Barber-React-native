// components/ui/Loader.tsx
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

type LoaderProps = {
  text?: string;
};

export default function Loader({ text = "Cargando..." }: LoaderProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 8, color: "#6B7280" }}>{text}</Text>
    </View>
  );
}
