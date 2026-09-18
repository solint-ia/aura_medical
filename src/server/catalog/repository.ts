import "server-only";

import { prisma } from "@/lib/prisma";
import { effectiveStock, kitsFromComponents } from "./availability";
import { mapProduct, mapProtocol, mediaUrl, productInclude, protocolInclude } from "./mappers";

const publishedPublic = { status: "PUBLISHED" as const, visibility: "PUBLIC" as const, line: { status: "PUBLISHED" as const } };

export async function getPublishedLines() {
  return prisma.line.findMany({
    where: { status: "PUBLISHED" },
    include: { _count: { select: { products: { where: { status: "PUBLISHED", visibility: "PUBLIC" } }, protocols: { where: { status: "PUBLISHED", visibility: "PUBLIC" } }, cases: { where: { status: "PUBLISHED" } } } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getLineBySlug(slug: string) {
  return prisma.line.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { _count: { select: { products: { where: { status: "PUBLISHED", visibility: "PUBLIC" } }, protocols: { where: { status: "PUBLISHED", visibility: "PUBLIC" } }, cases: { where: { status: "PUBLISHED" } } } } },
  });
}

export async function getPublishedProducts(filters: { lineSlug?: string; categorySlug?: string } = {}) {
  const rows = await prisma.product.findMany({
    where: { ...publishedPublic, line: { status: "PUBLISHED", ...(filters.lineSlug ? { slug: filters.lineSlug } : {}) }, ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}) },
    include: productInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapProduct);
}

export async function getFeaturedProducts(limit = 6) {
  const [lines, candidates] = await Promise.all([
    prisma.line.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, select: { id: true } }),
    prisma.product.findMany({
      where: { ...publishedPublic, skus: { some: { isActive: true } } },
      include: productInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  if (lines.length === 0) return [];

  const dailySeed = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
  const dailyScore = (slug: string) =>
    (slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), dailySeed) * 2654435761) >>> 0;
  const orderedByLine = new Map(
    lines.map((line) => [
      line.id,
      candidates.filter((product) => product.lineId === line.id).sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.featured && b.featured) return (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (b.featuredOrder ?? Number.MAX_SAFE_INTEGER);
        return dailyScore(a.slug) - dailyScore(b.slug);
      }),
    ]),
  );

  const selected = [] as typeof candidates;
  const selectedIds = new Set<string>();
  const baseQuota = Math.floor(limit / lines.length);
  const remainder = limit % lines.length;
  lines.forEach((line, index) => {
    const quota = baseQuota + (index < remainder ? 1 : 0);
    for (const product of (orderedByLine.get(line.id) ?? []).slice(0, quota)) {
      selected.push(product);
      selectedIds.add(product.id);
    }
  });

  if (selected.length < limit) {
    for (const product of candidates.filter((candidate) => !selectedIds.has(candidate.id))) {
      selected.push(product);
      if (selected.length === limit) break;
    }
  }

  return selected.slice(0, limit).map(mapProduct);
}

export async function getProductBySlug(slug: string) {
  const row = await prisma.product.findFirst({ where: { slug, ...publishedPublic }, include: productInclude });
  return row ? mapProduct(row) : null;
}

