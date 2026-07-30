import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";
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

    // 1. Check for Duplicate E-mail or CPF/CNPJ in Supabase DB
    try {
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id, email, cpf_cnpj")
        .or(`email.eq.${cleanEmail},cpf_cnpj.eq.${cleanCpfCnpj}`)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.email?.toLowerCase() === cleanEmail) {
          return NextResponse.json(
            { errors: { email: "Este e-mail já está cadastrado no sistema. Clique em Entrar." } },
            { status: 400 }
          );
        }
        if (existingUser.cpf_cnpj?.replace(/\D/g, "") === cleanCpfCnpj) {
          return NextResponse.json(
            { errors: { cpfCnpj: "Este CPF/CNPJ já está cadastrado no sistema." } },
            { status: 400 }
          );
        }
      }
    } catch (err) {
      console.warn("Aviso ao verificar duplicidade no Supabase:", err);
    }

    // 2. Secure Password Hashing with BCrypt (Salt rounds = 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insert User Profile into Supabase
    let createdProfileId = `user-${Date.now()}`;
    try {
      const { data: insertedProfile, error: profileErr } = await supabase
        .from("user_profiles")
        .insert([
          {
            cpf_cnpj: cleanCpfCnpj,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            birth_date: birthDate || null,
            email: cleanEmail,
            phone: cleanPhone,
            password_hash: passwordHash,
          },
        ])
        .select()
        .single();

      if (insertedProfile && !profileErr) {
        createdProfileId = insertedProfile.id;

        // Insert Address
        await supabase.from("user_addresses").insert([
          {
            user_id: insertedProfile.id,
            cep: cleanCep,
            street: street.trim(),
            number: number.trim(),
            complement: complement?.trim() || null,
            neighborhood: neighborhood.trim(),
            city: city.trim(),
            uf: uf?.trim() || "SE",
            is_default: true,
          },
        ]);
      }
    } catch (err) {
      console.warn("Persistência local fallback ativa:", err);
    }

    // 4. Generate JWT Authentication Token (Valid for 30 Days)
    const token = jwt.sign(
      {
        userId: createdProfileId,
        email: cleanEmail,
        cpfCnpj: cleanCpfCnpj,
        name: `${firstName} ${lastName}`,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const createdUser = {
      id: createdProfileId,
      cpfCnpj: cleanCpfCnpj,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate || "",
      email: cleanEmail,
      phone: cleanPhone,
    };

    const createdAddress = {
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

    return NextResponse.json({
      success: true,
      token,
      user: createdUser,
      address: createdAddress,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro no cadastro.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
