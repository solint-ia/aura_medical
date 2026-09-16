import { PrismaClient } from "@prisma/client";

import { CATALOG } from "../src/data/catalog";
import { PROTOCOLS } from "../src/data/protocols";

const prisma = new PrismaClient();

async function main() {
  const expected = new Map<string, { name: string; price: number }>();
  for (const item of CATALOG) {
    for (const offer of item.offers) expected.set(offer.id, { name: offer.label ? `${item.name} · ${offer.label}` : item.name, price: offer.price });
  }
  for (const protocol of PROTOCOLS.filter((item) => item.hidden)) expected.set(protocol.id, { name: protocol.name, price: protocol.totalPrice });

  const rows = await prisma.sku.findMany({ include: { product: true, protocol: true } });
  const differences: string[] = [];
  for (const [code, value] of expected) {
    const row = rows.find((entry) => entry.code === code);
    const actualName = row?.label ? `${row.product?.name || row.protocol?.name} · ${row.label}` : row?.product?.name || row?.protocol?.name;
    if (!row) differences.push(`${code}: ausente no banco`);
    else if (Number(row.price) !== value.price || actualName !== value.name) differences.push(`${code}: esperado ${value.name}/${value.price}, recebido ${actualName}/${Number(row.price)}`);
  }
  if (rows.length !== 19) differences.push(`contagem de SKUs: esperado 19, recebido ${rows.length}`);
  const aliases = await prisma.skuAlias.count();
  if (aliases !== 3) differences.push(`contagem de aliases: esperado 3, recebido ${aliases}`);
  const revytra = rows.find((row) => row.code === "revytra-c20-nano");
  if (Number(revytra?.price) !== 314.85) differences.push("Revytra C20+ Nano deve custar R$ 314,85");
  if (differences.length) throw new Error(`Paridade falhou:\n${differences.join("\n")}`);
  console.log("Paridade confirmada: 19 SKUs, 3 aliases e Revytra a R$ 314,85.");
}

main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error.message); process.exit(1); });
