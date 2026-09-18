import { NextResponse } from "next/server";

export function requireUnchanged(req: Request, updatedAt: Date) {
  const expected = req.headers.get("if-match");
  if (!expected) {
    return NextResponse.json(
      { error: "If-Match é obrigatório para evitar sobrescrever alterações de outra pessoa." },
      { status: 428 },
    );
  }
  if (expected !== updatedAt.toISOString()) {
    return NextResponse.json(
      { error: "Este registro mudou desde que você o abriu. Recarregue antes de salvar." },
      { status: 409 },
    );
  }
  return null;
}
