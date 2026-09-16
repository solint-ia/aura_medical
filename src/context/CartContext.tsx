"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
type CatalogKind = "product" | "protocol";
type LineId = string;
interface ProtocolLike { id: string; name: string; totalPrice: number; sessions: string; image?: string; composition: { enzyme: string; vials: number }[] }

export interface CartItem { id: string; name: string; unitPrice: number; vials: number; quantity: number; sessions: string; imagePath?: string; composition?: { enzyme: string; vials: number }[]; kind?: CatalogKind; line?: LineId; presentation?: string }
export interface CartQuote { id: string; name: string; unitPrice: number; imagePath?: string }
interface CartContextType { items: CartItem[]; addToCart: (protocol: ProtocolLike | CartItem, quantity?: number) => void; removeFromCart: (id: string) => void; updateQuantity: (id: string, quantity: number) => void; clearCart: () => void; totalItems: number; subtotal: number; isHydrated: boolean; reconcile: (quotes: CartQuote[]) => string[] }

const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = "aura_cart_v1";
type Snapshot = { items: CartItem[]; isHydrated: boolean };
const serverSnapshot: Snapshot = { items: [], isHydrated: false };
let snapshot: Snapshot = serverSnapshot;
const listeners = new Set<() => void>();

function emit(items: CartItem[], persist = true) {
  snapshot = { items, isHydrated: true };
  if (persist && typeof window !== "undefined") localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener());
}
function hydrate() { if (snapshot.isHydrated || typeof window === "undefined") return; try { const raw = localStorage.getItem(LOCAL_STORAGE_KEY); emit(raw ? JSON.parse(raw) : [], false); } catch { emit([], false); } }
function subscribe(listener: () => void) { listeners.add(listener); queueMicrotask(hydrate); return () => listeners.delete(listener); }
const getSnapshot = () => snapshot;
const getServerSnapshot = () => serverSnapshot;

export function CartProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setItems = (updater: (items: CartItem[]) => CartItem[]) => emit(updater(snapshot.items));
  const addToCart = (protocol: ProtocolLike | CartItem, quantityToAdd = 1) => setItems((current) => {
    const existing = current.findIndex((item) => item.id === protocol.id);
    if (existing >= 0) { const updated = [...current]; updated[existing] = { ...updated[existing], quantity: Math.min(20, updated[existing].quantity + quantityToAdd) }; return updated; }
    const isProtocol = "totalPrice" in protocol;
    const item: CartItem = isProtocol ? { id: protocol.id, name: protocol.name, unitPrice: protocol.totalPrice, vials: protocol.composition.reduce((sum, part) => sum + part.vials, 0), quantity: Math.min(20, Math.max(1, quantityToAdd)), sessions: protocol.sessions, imagePath: protocol.image, composition: protocol.composition.map((part) => ({ enzyme: String(part.enzyme), vials: part.vials })), kind: "protocol", line: "pbserum" } : { ...protocol, quantity: Math.min(20, Math.max(1, quantityToAdd)) };
    return [...current, item];
  });
  const removeFromCart = (id: string) => setItems((items) => items.filter((item) => item.id !== id));
  const updateQuantity = (id: string, quantity: number) => quantity <= 0 ? removeFromCart(id) : setItems((items) => items.map((item) => item.id === id ? { ...item, quantity: Math.min(20, quantity) } : item));
  const clearCart = () => emit([]);
  const reconcile = (quotes: CartQuote[]) => { const byId = new Map(quotes.map((quote) => [quote.id, quote])); const changed: string[] = []; setItems((items) => items.flatMap((item) => { const quote = byId.get(item.id); if (!quote) return []; if (item.unitPrice !== quote.unitPrice) changed.push(quote.name); return [{ ...item, name: quote.name, unitPrice: quote.unitPrice, imagePath: quote.imagePath || item.imagePath }]; })); return changed; };
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return <CartContext.Provider value={{ ...state, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, reconcile }}>{children}</CartContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart must be used within a CartProvider"); return context; }
