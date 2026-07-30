import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";

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

    // 1. Fetch user from Supabase Database
    const { data: dbUser, error } = await supabase
      .from("user_profiles")
      .select("*")
      .or(`email.eq.${trimmedInput},cpf_cnpj.eq.${cleanInput}`)
      .maybeSingle();

    if (error || !dbUser) {
      return NextResponse.json(
        { error: "E-mail ou CPF/CNPJ não cadastrado no sistema." },
        { status: 404 }
      );
    }

    // 2. Verify BCrypt Password Hash
    let isPasswordValid = false;
    if (dbUser.password_hash) {
      isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
    } else if (dbUser.password) {
      isPasswordValid = dbUser.password === password;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Senha incorreta. Verifique e tente novamente." },
        { status: 401 }
      );
    }

    // 3. Fetch User Addresses
    const { data: addrData } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", dbUser.id);

    const addresses = (addrData || []).map((a) => ({
      id: a.id,
      userId: a.user_id,
      recipientName: a.recipient_name,
      cep: a.cep,
      street: a.street,
      number: a.number,
      complement: a.complement,
      neighborhood: a.neighborhood,
      city: a.city,
      uf: a.uf,
      isDefault: a.is_default,
    }));

    // 4. Issue Signed JWT Token
    const token = jwt.sign(
      {
        userId: dbUser.id,
        email: dbUser.email,
        cpfCnpj: dbUser.cpf_cnpj,
        name: `${dbUser.first_name} ${dbUser.last_name}`,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const user = {
      id: dbUser.id,
      cpfCnpj: dbUser.cpf_cnpj,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      birthDate: dbUser.birth_date || "",
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
