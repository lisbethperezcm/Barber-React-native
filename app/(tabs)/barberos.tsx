import { Text, View } from "react-native";

export default function Barberos() {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-foreground text-xl font-bold mb-4">Nuestros Barberos</Text>
      <Text className="text-muted-foreground">Aquí irá la lista de barberos con fotos y valoraciones.</Text>
    </View>
  );
}
