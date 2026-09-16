import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CATALOG_TAG } from "@/server/catalog/cache";

export async function audit(actorId: string, entity: string, entityId: string, action: string, diff: unknown) {
  await prisma.auditLog.create({ data: { actorId, entity, entityId, action, diff: JSON.parse(JSON.stringify(diff ?? {})) } });
  revalidateTag(CATALOG_TAG, "max");
}

export function validationError(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return { error: "Dados inválidos.", fields: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })) };
}
