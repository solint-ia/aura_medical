"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type Protocol } from "@/data/protocols";

export interface CartItem {
  id: string;
  name: string;
  unitPrice: number;
  vials: number;
  quantity: number;
  sessions: string;
  imagePath?: string;
  composition?: { enzyme: string; vials: number }[];
}

interface CartContextType {
  items: CartItem[];
  addToCart: (protocol: Protocol | CartItem, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "aura_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount (hydration safety for SSR)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage read errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save cart to localStorage on changes (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore localStorage write errors
    }
  }, [items, isHydrated]);

  const addToCart = (protocol: Protocol | CartItem, quantityToAdd = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === protocol.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd,
        };
        return updated;
      }

      const imagePath = `/images/${protocol.id}.png`;

      const newItem: CartItem = {
        id: protocol.id,
        name: "name" in protocol ? protocol.name : (protocol as CartItem).name,
        unitPrice: "totalPrice" in protocol ? (protocol as Protocol).totalPrice : (protocol as CartItem).unitPrice,
        vials: "composition" in protocol && Array.isArray(protocol.composition)
          ? (protocol as Protocol).composition.reduce((acc, item) => acc + item.vials, 0)
          : ("vials" in protocol ? (protocol as CartItem).vials : 4),
        quantity: quantityToAdd,
        sessions: protocol.sessions,
        imagePath,
        composition: "composition" in protocol && Array.isArray(protocol.composition)
          ? (protocol as Protocol).composition.map((c) => ({ enzyme: String(c.enzyme), vials: c.vials }))
          : undefined,
      };

      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
