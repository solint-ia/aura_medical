"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  id?: string;
  userId?: string;
  cpfCnpj: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  role?: "USER" | "ADMIN";
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
  authToken: string | null;
  addresses: UserAddress[];
  selectedAddress: UserAddress | null;
  setSelectedAddress: (addr: UserAddress | null) => void;
  orders: Order[];
  isHydrated: boolean;
  login: (emailOrCpf: string, passwordInput: string) => Promise<{ success: boolean; errors?: Record<string, string>; error?: string }>;
  register: (
    profileData: Omit<UserProfile, "id">,
    addressData: Omit<UserAddress, "id">,
    passwordInput: string
  ) => Promise<{ success: boolean; errors?: Record<string, string>; error?: string }>;
  updateProfile: (data: { firstName: string; lastName: string; phone: string; birthDate: string }) => Promise<boolean>;
  addAddress: (addressData: Omit<UserAddress, "id">) => Promise<UserAddress>;
  updateAddress: (addressId: string, addressData: Omit<UserAddress, "id">) => Promise<boolean>;
  deleteAddress: (addressId: string) => Promise<boolean>;
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

const LOCAL_STORAGE_USER_KEY = "aura_user_profile_v3";
const LOCAL_STORAGE_TOKEN_KEY = "aura_auth_token_v3";
const LOCAL_STORAGE_ADDRESSES_KEY = "aura_user_addresses_v3";
const LOCAL_STORAGE_ORDERS_KEY = "aura_user_orders_v3";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate auth session state
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      const savedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
      const savedAddresses = localStorage.getItem(LOCAL_STORAGE_ADDRESSES_KEY);
      const savedOrders = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);

      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedToken) setAuthToken(savedToken);

      if (savedAddresses) {
        const parsedAddresses = JSON.parse(savedAddresses);
        setAddresses(parsedAddresses);
        if (parsedAddresses.length > 0) setSelectedAddress(parsedAddresses[0]);
      }

      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch (err) {
      console.error("Erro ao carregar sessão de autenticação:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const syncState = (
    newUser: UserProfile | null,
    newToken: string | null,
    newAddresses: UserAddress[],
    newOrders: Order[]
  ) => {
    setUser(newUser);
    setAuthToken(newToken);
    setAddresses(newAddresses);
    setOrders(newOrders);

    if (newUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }

    if (newToken) {
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    }

    localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(newAddresses));
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(newOrders));
  };

  const login = async (emailOrCpf: string, passwordInput: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrCpf, password: passwordInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Credenciais inválidas." };
      }

      syncState(data.user, data.token, data.addresses || [], data.orders || []);
      if (data.addresses && data.addresses.length > 0) {
        setSelectedAddress(data.addresses[0]);
      }

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao realizar login.";
      return { success: false, error: errorMsg };
    }
  };

  const register = async (
    profileData: Omit<UserProfile, "id">,
    addressData: Omit<UserAddress, "id">,
    passwordInput: string
  ) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profileData,
          address: addressData,
          password: passwordInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          return { success: false, errors: data.errors };
        }
        return { success: false, error: data.error || "Erro ao realizar cadastro." };
      }

      const updatedAddresses = [data.address, ...addresses];
      syncState(data.user, data.token, updatedAddresses, orders);
      setSelectedAddress(data.address);

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro no servidor ao cadastrar.";
      return { success: false, error: errorMsg };
    }
  };

  const updateProfile = async (data: { firstName: string; lastName: string; phone: string; birthDate: string }) => {
    if (!user) return false;

    const updatedUser: UserProfile = {
      ...user,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone.trim(),
      birthDate: data.birthDate,
    };

    setUser(updatedUser);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
    return true;
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
    return newAddress;
  };

  const updateAddress = async (addressId: string, addressData: Omit<UserAddress, "id">) => {
    const updatedAddresses = addresses.map((addr) =>
      addr.id === addressId ? { ...addressData, id: addressId } : addr
    );

    setAddresses(updatedAddresses);
    localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(updatedAddresses));

    if (selectedAddress?.id === addressId) {
      setSelectedAddress({ ...addressData, id: addressId });
    }

    return true;
  };

  const deleteAddress = async (addressId: string) => {
    const updatedAddresses = addresses.filter((addr) => addr.id !== addressId);
    setAddresses(updatedAddresses);
    localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(updatedAddresses));

    if (selectedAddress?.id === addressId) {
      setSelectedAddress(updatedAddresses.length > 0 ? updatedAddresses[0] : null);
    }

    return true;
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
    syncState(null, null, [], []);
    setSelectedAddress(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_ORDERS_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authToken,
        addresses,
        selectedAddress,
        setSelectedAddress,
        orders,
        isHydrated,
        login,
        register,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
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
