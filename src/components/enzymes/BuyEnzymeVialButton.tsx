"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatBRL } from "@/lib/format";

interface BuyEnzymeVialButtonProps {
  id: string;
  name: string;
  activeIngredient: string;
  imagePath: string;
  price?: number;
  className?: string;
}

export function BuyEnzymeVialButton({
  id,
  name,
  activeIngredient,
  imagePath,
  price = 390,
  className,
}: BuyEnzymeVialButtonProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [isAdded, setIsAdded] = useState(false);

  const handleBuy = () => {
    addToCart({
      id: `enz-${id}`,
      name: `Ampola Avulsa ${name} (${activeIngredient})`,
      unitPrice: price,
      vials: 1,
      quantity: 1,
      sessions: "1",
      imagePath,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      router.push("/carrinho");
    }, 600);
  };

  return (
    <button
      type="button"
      onClick={handleBuy}
      disabled={isAdded}
      className={
        className ||
        "group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#C59D3F] px-8 py-4 text-base font-bold text-[#0D1B2A] transition-all hover:bg-[#d4ac4c] shadow-lg hover:shadow-xl active:scale-[0.99]"
      }
    >
      {isAdded ? (
        <>
          <Check className="h-5 w-5" />
          <span>Ampola Adicionada!</span>
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          <span>Comprar Avulso ({formatBRL(price)})</span>
        </>
      )}
    </button>
  );
}
