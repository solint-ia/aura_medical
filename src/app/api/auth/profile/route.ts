import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";
import { validatePhone } from "@/lib/validators";

/**
 * Atualiza nome, telefone e data de nascimento do usuário autenticado (o
 * dono é identificado pelo token, nunca por um id enviado no corpo).
 */
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
    const { firstName, lastName, phone, birthDate } = body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: "Nome e Sobrenome são obrigatórios." }, { status: 400 });
    }

    if (!validatePhone(phone || "")) {
      return NextResponse.json({ error: "Telefone/WhatsApp inválido." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const parsedBirthDate = birthDate ? new Date(birthDate) : null;

    let updatedUser: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      birthDate: string;
    };

    try {
      const updated = await prisma.userProfile.update({
        where: { id: auth.userId },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: cleanPhone,
          birthDate: parsedBirthDate,
        },
      });

      updatedUser = {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        birthDate: updated.birthDate ? updated.birthDate.toISOString().split("T")[0] : "",
      };
    } catch (prismaErr) {
      console.warn("Prisma profile update fallback dbPool:", prismaErr);

      const sqlRes = await dbPool.query(
        `UPDATE public.user_profiles
         SET first_name = $1, last_name = $2, phone = $3, birth_date = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, first_name, last_name, phone, birth_date`,
        [firstName.trim(), lastName.trim(), cleanPhone, parsedBirthDate, auth.userId]
      );

      const u = sqlRes.rows[0];
      if (!u) {
        return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
      }

      updatedUser = {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        phone: u.phone,
        birthDate: u.birth_date ? String(u.birth_date).split("T")[0] : "",
      };
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar perfil.";
    console.error("Erro em /api/auth/profile:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
