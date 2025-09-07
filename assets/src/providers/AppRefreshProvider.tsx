import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useState } from "react";

type AppRefreshCtx = {
  refreshing: boolean;
  refreshApp: () => Promise<void>;
  refreshKeys: (keys: (readonly unknown[])[]) => Promise<void>;
};

const Ctx = createContext<AppRefreshCtx>({
  refreshing: false,
  refreshApp: async () => {},
  refreshKeys: async () => {},
});

export const AppRefreshProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refreshApp = useCallback(async () => {
    setRefreshing(true);
    try {
      await qc.cancelQueries();
      await qc.invalidateQueries({ predicate: () => true });
      await qc.refetchQueries({ predicate: () => true });
    } finally {
      setRefreshing(false);
    }
  }, [qc]);

  const refreshKeys = useCallback(
    async (keys: (readonly unknown[])[]) => {
      setRefreshing(true);
      try {
        await qc.cancelQueries();
        for (const k of keys) await qc.invalidateQueries({ queryKey: k });
        for (const k of keys) await qc.refetchQueries({ queryKey: k });
      } finally {
        setRefreshing(false);
      }
    },
    [qc]
  );

  return (
    <Ctx.Provider value={{ refreshing, refreshApp, refreshKeys }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAppRefresh = () => useContext(Ctx);
