import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.API_URL,
  timeout: 15000,
});

// Bearer en cada request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// (Opcional) refresh token simple
let refreshing = false;
api.interceptors.response.use(
  r => r,
  async (err) => {
    const { response, config } = err;
    if (response?.status === 401 && !config._retry) {
      if (refreshing) throw err;
      refreshing = true;
      config._retry = true;
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) throw err;
      const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      refreshing = false;
      config.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(config);
    }
    throw err;
  }
);

export default api;
