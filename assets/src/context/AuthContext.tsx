// context/AuthContext.tsx
import * as SecureStore from "expo-secure-store";
import React, { createContext, useEffect, useState } from "react";

type AuthCtx = {
  role: string | null;
  isBarber: boolean;
  loading: boolean;
  userName: string | null;
  setAuth: (role: string | null, userName: string | null) => Promise<void>;
};

export const AuthContext = createContext<AuthCtx>({
  role: null,
  isBarber: false,
  loading: true,
  userName: null,
  setAuth: async () => {},
});

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null);
  const [isBarber, setIsBarber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  // Carga inicial desde SecureStore (solo una vez)
  useEffect(() => {
    (async () => {
      const [r, u] = await Promise.all([
        SecureStore.getItemAsync("role"),
        SecureStore.getItemAsync("userName"),
      ]);

      const roleValue = r ?? null;
      setRole(roleValue);
      setIsBarber(roleValue === "Barbero");

      setUserName(u ?? null);
      setLoading(false);
    })();
  }, []);

  // ✅ Actualiza SecureStore + estado global
  const setAuth = async (newRole: string | null, newUserName: string | null) => {
    // role
    if (newRole) {
      await SecureStore.setItemAsync("role", newRole);
    } else {
      await SecureStore.deleteItemAsync("role");
    }
    setRole(newRole);
    setIsBarber(newRole === "Barbero");

    // userName
    if (newUserName) {
      await SecureStore.setItemAsync("userName", newUserName);
    } else {
      await SecureStore.deleteItemAsync("userName");
    }
    setUserName(newUserName ?? null);
  };

  return (
    <AuthContext.Provider value={{ role, isBarber, loading, userName, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

