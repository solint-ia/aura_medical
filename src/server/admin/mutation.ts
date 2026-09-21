import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CATALOG_TAG } from "@/server/catalog/cache";
export { requireUnchanged } from "./concurrency";

export async function audit(actorId: string, entity: string, entityId: string, action: string, diff: unknown) {
  // A alteração principal já foi confirmada quando chegamos aqui. Uma falha
  // auxiliar não pode fazer o cliente acreditar que ela não foi salva e
  // repetir a mutação com uma versão agora obsoleta.
  try {
    await prisma.auditLog.create({ data: { actorId, entity, entityId, action, diff: JSON.parse(JSON.stringify(diff ?? {})) } });
  } catch (error) {
    console.error("Falha ao registrar auditoria administrativa", { entity, entityId, action, error });
  }

  try {
    revalidateTag(CATALOG_TAG, { expire: 0 });
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("Falha ao revalidar o catálogo após mutação administrativa", { entity, entityId, action, error });
  }
}

export async function lineIdFromCaseLinks(productIds: string[], protocolIds: string[]) {
  const [products, protocols] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, lineId: true } }),
    prisma.protocol.findMany({ where: { id: { in: protocolIds } }, select: { id: true, lineId: true } }),
  ]);
  if (products.length !== new Set(productIds).size || protocols.length !== new Set(protocolIds).size) return { error: "Um dos produtos ou protocolos vinculados não existe." } as const;
  const lineIds = [...new Set([...products.map((item) => item.lineId), ...protocols.map((item) => item.lineId)])];
  if (!lineIds.length) return { error: "Vincule pelo menos um produto ou protocolo." } as const;
  if (lineIds.length > 1) return { error: "Todos os vínculos do caso devem pertencer à mesma marca." } as const;
  return { lineId: lineIds[0] } as const;
}

export function validationError(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return { error: "Dados inválidos.", fields: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })) };
}