export async function getProtocolsByLine(lineSlug: string) {
  const rows = await prisma.protocol.findMany({ where: { ...publishedPublic, line: { slug: lineSlug, status: "PUBLISHED" } }, include: protocolInclude, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map(mapProtocol);
}

export async function getPublishedProtocols() {
  const rows = await prisma.protocol.findMany({ where: { ...publishedPublic, line: { status: "PUBLISHED" } }, include: protocolInclude, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map(mapProtocol);
}

export async function getProtocolBySlug(slug: string) {
  const row = await prisma.protocol.findFirst({ where: { slug, ...publishedPublic }, include: protocolInclude });
  return row ? mapProtocol(row) : null;
}

const GLOBAL_FAQ_ANSWERS: Record<string, string> = {
  "Quem pode comprar?":
    "Qualquer pessoa pode comprar no catálogo da Aura Regenera. A linha La Cutanée reúne dermocosméticos de uso doméstico, pensados para a rotina de cuidados em casa. Já os bioregenerativos e protocolos Pbserum são indicados para aplicação por profissionais habilitados da saúde e da estética.",
  "Como criar uma conta?":
    "Clique em 'Entrar' no menu superior, preencha seus dados e confirme o e-mail de ativação. A conta já nasce liberada para comprar em todo o catálogo, sem espera por aprovação.",
  "Quais são as formas de pagamento?":
    "Aceitamos todas as formas de pagamento: cartão de crédito, cartão de débito e PIX, com parcelamento em até 12x no cartão. Todas as operações são processadas com segurança pelo Mercado Pago.",
  "Existe pedido mínimo?":
    "Não há valor mínimo nem quantidade mínima para compra. Você tem total liberdade para adquirir desde uma única ampola ou frasco avulso para reposição rápida até grandes volumes para a rotina de protocolos da sua clínica.",
  "Como funcionam frete e prazo?":
    "O frete e o prazo de entrega são calculados automaticamente pelo CEP informado no checkout, com transportadoras especializadas e opções de envio expresso. Assim que o pedido for despachado, você recebe o código de rastreamento completo por e-mail e WhatsApp para acompanhar até a entrega.",
  "Como falar com a equipe?":
    "Nossa equipe de consultores científicos e suporte técnico atende diretamente pelo botão 'Fale Conosco' no menu, pelo WhatsApp oficial (79 9 9680-9911) ou pelo e-mail contato@auraregenera.com para orientações sobre protocolos, produtos, diluições e pedidos comerciais.",
};

export async function getFaq(scope: "GLOBAL" | "LINE", lineId?: string) {
  const rows = await prisma.faqItem.findMany({ where: { scope, lineId: scope === "GLOBAL" ? null : lineId, isPublished: true }, orderBy: { sortOrder: "asc" } });
  if (scope === "GLOBAL") {
    return rows.map((row) => ({
      ...row,
      answer: GLOBAL_FAQ_ANSWERS[row.question] ?? row.answer,
    }));
  }
  return rows;
}

export async function getSafetyNotes(lineId?: string) {
  return prisma.safetyNote.findMany({ where: { lineId, isPublished: true }, orderBy: { sortOrder: "asc" } });
}


type ResolverRow = {
  trackStock: boolean;
  stockQuantity: number | null;
  protocol?: { components: { quantity: number; product: { skus: { isActive: boolean; trackStock: boolean; stockQuantity: number | null }[] } }[] } | null;
};

/** Protocolo herda o teto da composição; produto usa só o próprio SKU. */
function resolvedStock(row: ResolverRow) {
  const ceiling = row.protocol ? kitsFromComponents(row.protocol.components) : undefined;
  const { trackStock, stock } = effectiveStock(row, ceiling);
  return { trackStock, stockQuantity: stock ?? null };
}
/** Medidas de uma unidade do produto; só vale com peso e as três dimensões preenchidos. */
function shippingPackage(product: { weightGrams: number | null; lengthCm: unknown; widthCm: unknown; heightCm: unknown } | null | undefined) {
  if (!product?.weightGrams || !product.lengthCm || !product.widthCm || !product.heightCm) return undefined;
  return {
    weight: product.weightGrams / 1000,
    length: Number(product.lengthCm),
    width: Number(product.widthCm),
    height: Number(product.heightCm),
  };
}

export async function resolveSkus(codes: string[]) {
  const aliases = await prisma.skuAlias.findMany({ where: { alias: { in: codes } }, select: { alias: true, sku: { select: { code: true } } } });
  const canonical = new Map(aliases.map((entry) => [entry.alias, entry.sku.code]));
  const lookup = [...new Set(codes.map((code) => canonical.get(code) || code))];
  const rows = await prisma.sku.findMany({
    where: { code: { in: lookup } },
    include: {
      image: true,
      product: { include: { line: true } },
      protocol: { include: { line: true, components: { include: { product: { include: { skus: { select: { isActive: true, trackStock: true, stockQuantity: true } } } } } } } },
    },
  });
  const byCode = new Map(rows.map((row) => [row.code, row]));
  return codes.map((requestedCode) => {
    const skuCode = canonical.get(requestedCode) || requestedCode;
    const row = byCode.get(skuCode);
    if (!row) return null;
    const owner = row.product || row.protocol;
    return {
      requestedCode, skuCode, name: row.label ? `${owner?.name} · ${row.label}` : owner?.name || skuCode,
      unitPrice: Number(row.price), imagePath: mediaUrl(row.image), isActive: row.isActive,
      status: owner?.status, visibility: owner?.visibility, lineStatus: row.product?.line.status || row.protocol?.line.status,
      ...resolvedStock(row),
      package: shippingPackage(row.product),
    };
  });
}

export async function getSlugRedirect(fromPath: string) {
  return prisma.slugRedirect.findUnique({ where: { fromPath } });
}
