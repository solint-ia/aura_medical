import type { CardBrand } from "@/lib/validators";

// Cores fixas de marca de cada bandeira — não acompanham o tema claro/escuro,
// do mesmo jeito que as cores de produto em CLAUDE.md: identificam a bandeira,
// não a UI do site.
const BRAND_BADGE: Record<Exclude<CardBrand, "master">, { bg: string; text: string; label: string }> = {
  visa: { bg: "bg-white", text: "text-[#1A1F71]", label: "VISA" },
  amex: { bg: "bg-[#006FCF]", text: "text-white", label: "AMEX" },
  elo: { bg: "bg-[#0D1B2A]", text: "text-white", label: "elo" },
  hipercard: { bg: "bg-[#B3131B]", text: "text-white", label: "hiper" },
};

/** Selo compacto da bandeira do cartão, detectada pelo BIN enquanto o usuário digita. */
export function CardBrandBadge({ brand }: { brand: CardBrand | null }) {
  if (!brand) return null;

  if (brand === "master") {
    return (
      <div className="flex h-7 w-11 shrink-0 items-center justify-center rounded-md border border-content/15 bg-white">
        <span className="relative flex h-4 w-7 items-center">
          <span className="absolute left-0 h-4 w-4 rounded-full bg-[#EB001B]" />
          <span className="absolute right-0 h-4 w-4 rounded-full bg-[#F79E1B] mix-blend-multiply" />
        </span>
      </div>
    );
  }

  const style = BRAND_BADGE[brand];
  return (
    <div className={`flex h-7 w-11 shrink-0 items-center justify-center rounded-md border border-content/15 ${style.bg}`}>
      <span className={`font-mono text-[9px] font-extrabold uppercase tracking-tight ${style.text}`}>
        {style.label}
      </span>
    </div>
  );
}
