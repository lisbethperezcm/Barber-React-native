// assets/src/lib/secure.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const PREFIX = "insecure:";

async function isSecureAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function set(key: string, value: string) {
  const ok = await isSecureAvailable();
  try {
    if (ok) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(PREFIX + key, value);
    }
  } catch {
    await AsyncStorage.setItem(PREFIX + key, value);
  }
}

export async function get(key: string) {
  const ok = await isSecureAvailable();
  try {
    if (ok) {
      const v = await SecureStore.getItemAsync(key);
      if (v != null) return v;
      return await AsyncStorage.getItem(PREFIX + key);
    } else {
      return await AsyncStorage.getItem(PREFIX + key);
    }
  } catch {
    return await AsyncStorage.getItem(PREFIX + key);
  }
}

export async function del(key: string) {
  const ok = await isSecureAvailable();
  try {
    if (ok) {
      await SecureStore.deleteItemAsync(key);
    }
  } finally {
    await AsyncStorage.removeItem(PREFIX + key);
  }
}
