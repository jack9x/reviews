import { createContext, useContext } from "react";

interface ShopContextType {
  shopDomain: string;
}

export const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function useShopDomain() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShopDomain must be used within a ShopProvider");
  }
  return context.shopDomain;
}
