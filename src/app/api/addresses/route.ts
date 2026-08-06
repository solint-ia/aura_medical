import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

interface AddressRow {
  id: string;
  user_id?: string | null;
  userId?: string | null;
  recipient_name?: string | null;
  recipientName?: string | null;
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  uf: string;
  is_default?: boolean | null;
  isDefault?: boolean | null;
}

function mapAddress(a: AddressRow) {
  return {
    id: a.id,
    userId: a.userId ?? a.user_id ?? undefined,
    recipientName: a.recipientName ?? a.recipient_name ?? undefined,
    cep: a.cep,
    street: a.street,
    number: a.number,
    complement: a.complement || undefined,
    neighborhood: a.neighborhood,
    city: a.city,
    uf: a.uf,
    isDefault: a.isDefault ?? a.is_default ?? false,
  };
}

function validateAddressFields(body: {
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
}) {
  const cleanCep = (body.cep || "").replace(/\D/g, "");
  if (cleanCep.length !== 8) return "CEP inválido. Deve possuir 8 dígitos.";
  if (!body.street?.trim()) return "Logradouro / Rua é obrigatório.";
  if (!body.number?.trim()) return "Número é obrigatório.";
  if (!body.neighborhood?.trim()) return "Bairro é obrigatório.";
  if (!body.city?.trim()) return "Cidade é obrigatória.";
  return null;
}

/** Cria um novo endereço para o usuário autenticado. */
export async function POST(req: Request) {
  try {
    const auth = verifyAuthToken(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada. Faça login novamente." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const fieldError = validateAddressFields(body);
    if (fieldError) {
      return NextResponse.json({ error: fieldError }, { status: 400 });
    }

    const cleanCep = body.cep.replace(/\D/g, "");
    const uf = (body.uf || "SE").trim().toUpperCase();

    let created: AddressRow;
    try {
      created = await prisma.userAddress.create({
        data: {
          userId: auth.userId,
          cep: cleanCep,
          street: body.street.trim(),
          number: body.number.trim(),
          complement: body.complement?.trim() || null,
          neighborhood: body.neighborhood.trim(),
          city: body.city.trim(),
          uf,
          isDefault: false,
        },
      });
    } catch (prismaErr) {
      console.warn("Prisma address create fallback dbPool:", prismaErr);
      const sqlRes = await dbPool.query(
        `INSERT INTO public.user_addresses (user_id, cep, street, number, complement, neighborhood, city, uf, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
         RETURNING *`,
        [
          auth.userId,
          cleanCep,
          body.street.trim(),
          body.number.trim(),
          body.complement?.trim() || null,
          body.neighborhood.trim(),
          body.city.trim(),
          uf,
        ]
      );
      created = sqlRes.rows[0];
    }

    return NextResponse.json({ success: true, address: mapAddress(created) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao salvar endereço.";
    console.error("Erro em POST /api/addresses:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Atualiza um endereço existente — só o dono (pelo token) pode editar. */
export async function PUT(req: Request) {
  try {
    const auth = verifyAuthToken(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada. Faça login novamente." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID do endereço é obrigatório." }, { status: 400 });
    }

    const fieldError = validateAddressFields(body);
    if (fieldError) {
      return NextResponse.json({ error: fieldError }, { status: 400 });
    }

    const cleanCep = body.cep.replace(/\D/g, "");
    const uf = (body.uf || "SE").trim().toUpperCase();

    try {
      // updateMany com userId no where torna a checagem de posse atômica:
      // count === 0 cobre tanto "não existe" quanto "não é seu".
      const result = await prisma.userAddress.updateMany({
        where: { id, userId: auth.userId },
        data: {
          cep: cleanCep,
          street: body.street.trim(),
          number: body.number.trim(),
          complement: body.complement?.trim() || null,
          neighborhood: body.neighborhood.trim(),
          city: body.city.trim(),
          uf,
        },
      });

      if (result.count === 0) {
        return NextResponse.json({ error: "Endereço não encontrado." }, { status: 404 });
      }

      const updated = await prisma.userAddress.findUnique({ where: { id } });
      return NextResponse.json({ success: true, address: mapAddress(updated as AddressRow) });
    } catch (prismaErr) {
      console.warn("Prisma address update fallback dbPool:", prismaErr);

      const sqlRes = await dbPool.query(
        `UPDATE public.user_addresses
         SET cep = $1, street = $2, number = $3, complement = $4, neighborhood = $5, city = $6, uf = $7
         WHERE id = $8 AND user_id = $9
         RETURNING *`,
        [
          cleanCep,
          body.street.trim(),
          body.number.trim(),
          body.complement?.trim() || null,
          body.neighborhood.trim(),
          body.city.trim(),
          uf,
          id,
          auth.userId,
        ]
      );

      if (sqlRes.rows.length === 0) {
        return NextResponse.json({ error: "Endereço não encontrado." }, { status: 404 });
      }

      return NextResponse.json({ success: true, address: mapAddress(sqlRes.rows[0]) });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar endereço.";
    console.error("Erro em PUT /api/addresses:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Exclui um endereço — só o dono (pelo token) pode excluir. */
export async function DELETE(req: Request) {
  try {
    const auth = verifyAuthToken(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada. Faça login novamente." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID do endereço é obrigatório." }, { status: 400 });
    }

    try {
      const result = await prisma.userAddress.deleteMany({
        where: { id, userId: auth.userId },
      });

      if (result.count === 0) {
        return NextResponse.json({ error: "Endereço não encontrado." }, { status: 404 });
      }
    } catch (prismaErr) {
      console.warn("Prisma address delete fallback dbPool:", prismaErr);

      const sqlRes = await dbPool.query(
        "DELETE FROM public.user_addresses WHERE id = $1 AND user_id = $2",
        [id, auth.userId]
      );

      if (sqlRes.rowCount === 0) {
        return NextResponse.json({ error: "Endereço não encontrado." }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao excluir endereço.";
    console.error("Erro em DELETE /api/addresses:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
