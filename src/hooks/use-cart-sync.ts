import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
export function useCartSync() {
  const syncCart = useCartStore((state) => state.syncCart);
  useEffect(() => { syncCart(); const listener = () => document.visibilityState === "visible" && syncCart(); document.addEventListener("visibilitychange", listener); return () => document.removeEventListener("visibilitychange", listener); }, [syncCart]);
}