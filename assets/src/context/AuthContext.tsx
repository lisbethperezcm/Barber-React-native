// context/AuthContext.tsx
import * as SecureStore from "expo-secure-store";
import React, { createContext, useEffect, useState } from "react";

type AuthCtx = {
  role: string | null;
  isBarber: boolean;
  loading: boolean;
  setAuth: (role: string | null) => Promise<void>;
};

export const AuthContext = createContext<AuthCtx>({
  role: null, isBarber: false, loading: true, setAuth: async () => {},
});

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null);
  const [isBarber, setIsBarber] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carga inicial desde SecureStore (solo una vez)
  useEffect(() => {
    (async () => {
      const r = await SecureStore.getItemAsync("role");
      setRole(r ?? null);
      setIsBarber((r ?? null) === "Barbero");
      setLoading(false);
    })();
  }, []);

  // ✅ Actualiza SecureStore + estado global
  const setAuth = async (newRole: string | null) => {
    if (newRole) await SecureStore.setItemAsync("role", newRole);
    else await SecureStore.deleteItemAsync("role");
    setRole(newRole);
    setIsBarber(newRole === "Barbero");
  };

  return (
    <AuthContext.Provider value={{ role, isBarber, loading, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
