import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../lib/api";

type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_number: string;
  address: string;
};

type RegisterResponse = {
  access_token: string;
  token_type?: string;
  user: {
    id: number;
    full_name: string;
    role: string | number;
    client_id?: number;
  };
};

export function useRegister() {
  const { setAuth } = useContext(AuthContext);

  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: async (payload) => {
      // 🔹 role_id siempre será 3
      const { data } = await api.post("/register", {
        ...payload,
        role_id: 3,
      });

      const token = data?.access_token;
      const type = data?.token_type ?? "Bearer";
      const role = data?.user?.role;
      const clientId = data?.user?.client_id;
      const userName = data?.user?.full_name;

      if (!token) throw new Error("No llegó access_token en la respuesta.");

      // Guardar en SecureStore
      await SecureStore.setItemAsync("accessToken", token);
      await SecureStore.setItemAsync("tokenType", type);
      await SecureStore.setItemAsync("role", JSON.stringify(role));
      if (clientId != null) await SecureStore.setItemAsync("client", JSON.stringify(clientId));
      if (userName) await SecureStore.setItemAsync("userName", userName);

      // Actualizar el contexto global
      await setAuth(role, userName);

      return data;
    },
  });
}
