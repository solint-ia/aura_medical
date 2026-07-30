import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { validateCpfOrCnpj } from "@/lib/validators";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "aura-jwt-secret-key-2026-secure";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, address, password } = body;

    if (!profile || !address || !password) {
      return NextResponse.json(
        { error: "Dados incompletos para realizar o cadastro." },
        { status: 400 }
      );
    }

    const { cpfCnpj, firstName, lastName, birthDate, email, phone } = profile;
    const { cep, street, number, complement, neighborhood, city, uf } = address;

    // Field-by-field server validation
    const errors: Record<string, string> = {};

    const cleanCpfCnpj = (cpfCnpj || "").replace(/\D/g, "");
    if (!cleanCpfCnpj) {
      errors.cpfCnpj = "CPF ou CNPJ é obrigatório.";
    } else if (!validateCpfOrCnpj(cleanCpfCnpj)) {
      errors.cpfCnpj = "CPF ou CNPJ com formato inválido.";
    }

    if (!firstName?.trim()) errors.firstName = "Nome é obrigatório.";
    if (!lastName?.trim()) errors.lastName = "Sobrenome é obrigatório.";

    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) {
      errors.email = "E-mail é obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "E-mail com formato inválido.";
    }

    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = "Telefone / WhatsApp inválido.";
    }

    if (!password || password.length < 6) {
      errors.password = "A senha deve ter no mínimo 6 caracteres.";
    }

    const cleanCep = (cep || "").replace(/\D/g, "");
    if (!cleanCep || cleanCep.length !== 8) {
      errors.cep = "CEP inválido. Deve possuir 8 dígitos.";
    }

    if (!street?.trim()) errors.street = "Logradouro / Rua é obrigatório.";
    if (!number?.trim()) errors.number = "Número é obrigatório.";
    if (!neighborhood?.trim()) errors.neighborhood = "Bairro é obrigatório.";
    if (!city?.trim()) errors.city = "Cidade e UF são obrigatórias.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // 1. Check for Duplicate E-mail or CPF/CNPJ using Prisma ORM
    const existingEmail = await prisma.userProfile.findUnique({
      where: { email: cleanEmail },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        { errors: { email: "Este e-mail já está cadastrado no sistema. Clique em Entrar." } },
        { status: 400 }
      );
    }

    const existingCpf = await prisma.userProfile.findUnique({
      where: { cpfCnpj: cleanCpfCnpj },
      select: { id: true },
    });

    if (existingCpf) {
      return NextResponse.json(
        { errors: { cpfCnpj: "Este CPF/CNPJ já está cadastrado no sistema." } },
        { status: 400 }
      );
    }

    // 2. Hash Password with BCrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create User Profile & Address
    const createdProfile = await prisma.userProfile.create({
      data: {
        cpfCnpj: cleanCpfCnpj,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate ? new Date(birthDate) : null,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        addresses: {
          create: {
            cep: cleanCep,
            street: street.trim(),
            number: number.trim(),
            complement: complement?.trim() || null,
            neighborhood: neighborhood.trim(),
            city: city.trim(),
            uf: uf?.trim() || "SE",
            isDefault: true,
          },
        },
      },
      include: {
        addresses: true,
      },
    });

    const primaryAddress = createdProfile.addresses[0];

    // 4. Generate JWT Token
    const token = jwt.sign(
      {
        userId: createdProfile.id,
        email: createdProfile.email,
        cpfCnpj: createdProfile.cpfCnpj,
        name: `${createdProfile.firstName} ${createdProfile.lastName}`,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const user = {
      id: createdProfile.id,
      cpfCnpj: createdProfile.cpfCnpj,
      firstName: createdProfile.firstName,
      lastName: createdProfile.lastName,
      birthDate: createdProfile.birthDate ? createdProfile.birthDate.toISOString().split("T")[0] : "",
      email: createdProfile.email,
      phone: createdProfile.phone,
    };

    const addressRes = primaryAddress
      ? {
          id: primaryAddress.id,
          cep: primaryAddress.cep,
          street: primaryAddress.street,
          number: primaryAddress.number,
          complement: primaryAddress.complement || "",
          neighborhood: primaryAddress.neighborhood,
          city: primaryAddress.city,
          uf: primaryAddress.uf,
          isDefault: primaryAddress.isDefault || true,
        }
      : {
          id: `addr-${Date.now()}`,
          cep: cleanCep,
          street: street.trim(),
          number: number.trim(),
          complement: complement?.trim() || "",
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          uf: uf?.trim() || "SE",
          isDefault: true,
        };

    const response = NextResponse.json({
      success: true,
      token,
      user,
      address: addressRes,
    });

    // Set JWT Token in Cookies (Visible in DevTools Application -> Cookies)
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
    const message = err instanceof Error ? err.message : "Erro ao cadastrar usuário.";
    console.error("Erro no registro Prisma ORM:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
