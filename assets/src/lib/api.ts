import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";


// Crear cliente Axios
export const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});


// Interceptor para añadir token automáticamente
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
