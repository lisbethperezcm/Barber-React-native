// hooks/useBarberDispatches.ts
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { api } from "../../lib/api";

type ApiProduct = {
  product_name: string;
  quantity: number;
  unit_cost: string;
  subtotal: string;
};

type ApiDispatch = {
  id: number;
  barber_name: string;
  dispatch_date: string; // "2025-04-03"
  status: string;
  total: string;
  products: ApiProduct[];
};

export type Dispatch = {
  id: number;
  barberName: string;
  dateISO: string;
  status: string;
  totalAmount: number;
  products: {
    productName: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }[];
  productSummary: string;
};

function normalize(d: ApiDispatch): Dispatch {
  const products = (d.products ?? []).map((p) => ({
    productName: p.product_name,
    quantity: Number(p.quantity) || 0,
    unitCost: Number(p.unit_cost) || 0,
    subtotal: Number(p.subtotal) || 0,
  }));

  const names = products.map((p) => p.productName);
  const productSummary =
    names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} (+${names.length - 2})`;

  return {
    id: d.id,
    barberName: d.barber_name,
    dateISO: d.dispatch_date,
    status: d.status,
    totalAmount: Number(d.total) || 0,
    products,
    productSummary,
  };
}

export function useBarberDispatches() {

  return useQuery({
    queryKey: ["dispatches", "barber"],
    queryFn: async (): Promise<Dispatch[]> => {
      const token = await SecureStore.getItemAsync("accessToken");
      const barber = await SecureStore.getItemAsync("barber");

      const barberParsed = barber ? JSON.parse(barber) : null;
      if (!token) return [];

      // ✅ Endpoint actualizado
      const { data } = await api.get<{ data: ApiDispatch[] }>("/barber-dispatch/", {
      //  params: barberParsed ? { barber_id: barberParsed } : undefined,
      });

      const list = data?.data ?? [];
      return list.map(normalize);
    },
    staleTime: 60_000,
  });
}
