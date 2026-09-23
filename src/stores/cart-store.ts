import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storefrontApiRequest, type ShopifyProduct, type ShopifyVariant } from "@/lib/shopify";

export interface CartItem { lineId: string | null; product: ShopifyProduct; variant: ShopifyVariant; quantity: number }
interface CartState {
  items: CartItem[]; cartId: string | null; checkoutUrl: string | null; isLoading: boolean; isSyncing: boolean;
  addItem: (product: ShopifyProduct, variant: ShopifyVariant, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>; clearCart: () => void; syncCart: () => Promise<void>;
}
const CART_FIELDS = `id checkoutUrl totalQuantity lines(first:100){edges{node{id merchandise{... on ProductVariant{id}}}}}`;
const notFound = (errors: Array<{ message: string }>) => errors.some((e) => /cart not found|does not exist/i.test(e.message));
const checkoutUrl = (raw: string) => { const url = new URL(raw); url.searchParams.set("channel", "online_store"); return url.toString(); };

export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [], cartId: null, checkoutUrl: null, isLoading: false, isSyncing: false,
  clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),
  addItem: async (product, variant, quantity = 1) => {
    set({ isLoading: true });
    try {
      const state = get(); const existing = state.items.find((item) => item.variant.id === variant.id);
      if (!state.cartId) {
        const data = await storefrontApiRequest<{cartCreate:{cart:{id:string;checkoutUrl:string;lines:{edges:Array<{node:{id:string}}>} }|null;userErrors:Array<{message:string}>}}>(
          `mutation($input:CartInput!){cartCreate(input:$input){cart{${CART_FIELDS}} userErrors{message}}}`, { input: { lines: [{ quantity, merchandiseId: variant.id }] } });
        const cart = data.cartCreate.cart; const lineId = cart?.lines.edges[0]?.node.id;
        if (cart && lineId) set({ cartId: cart.id, checkoutUrl: checkoutUrl(cart.checkoutUrl), items: [{ lineId, product, variant, quantity }] });
      } else if (existing?.lineId) {
        await get().updateQuantity(variant.id, existing.quantity + quantity);
      } else {
        const data = await storefrontApiRequest<{cartLinesAdd:{cart:{lines:{edges:Array<{node:{id:string;merchandise:{id:string}}}>}};userErrors:Array<{message:string}>}}>(
          `mutation($cartId:ID!,$lines:[CartLineInput!]!){cartLinesAdd(cartId:$cartId,lines:$lines){cart{${CART_FIELDS}} userErrors{message}}}`, { cartId: state.cartId, lines: [{ quantity, merchandiseId: variant.id }] });
        if (notFound(data.cartLinesAdd.userErrors)) return get().clearCart();
        const line = data.cartLinesAdd.cart.lines.edges.find(({node}) => node.merchandise.id === variant.id);
        set({ items: [...get().items, { lineId: line?.node.id ?? null, product, variant, quantity }] });
      }
    } finally { set({ isLoading: false }); }
  },
  updateQuantity: async (variantId, quantity) => {
    if (quantity <= 0) return get().removeItem(variantId);
    const state = get(); const item = state.items.find((entry) => entry.variant.id === variantId);
    if (!state.cartId || !item?.lineId) return;
    set({ isLoading: true });
    try {
      const data = await storefrontApiRequest<{cartLinesUpdate:{userErrors:Array<{message:string}>}}>(
        `mutation($cartId:ID!,$lines:[CartLineUpdateInput!]!){cartLinesUpdate(cartId:$cartId,lines:$lines){userErrors{message}}}`, { cartId: state.cartId, lines: [{ id: item.lineId, quantity }] });
      if (notFound(data.cartLinesUpdate.userErrors)) return get().clearCart();
      set({ items: get().items.map((entry) => entry.variant.id === variantId ? { ...entry, quantity } : entry) });
    } finally { set({ isLoading: false }); }
  },
  removeItem: async (variantId) => {
    const state = get(); const item = state.items.find((entry) => entry.variant.id === variantId);
    if (!state.cartId || !item?.lineId) return;
    set({ isLoading: true });
    try {
      const data = await storefrontApiRequest<{cartLinesRemove:{userErrors:Array<{message:string}>}}>(
        `mutation($cartId:ID!,$lineIds:[ID!]!){cartLinesRemove(cartId:$cartId,lineIds:$lineIds){userErrors{message}}}`, { cartId: state.cartId, lineIds: [item.lineId] });
      if (notFound(data.cartLinesRemove.userErrors)) return get().clearCart();
      const items = get().items.filter((entry) => entry.variant.id !== variantId); items.length ? set({ items }) : get().clearCart();
    } finally { set({ isLoading: false }); }
  },
  syncCart: async () => {
    const { cartId, isSyncing } = get(); if (!cartId || isSyncing) return;
    set({ isSyncing: true });
    try { const data = await storefrontApiRequest<{cart:{totalQuantity:number}|null}>(`query($id:ID!){cart(id:$id){totalQuantity}}`, { id: cartId }); if (!data.cart || data.cart.totalQuantity === 0) get().clearCart(); }
    catch { /* Keep local state during temporary API errors. */ } finally { set({ isSyncing: false }); }
  },
}), { name: "pcvex-shopify-cart", storage: createJSONStorage(() => localStorage), partialize: ({items,cartId,checkoutUrl}) => ({items,cartId,checkoutUrl}) }));