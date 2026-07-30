import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
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

    // Hash Password with BCrypt
    const passwordHash = await bcrypt.hash(password, 10);

    let createdUser: {
      id: string;
      cpfCnpj: string;
      firstName: string;
      lastName: string;
      birthDate: string;
      email: string;
      phone: string;
    } | null = null;

    let createdAddr: {
      id: string;
      cep: string;
      street: string;
      number: string;
      complement: string;
      neighborhood: string;
      city: string;
      uf: string;
      isDefault: boolean;
    } | null = null;

    // 1. Primary DB Operations via Prisma ORM
    try {
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

      const created = await prisma.userProfile.create({
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

      const primary = created.addresses[0];
      createdUser = {
        id: created.id,
        cpfCnpj: created.cpfCnpj,
        firstName: created.firstName,
        lastName: created.lastName,
        birthDate: created.birthDate ? created.birthDate.toISOString().split("T")[0] : "",
        email: created.email,
        phone: created.phone,
      };

      createdAddr = {
        id: primary ? primary.id : `addr-${Date.now()}`,
        cep: primary ? primary.cep : cleanCep,
        street: primary ? primary.street : street.trim(),
        number: primary ? primary.number : number.trim(),
        complement: primary?.complement || "",
        neighborhood: primary ? primary.neighborhood : neighborhood.trim(),
        city: primary ? primary.city : city.trim(),
        uf: primary ? primary.uf : (uf?.trim() || "SE"),
        isDefault: true,
      };
    } catch (prismaErr) {
      console.warn("Prisma ORM indisponível no cadastro Vercel, ativando dbPool:", prismaErr);

      // Check duplicates via SQL
      const checkEmail = await dbPool.query("SELECT id FROM public.user_profiles WHERE LOWER(email) = $1 LIMIT 1", [cleanEmail]);
      if (checkEmail.rows.length > 0) {
        return NextResponse.json(
          { errors: { email: "Este e-mail já está cadastrado no sistema. Clique em Entrar." } },
          { status: 400 }
        );
      }

      const checkCpf = await dbPool.query("SELECT id FROM public.user_profiles WHERE cpf_cnpj = $1 LIMIT 1", [cleanCpfCnpj]);
      if (checkCpf.rows.length > 0) {
        return NextResponse.json(
          { errors: { cpfCnpj: "Este CPF/CNPJ já está cadastrado no sistema." } },
          { status: 400 }
        );
      }

      // Insert via pg driver directly
      const pInsert = await dbPool.query(
        `INSERT INTO public.user_profiles 
         (cpf_cnpj, first_name, last_name, birth_date, email, phone, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, cpf_cnpj, first_name, last_name, birth_date, email, phone`,
        [cleanCpfCnpj, firstName.trim(), lastName.trim(), birthDate || null, cleanEmail, cleanPhone, passwordHash]
      );

      const u = pInsert.rows[0];

      const aInsert = await dbPool.query(
        `INSERT INTO public.user_addresses
         (user_id, cep, street, number, complement, neighborhood, city, uf, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING id, cep, street, number, complement, neighborhood, city, uf, is_default`,
        [u.id, cleanCep, street.trim(), number.trim(), complement?.trim() || null, neighborhood.trim(), city.trim(), uf?.trim() || "SE"]
      );

      const a = aInsert.rows[0];

      createdUser = {
        id: u.id,
        cpfCnpj: u.cpf_cnpj,
        firstName: u.first_name,
        lastName: u.last_name,
        birthDate: u.birth_date ? String(u.birth_date).split("T")[0] : "",
        email: u.email,
        phone: u.phone,
      };

      createdAddr = {
        id: a.id,
        cep: a.cep,
        street: a.street,
        number: a.number,
        complement: a.complement || "",
        neighborhood: a.neighborhood,
        city: a.city,
        uf: a.uf,
        isDefault: a.is_default,
      };
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: createdUser!.id,
        email: createdUser!.email,
        cpfCnpj: createdUser!.cpfCnpj,
        name: `${createdUser!.firstName} ${createdUser!.lastName}`,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: createdUser,
      address: createdAddr,
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
    const message = err instanceof Error ? err.message : "Erro ao cadastrar usuário.";
    console.error("Erro no registro DB:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
