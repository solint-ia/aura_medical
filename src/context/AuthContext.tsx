"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id?: string;
  userId?: string;
  cpfCnpj: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
}

export interface UserAddress {
  id: string;
  userId?: string;
  recipientName?: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  uf: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imagePath?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId?: string;
  addressSummary?: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  totalPrice: number;
  paymentMethod: string;
  status: "pendente" | "pago" | "em_separacao" | "em_transporte" | "entregue" | "cancelado";
  trackingCode?: string;
  invoiceUrl?: string;
  createdAt: string;
  items: OrderItem[];
}

interface AuthContextType {
  user: UserProfile | null;
  addresses: UserAddress[];
  selectedAddress: UserAddress | null;
  setSelectedAddress: (addr: UserAddress | null) => void;
  orders: Order[];
  isHydrated: boolean;
  login: (email: string, cpfCnpj: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    profileData: Omit<UserProfile, "id">,
    addressData: Omit<UserAddress, "id">
  ) => Promise<{ success: boolean; error?: string }>;
  addAddress: (addressData: Omit<UserAddress, "id">) => Promise<UserAddress>;
  createOrder: (orderPayload: {
    address: UserAddress;
    shippingMethod: string;
    shippingCost: number;
    subtotal: number;
    totalPrice: number;
    paymentMethod: string;
    items: Array<{ id: string; name: string; quantity: number; unitPrice: number; imagePath?: string }>;
  }) => Promise<Order>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "aura_user_profile";
const LOCAL_STORAGE_ADDRESSES_KEY = "aura_user_addresses";
const LOCAL_STORAGE_ORDERS_KEY = "aura_user_orders";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load initial session state from localStorage or Supabase
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      const savedAddresses = localStorage.getItem(LOCAL_STORAGE_ADDRESSES_KEY);
      const savedOrders = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }

      if (savedAddresses) {
        const parsedAddresses = JSON.parse(savedAddresses);
        setAddresses(parsedAddresses);
        if (parsedAddresses.length > 0) {
          setSelectedAddress(parsedAddresses[0]);
        }
      }

      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (err) {
      console.error("Erro ao carregar estado de autenticação:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to localStorage
  const syncState = (newUser: UserProfile | null, newAddresses: UserAddress[], newOrders: Order[]) => {
    setUser(newUser);
    setAddresses(newAddresses);
    setOrders(newOrders);

    if (newUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }

    localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(newAddresses));
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(newOrders));
  };

  const login = async (email: string, cpfCnpj: string) => {
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, "");

    // Try fetching profile from Supabase first
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (data && !error) {
        const profile: UserProfile = {
          id: data.id,
          userId: data.user_id,
          cpfCnpj: data.cpf_cnpj,
          firstName: data.first_name,
          lastName: data.last_name,
          birthDate: data.birth_date,
          email: data.email,
          phone: data.phone,
        };

        // Fetch addresses
        const { data: addrData } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", data.user_id || data.id);

        const loadedAddresses: UserAddress[] = (addrData || []).map((a) => ({
          id: a.id,
          userId: a.user_id,
          recipientName: a.recipient_name,
          cep: a.cep,
          street: a.street,
          number: a.number,
          complement: a.complement,
          neighborhood: a.neighborhood,
          city: a.city,
          uf: a.uf,
          isDefault: a.is_default,
        }));

        syncState(profile, loadedAddresses, orders);
        if (loadedAddresses.length > 0) setSelectedAddress(loadedAddresses[0]);
        return { success: true };
      }
    } catch {
      // Fallback local lookup
    }

    // Local state fallback login lookup
    const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (savedUser) {
      const parsed: UserProfile = JSON.parse(savedUser);
      if (
        parsed.email.toLowerCase() === email.toLowerCase().trim() ||
        parsed.cpfCnpj.replace(/\D/g, "") === cleanCpfCnpj
      ) {
        setUser(parsed);
        return { success: true };
      }
    }

    return { success: false, error: "Usuário não encontrado com estes dados." };
  };

  const register = async (
    profileData: Omit<UserProfile, "id">,
    addressData: Omit<UserAddress, "id">
  ) => {
    const newProfileId = `prof-${Date.now()}`;
    const newProfile: UserProfile = {
      ...profileData,
      id: newProfileId,
    };

    const newAddressId = `addr-${Date.now()}`;
    const newAddress: UserAddress = {
      ...addressData,
      id: newAddressId,
      isDefault: true,
    };

    const updatedAddresses = [newAddress, ...addresses];
    syncState(newProfile, updatedAddresses, orders);
    setSelectedAddress(newAddress);

    // Persist to Supabase if configured
    try {
      await supabase.from("user_profiles").insert([
        {
          cpf_cnpj: profileData.cpfCnpj,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          birth_date: profileData.birthDate,
          email: profileData.email,
          phone: profileData.phone,
        },
      ]);

      await supabase.from("user_addresses").insert([
        {
          cep: addressData.cep,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          uf: addressData.uf,
          is_default: true,
        },
      ]);
    } catch (err) {
      console.warn("Aviso ao salvar no Supabase (usando fallback local):", err);
    }

    return { success: true };
  };

  const addAddress = async (addressData: Omit<UserAddress, "id">) => {
    const newAddress: UserAddress = {
      ...addressData,
      id: `addr-${Date.now()}`,
    };

    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(updatedAddresses));
    setSelectedAddress(newAddress);

    try {
      await supabase.from("user_addresses").insert([
        {
          cep: addressData.cep,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          uf: addressData.uf,
        },
      ]);
    } catch {
      // Local fallback
    }

    return newAddress;
  };

  const createOrder = async (orderPayload: {
    address: UserAddress;
    shippingMethod: string;
    shippingCost: number;
    subtotal: number;
    totalPrice: number;
    paymentMethod: string;
    items: Array<{ id: string; name: string; quantity: number; unitPrice: number; imagePath?: string }>;
  }) => {
    const orderNumber = `AUR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: user?.id || "guest",
      addressId: orderPayload.address.id,
      addressSummary: `${orderPayload.address.street}, ${orderPayload.address.number} - ${orderPayload.address.city}`,
      shippingMethod: orderPayload.shippingMethod,
      shippingCost: orderPayload.shippingCost,
      subtotal: orderPayload.subtotal,
      totalPrice: orderPayload.totalPrice,
      paymentMethod: orderPayload.paymentMethod,
      status: "pago",
      trackingCode: `ME-${Math.floor(100000000 + Math.random() * 900000000)}BR`,
      invoiceUrl: "#nfe-preview",
      createdAt: new Date().toISOString(),
      items: orderPayload.items.map((i) => ({
        id: `item-${Date.now()}-${i.id}`,
        productId: i.id,
        productName: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.unitPrice * i.quantity,
        imagePath: i.imagePath,
      })),
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrders));

    return newOrder;
  };

  const logout = () => {
    syncState(null, [], orders);
    setSelectedAddress(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        addresses,
        selectedAddress,
        setSelectedAddress,
        orders,
        isHydrated,
        login,
        register,
        addAddress,
        createOrder,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
