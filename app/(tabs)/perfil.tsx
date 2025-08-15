import { Text, TouchableOpacity, View } from "react-native";
import { useLogout } from "../../assets/src/features/auth/useLogout";

export default function Perfil() {
  const logout = useLogout();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Perfil</Text>

      <TouchableOpacity
        onPress={logout}
        style={{
          marginTop: 20,
          backgroundColor: "red",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white" }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
