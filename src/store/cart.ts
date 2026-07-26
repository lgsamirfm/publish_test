import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItemType = "PRODUCT" | "PATTERN";

export type CartItem = {
  type: CartItemType;
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string; // selected variant name (e.g. color), if any
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (type: CartItemType, id: string, variant?: string) => void;
  updateQty: (type: CartItemType, id: string, qty: number, variant?: string) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

function sameItem(i: CartItem, type: CartItemType, id: string, variant?: string) {
  return i.type === type && i.id === id && (i.variant ?? "") === (variant ?? "");
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => sameItem(i, item.type, item.id, item.variant));
        if (idx >= 0) {
          items[idx] = { ...items[idx], quantity: items[idx].quantity + qty };
        } else {
          items.push({ ...item, quantity: qty });
        }
        set({ items });
      },
      remove: (type, id, variant) =>
        set({ items: get().items.filter((i) => !sameItem(i, type, id, variant)) }),
      updateQty: (type, id, qty, variant) => {
        if (qty <= 0) {
          get().remove(type, id, variant);
          return;
        }
        set({
          items: get().items.map((i) =>
            sameItem(i, type, id, variant) ? { ...i, quantity: qty } : i
          ),
        });
      },
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: "baf-cart" }
  )
);
