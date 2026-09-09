import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { verifyCheckoutItems } from "@/lib/checkoutPricing";
import { dbPool } from "@/lib/db";
import {
  calculateMelhorEnvioShipping,
  MelhorEnvioError,
} from "@/lib/melhorEnvio";
import { prisma } from "@/lib/prisma";

async function findOwnedAddressCep(userId: string, addressId: string): Promise<string | null> {
  try {
    const address = await prisma.userAddress.findFirst({
      where: { id: addressId, userId },
      select: { cep: true },
    });
    return address?.cep || null;
  } catch (prismaError) {
    console.warn("Prisma indisponível ao validar CEP do frete, tentando dbPool:", prismaError);
    const result = await dbPool.query(
      `SELECT cep FROM public.user_addresses WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [addressId, userId]
    );
    return result.rows[0]?.cep || null;
  }
}
export async function POST(req: Request) {
  try {
    const auth = verifyAuthToken(req);
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { addressId, items } = body;
    if (typeof addressId !== "string" || !addressId) {
      return NextResponse.json({ error: "Endereço inválido." }, { status: 400 });
    }

    const verifiedCart = verifyCheckoutItems(items, auth.role === "ADMIN");
    if (!verifiedCart.ok) {
      return NextResponse.json({ error: verifiedCart.error }, { status: 400 });
    }

    const destinationCep = await findOwnedAddressCep(auth.userId, addressId);
    if (!destinationCep) {
      return NextResponse.json(
        { error: "Endereço não pertence a esta conta." },
        { status: 403 }
      );
    }

    const options = await calculateMelhorEnvioShipping(
      destinationCep,
      verifiedCart.items
    );

    return NextResponse.json({
      success: true,
      source: "melhor-envio-production",
      options,
    });
  } catch (error) {
    if (error instanceof MelhorEnvioError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro interno ao calcular frete:", error);
    return NextResponse.json(
      { error: "Erro interno ao calcular frete." },
      { status: 500 }
    );
  }
}
