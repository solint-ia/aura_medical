import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CatalogItem } from "@/data/catalog";
import { getCatalogHref } from "@/data/catalog";

export function CatalogCard({ item }: { item: CatalogItem }) {
  const line = item.lineInfo || { id: item.line, name: item.line, descriptor: "", colors: { surface: "#EEF1F5", surfaceDark: "#112233", accent: "#B4872D", accentDark: "#D8B657", foreground: "#12283C", foregroundDark: "#F7F5F0" } };
  const isProtocol = item.kind === "protocol";
  const style = {
    "--line-surface-light": line.colors.surface,
    "--line-surface-dark": line.colors.surfaceDark,
    "--line-accent-light": line.colors.accent,
    "--line-accent-dark": line.colors.accentDark,
    "--line-ink-light": line.colors.foreground,
    "--line-ink-dark": line.colors.foregroundDark,
  } as React.CSSProperties;

  return (
    <article
      style={style}
      className="line-scope group flex h-full flex-col overflow-hidden rounded-[26px] border border-content/12 bg-transparent shadow-[0_14px_35px_rgba(18,40,60,0.05)] transition-all duration-300 hover:border-content/25 hover:shadow-[0_20px_45px_rgba(18,40,60,0.10)]"
    >
      {/* Área do produto: envolvida pela borda do card, mas com fundo 100% transparente */}
      <div className="relative aspect-[4/3] w-full bg-transparent">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
          className={
            isProtocol
              ? "rounded-t-[24px] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              : "object-contain p-4 drop-shadow-[0_18px_24px_rgba(10,22,34,.20)] transition-transform duration-500 group-hover:scale-[1.06]"
          }
        />
      </div>

      {/* Corpo do card: onde o fundo sólido de texto e botão começa */}
      <div className="flex flex-1 flex-col border-t border-content/8 bg-card p-5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--line-accent)">{line.name} · {item.category}</p>
        <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold leading-snug text-content">{item.name}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-content/75">{item.summary}</p>
        <div className="mt-auto pt-5">
          <Link href={getCatalogHref(item)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-action px-5 py-3 text-sm font-semibold text-action-fg transition hover:bg-action-hover">
            Ver detalhes <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
