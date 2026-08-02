"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
export type CartItem = {
  key: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  details?: string;
};

export type LastOrder = {
  orderId: number;
  items: Array<{ name: string; price: number; quantity: number; details?: string }>;
  total: number;
  createdAt: string;
  paymentMethod: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  notice: string;
  lastOrder: LastOrder | null;
  addItem: (item: Omit<CartItem, "key" | "quantity">) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  saveLastOrder: (order: LastOrder) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "jahez-cart-v1";
const lastOrderKey = "jahez-last-order";

function readCookie() {
  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${storageKey}=`));
  return entry ? decodeURIComponent(entry.split("=").slice(1).join("=")) : null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    let storedItems: CartItem[] = [];
    try {
      const stored = readCookie() || window.localStorage.getItem(storageKey);
      if (stored) storedItems = JSON.parse(stored);
    } catch {
      storedItems = [];
    }
    let storedOrder: LastOrder | null = null;
    try {
      const raw = window.localStorage.getItem(lastOrderKey);
      if (raw) storedOrder = JSON.parse(raw);
    } catch {
      // Ignore
    }
    queueMicrotask(() => {
      setItems(storedItems);
      if (storedOrder) setLastOrder(storedOrder);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      const serialized = JSON.stringify(items);
      document.cookie = `${storageKey}=${encodeURIComponent(
        serialized,
      )}; path=/; max-age=2592000; samesite=lax`;
      try {
        window.localStorage.setItem(storageKey, serialized);
      } catch {
        // Cookies remain the reload-safe fallback when storage is unavailable.
      }
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      notice,
      lastOrder,
      addItem: (item) => {
        setItems((current) => {
          const match = current.find(
            (entry) =>
              entry.id === item.id && entry.details === item.details,
          );
          if (match) {
            return current.map((entry) =>
              entry.key === match.key
                ? { ...entry, quantity: entry.quantity + 1 }
                : entry,
            );
          }
          return [
            ...current,
            {
              ...item,
              quantity: 1,
              key: `${item.id}-${Date.now()}-${Math.random()}`,
            },
          ];
        });
        setNotice(`تمت إضافة ${item.name} للسلة`);
        window.setTimeout(() => setNotice(""), 2200);
      },
      removeItem: (key) =>
        setItems((current) => current.filter((item) => item.key !== key)),
      updateQuantity: (key, quantity) =>
        setItems((current) =>
          quantity <= 0
            ? current.filter((item) => item.key !== key)
            : current.map((item) =>
                item.key === key
                  ? { ...item, quantity: Math.min(25, quantity) }
                  : item,
              ),
        ),
      clear: () => setItems([]),
      saveLastOrder: (order) => {
        setLastOrder(order);
        try {
          window.localStorage.setItem(lastOrderKey, JSON.stringify(order));
        } catch {
          // Ignore
        }
      },
    }),
    [items, notice, lastOrder],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
