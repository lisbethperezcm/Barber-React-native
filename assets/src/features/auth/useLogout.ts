import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export function useLogout() {
  const router = useRouter();

  const logout = async () => {
    // Eliminar tokens y datos del usuario
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
    await SecureStore.deleteItemAsync("role");
   // await SecureStore.deleteItemAsync("userName");
    await SecureStore.deleteItemAsync("client");
    await SecureStore.deleteItemAsync("barber");


    // Redirigir al login
    router.replace("/login");
  };

  return logout;
}
