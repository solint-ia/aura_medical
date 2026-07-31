import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
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

    // Direct SQL Query via dbPool
    const sqlRes = await dbPool.query(
      "SELECT * FROM public.user_profiles WHERE LOWER(email) = $1 LIMIT 1",
      [trimmedEmail]
    );

    if (sqlRes.rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const u = sqlRes.rows[0];
    const verificationCode = u.verification_code;
    const verificationExpires = u.verification_expires;

    if (!verificationCode || verificationCode !== trimmedCode) {
      return NextResponse.json(
        { error: "Código de verificação incorreto. Verifique e tente novamente." },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = verificationExpires ? new Date(verificationExpires) : null;

    if (!expiresAt || expiresAt < now) {
      return NextResponse.json(
        { error: "O código de verificação expirou (validade: 10 minutos). Solicite um novo código." },
        { status: 400 }
      );
    }

    // Mark as verified and clear code
    await dbPool.query(
      `UPDATE public.user_profiles 
       SET email_verified = true, verification_code = NULL, verification_expires = NULL 
       WHERE id = $1`,
      [u.id]
    );

    // Fetch user addresses
    const addrRes = await dbPool.query(
      "SELECT * FROM public.user_addresses WHERE user_id = $1 ORDER BY created_at DESC",
      [u.id]
    );

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: u.id,
        email: u.email,
        cpfCnpj: u.cpf_cnpj,
        name: `${u.first_name} ${u.last_name}`,
        role: u.role || "USER",
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const user = {
      id: u.id,
      cpfCnpj: u.cpf_cnpj,
      firstName: u.first_name,
      lastName: u.last_name,
      birthDate: u.birth_date ? String(u.birth_date).split("T")[0] : "",
      email: u.email,
      phone: u.phone,
      role: u.role || "USER",
    };

    const response = NextResponse.json({
      success: true,
      token,
      user,
      addresses: addrRes.rows || [],
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
