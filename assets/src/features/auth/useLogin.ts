import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../lib/api";

type LoginPayload = { email: string; password: string };
type LoginResponse = { access_token: string; refreshToken?: string };


export function useLogin() {
   const { setAuth } = useContext(AuthContext);
  return useMutation<LoginResponse, Error, LoginPayload>({
     
    mutationFn: async ({ email, password }) => {
      const { data } = await api.post("/login", { email, password });

       const token = data?.access_token;
      const type = data?.token_type ?? "Bearer";
      const clientId = data?.user.client_id;
      if (!token) throw new Error("No llegó access_token en la respuesta.");

      await SecureStore.setItemAsync("accessToken", token);
      await SecureStore.setItemAsync("tokenType", type);
      await SecureStore.setItemAsync("role", JSON.stringify(data.user.role));
      await setAuth(data.user.role);

     if (clientId) await SecureStore.setItemAsync("client",JSON.stringify(clientId));
    
      return data;
    },
  });
}
