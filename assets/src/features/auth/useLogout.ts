import { api } from '@/assets/src/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = async () => {


    try {
      // 1. Llamar API logout 
      await api.post("/logout");
    } catch (e) {
      console.log("[logout][api] error:", e); 
    }

    // Eliminar tokens y datos del usuario
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
    await SecureStore.deleteItemAsync("role");
    // await SecureStore.deleteItemAsync("userName");
    await SecureStore.deleteItemAsync("client");
    await SecureStore.deleteItemAsync("barber");

    await queryClient.cancelQueries();

    // 2) limpiar TODO el caché de React Query (queries + mutations)
    
    queryClient.clear();
    delete api.defaults.headers.common.Authorization; 
    // Redirigir al login
    router.replace("/login");
  };

  return logout;
}

