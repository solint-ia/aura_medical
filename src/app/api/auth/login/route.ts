import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "aura-jwt-secret-key-2026-secure";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emailOrCpf, password } = body;

    if (!emailOrCpf || !password) {
      return NextResponse.json(
        { error: "Informe o e-mail/CPF e a senha para entrar." },
        { status: 400 }
      );
    }

    const cleanInput = emailOrCpf.replace(/\D/g, "");
    const trimmedInput = emailOrCpf.toLowerCase().trim();

    // 1. Fetch user profile from database using Prisma ORM
    const dbUser = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { email: trimmedInput },
          { cpfCnpj: cleanInput !== "" ? cleanInput : undefined },
        ],
      },
      include: {
        addresses: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "E-mail ou CPF/CNPJ não cadastrado no sistema." },
        { status: 404 }
      );
    }

    // 2. Verify Password
    let isPasswordValid = false;
    if (dbUser.passwordHash) {
      isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Senha incorreta. Verifique e tente novamente." },
        { status: 401 }
      );
    }

    // 3. Map addresses
    const addresses = dbUser.addresses.map((a) => ({
      id: a.id,
      userId: a.userId || dbUser.id,
      recipientName: a.recipientName || undefined,
      cep: a.cep,
      street: a.street,
      number: a.number,
      complement: a.complement || undefined,
      neighborhood: a.neighborhood,
      city: a.city,
      uf: a.uf,
      isDefault: a.isDefault || false,
    }));

    // 4. Generate Signed JWT Token
    const token = jwt.sign(
      {
        userId: dbUser.id,
        email: dbUser.email,
        cpfCnpj: dbUser.cpfCnpj,
        name: `${dbUser.firstName} ${dbUser.lastName}`,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const user = {
      id: dbUser.id,
      cpfCnpj: dbUser.cpfCnpj,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      birthDate: dbUser.birthDate ? dbUser.birthDate.toISOString().split("T")[0] : "",
      email: dbUser.email,
      phone: dbUser.phone,
    };

    return NextResponse.json({
      success: true,
      token,
      user,
      addresses,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao realizar login.";
    console.error("Erro no login Prisma ORM:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
