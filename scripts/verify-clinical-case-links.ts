import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const legacyColumn = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'catalog_clinical_cases'
        AND column_name = 'protocol_id'
    ) AS "exists"
  `;
  const orphaned = legacyColumn[0]?.exists
    ? await prisma.$queryRaw<Array<{ id: string; slug: string; title: string; status: string; lineName: string }>>`
        SELECT c.id, c.slug, c.title, c.status::text, l.name AS "lineName"
        FROM catalog_clinical_cases c
        JOIN catalog_lines l ON l.id = c.line_id
        WHERE c.protocol_id IS NULL
        ORDER BY c.sort_order ASC
      `
    : (await prisma.clinicalCase.findMany({
        where: { products: { none: {} }, protocols: { none: {} } },
        select: { id: true, slug: true, title: true, status: true, line: { select: { name: true } } },
        orderBy: { sortOrder: "asc" },
      })).map((item) => ({ ...item, lineName: item.line.name }));
  if (!orphaned.length) {
    console.log("Todos os casos clínicos possuem ao menos um vínculo.");
    return;
  }
  console.warn(`${orphaned.length} caso(s) exigem vínculo manual antes da publicação:`);
  for (const item of orphaned) console.warn(`- ${item.slug} · ${item.title} · ${item.lineName} · ${item.status}`);
  process.exitCode = 2;
}

main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exit(1); });
