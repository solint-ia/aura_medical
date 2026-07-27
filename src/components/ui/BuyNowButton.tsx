"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { type Protocol } from "@/data/protocols";

interface BuyNowButtonProps {
  protocol: Protocol;
  className?: string;
  children?: React.ReactNode;
}

export function BuyNowButton({
  protocol,
  className = "",
  children = "Comprar Agora",
}: BuyNowButtonProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const handleBuyNow = () => {
    addToCart(protocol);
    router.push("/carrinho");
  };

  return (
    <button type="button" onClick={handleBuyNow} className={className}>
      {children}
    </button>
  );
}
