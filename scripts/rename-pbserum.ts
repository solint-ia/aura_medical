/**
 * Corrige a grafia publicada "PBSerum" para "Pbserum" no conteúdo já gravado no
 * banco. O nome regulatório (catalog_products.regulatory_name) fica de fora de
 * propósito: é a transcrição do registro na ANVISA.
 *
 * Uso: npx tsx --env-file=.env scripts/rename-pbserum.ts [--apply]
 * Sem --apply, só mostra quantas linhas seriam alteradas.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const TEXT_COLUMNS: Record<string, string[]> = {
  catalog_lines: ["name", "descriptor", "tagline", "mission", "vision", "values"],
  catalog_products: ["name", "eyebrow", "collection", "summary", "presentation"],
  catalog_protocols: ["name", "introduction", "note", "marking"],
  catalog_product_sections: ["title", "body"],
  content_faq_items: ["question", "answer"],
  content_safety_notes: ["label", "body"],
  content_blocks: ["eyebrow", "title", "body"],
  media_assets: ["alt"],
};

const ARRAY_COLUMNS: Record<string, string[]> = {
  catalog_lines: ["differentials", "commitments"],
  catalog_products: ["highlights"],
  catalog_protocols: ["indications", "reconstitution", "expected_results"],
  catalog_product_sections: ["items"],
};

async function main() {
  let total = 0;
  for (const [table, columns] of Object.entries(TEXT_COLUMNS)) {
    for (const column of columns) {
      const where = `"${column}" LIKE '%PBSerum%'`;
      const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*) AS count FROM "${table}" WHERE ${where}`);
      if (!count) continue;
      console.log(`${table}.${column}: ${count}`);
      total += Number(count);
      if (apply) await prisma.$executeRawUnsafe(`UPDATE "${table}" SET "${column}" = REPLACE("${column}", 'PBSerum', 'Pbserum') WHERE ${where}`);
    }
  }
  for (const [table, columns] of Object.entries(ARRAY_COLUMNS)) {
    for (const column of columns) {
      const where = `array_to_string("${column}", '|') LIKE '%PBSerum%'`;
      const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*) AS count FROM "${table}" WHERE ${where}`);
      if (!count) continue;
      console.log(`${table}.${column}[]: ${count}`);
      total += Number(count);
      if (apply) {
        await prisma.$executeRawUnsafe(
          `UPDATE "${table}" SET "${column}" = ARRAY(SELECT REPLACE(entry, 'PBSerum', 'Pbserum') FROM unnest("${column}") AS entry) WHERE ${where}`,
        );
      }
    }
  }
  console.log(apply ? `${total} registro(s) corrigido(s).` : `${total} registro(s) a corrigir. Rode com --apply para gravar.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
