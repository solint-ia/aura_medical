import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "aura-jwt-secret-key-2026-secure";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Informe o e-mail e o código de 6 dígitos." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedCode = code.replace(/\D/g, "");

    let dbUser: any = null;

    try {
      const found = await prisma.userProfile.findFirst({
        where: { email: trimmedEmail },
        include: { addresses: true },
      });

      if (found) {
        dbUser = found;
      }
    } catch (prismaErr) {
      console.warn("Prisma verify-code fallback dbPool:", prismaErr);

      const sqlRes = await dbPool.query(
        "SELECT * FROM public.user_profiles WHERE LOWER(email) = $1 LIMIT 1",
        [trimmedEmail]
      );

      if (sqlRes.rows.length > 0) {
        const u = sqlRes.rows[0];
        const addrRes = await dbPool.query(
          "SELECT * FROM public.user_addresses WHERE user_id = $1 ORDER BY created_at DESC",
          [u.id]
        );

        dbUser = {
          id: u.id,
          cpfCnpj: u.cpf_cnpj,
          firstName: u.first_name,
          lastName: u.last_name,
          birthDate: u.birth_date,
          email: u.email,
          phone: u.phone,
          role: u.role || "USER",
          verificationCode: u.verification_code,
          verificationExpires: u.verification_expires,
          addresses: addrRes.rows,
        };
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (!dbUser.verificationCode || dbUser.verificationCode !== trimmedCode) {
      return NextResponse.json(
        { error: "Código de verificação incorreto. Verifique e tente novamente." },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = dbUser.verificationExpires ? new Date(dbUser.verificationExpires) : null;

    if (!expiresAt || expiresAt < now) {
      return NextResponse.json(
        { error: "O código de verificação expirou (validade: 10 minutos). Solicite um novo código." },
        { status: 400 }
      );
    }

    // Mark as verified and clear code
    try {
      await prisma.userProfile.update({
        where: { id: dbUser.id },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationExpires: null,
        } as any,
      });
    } catch (err) {
      await dbPool.query(
        `UPDATE public.user_profiles 
         SET email_verified = true, verification_code = NULL, verification_expires = NULL 
         WHERE id = $1`,
        [dbUser.id]
      );
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: dbUser.id,
        email: dbUser.email,
        cpfCnpj: dbUser.cpfCnpj,
        name: `${dbUser.firstName} ${dbUser.lastName}`,
        role: dbUser.role || "USER",
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const user = {
      id: dbUser.id,
      cpfCnpj: dbUser.cpfCnpj,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      birthDate: dbUser.birthDate ? String(dbUser.birthDate).split("T")[0] : "",
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role || "USER",
    };

    const response = NextResponse.json({
      success: true,
      token,
      user,
      addresses: dbUser.addresses || [],
    });

    response.cookies.set({
      name: "aura_token",
      value: token,
      httpOnly: false,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao verificar código.";
    console.error("Erro na verificação do código:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
