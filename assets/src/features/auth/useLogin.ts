import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../lib/api";

type LoginPayload = { email: string; password: string };
type LoginResponse = {
  token: string; access_token: string; refreshToken?: string 
};


export function useLogin() {
   const { setAuth } = useContext(AuthContext);
  return useMutation<LoginResponse, Error, LoginPayload>({
     
    mutationFn: async ({ email, password }) => {
      const { data } = await api.post("/login", { email, password });

       const token = data?.access_token;
      const type = data?.token_type ?? "Bearer";
      const clientId = data?.user.client_id;
      const barberId = data?.user.barber_id;
      const userName = data?.user.full_name;

      if (!token) throw new Error("No llegó access_token en la respuesta.");

      await SecureStore.setItemAsync("accessToken", token);
      await SecureStore.setItemAsync("tokenType", type);
      await SecureStore.setItemAsync("role", JSON.stringify(data.user.role));
      await setAuth(data.user.role, userName);

     if (clientId) await SecureStore.setItemAsync("client",JSON.stringify(clientId));
     if (barberId) await SecureStore.setItemAsync("barber", JSON.stringify(barberId));
     if (userName) await SecureStore.setItemAsync("userName", userName);

     console.log("UserName in useLogin:", userName);
      return data;
    },
  });
}
