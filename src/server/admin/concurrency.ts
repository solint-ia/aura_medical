import { NextResponse } from "next/server";

export function requireUnchanged(req: Request, updatedAt: Date) {
  // `If-Match` is reserved by HTTP for ETag validation. Hosting/CDN layers
  // may evaluate it before or after the route handler and turn a successful
  // mutation into a 412. Keep the database version in an application header.
  const expected = req.headers.get("x-record-version");
  if (!expected) {
    return NextResponse.json(
      { error: "A versão do registro é obrigatória para evitar sobrescrever alterações de outra pessoa." },
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
