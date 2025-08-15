import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export function useLogout() {
  const router = useRouter();

  const logout = async () => {
    // Eliminar tokens y datos del usuario
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");

    // Redirigir al login
    router.replace("/login");
  };

  return logout;
}
