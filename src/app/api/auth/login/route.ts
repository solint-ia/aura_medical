import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { toISODateString } from "@/lib/format";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "aura-jwt-secret-key-2026-secure";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "contato@auraregenera.com").toLowerCase().trim();

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

    let dbUser: {
      id: string;
      cpfCnpj: string;
      firstName: string;
      lastName: string;
      birthDate: Date | string | null;
      email: string;
      phone: string;
      passwordHash: string | null;
      role: "USER" | "ADMIN";
      addresses: Array<{
        id: string;
        userId?: string | null;
        recipientName?: string | null;
        cep: string;
        street: string;
        number: string;
        complement?: string | null;
        neighborhood: string;
        city: string;
        uf: string;
        isDefault?: boolean | null;
      }>;
    } | null = null;

    // 1. Primary DB Lookup via Prisma ORM
    try {
      const found = await prisma.userProfile.findFirst({
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

      if (found) {
        const isAdmin =
          (found as any).role === "ADMIN" ||
          found.email.toLowerCase() === ADMIN_EMAIL ||
          found.email.toLowerCase() === "contato@auraregenera.com";

        dbUser = {
          id: found.id,
          cpfCnpj: found.cpfCnpj,
          firstName: found.firstName,
          lastName: found.lastName,
          birthDate: found.birthDate,
          email: found.email,
          phone: found.phone,
          passwordHash: found.passwordHash,
          role: isAdmin ? "ADMIN" : "USER",
          addresses: found.addresses,
        };
      }
    } catch (prismaErr) {
      console.warn("Prisma ORM indisponível na Vercel, ativando fallback dbPool:", prismaErr);

      // Fallback: Direct PostgreSQL Query via pg Driver
      const sqlRes = await dbPool.query(
        `SELECT * FROM public.user_profiles 
         WHERE LOWER(email) = $1 OR (cpf_cnpj = $2 AND $2 != '') 
         LIMIT 1`,
        [trimmedInput, cleanInput]
      );

      if (sqlRes.rows.length > 0) {
        const u = sqlRes.rows[0];
        const addrRes = await dbPool.query(
          "SELECT * FROM public.user_addresses WHERE user_id = $1 ORDER BY created_at DESC",
          [u.id]
        );

        const isAdmin =
          u.role === "ADMIN" ||
          u.email.toLowerCase() === ADMIN_EMAIL ||
          u.email.toLowerCase() === "contato@auraregenera.com";

        dbUser = {
          id: u.id,
          cpfCnpj: u.cpf_cnpj,
          firstName: u.first_name,
          lastName: u.last_name,
          birthDate: u.birth_date,
          email: u.email,
          phone: u.phone,
          passwordHash: u.password_hash,
          role: isAdmin ? "ADMIN" : "USER",
          addresses: addrRes.rows.map((a) => ({
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
          })),
        };
      }
    }

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

    // 3. Map Addresses
    const addresses = dbUser.addresses.map((a) => ({
      id: a.id,
      userId: a.userId || dbUser!.id,
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

    // 3.5 Fetch User Orders from DB
    let orders: any[] = [];
    try {
      const dbOrders = await prisma.order.findMany({
        where: { userId: dbUser.id },
        include: { items: true, address: true },
        orderBy: { createdAt: "desc" },
      });

      orders = dbOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        userId: o.userId,
        addressId: o.addressId,
        addressSummary: o.address
          ? `${o.address.street}, ${o.address.number} ${o.address.complement || ""} - ${o.address.city} (${o.address.uf})`
          : o.notes || "Endereço cadastrado",
        shippingMethod: o.shippingMethod,
        shippingCost: Number(o.shippingCost),
        subtotal: Number(o.subtotal),
        totalPrice: Number(o.totalPrice),
        paymentMethod: o.paymentMethod,
        status: o.status,
        trackingCode: o.trackingCode || "",
        createdAt: o.createdAt?.toISOString() || new Date().toISOString(),
        items: o.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
          imagePath: i.imagePath || undefined,
        })),
      }));
    } catch (orderErr) {
      console.warn("Prisma orders login fetch fallback dbPool:", orderErr);
      const sqlRes = await dbPool.query(
        "SELECT * FROM public.orders WHERE user_id = $1 ORDER BY created_at DESC",
        [dbUser.id]
      );
      orders = sqlRes.rows.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        userId: o.user_id,
        addressSummary: o.notes || "Endereço cadastrado",
        shippingMethod: o.shipping_method,
        shippingCost: Number(o.shipping_cost),
        subtotal: Number(o.subtotal),
        totalPrice: Number(o.total_price),
        paymentMethod: o.payment_method,
        status: o.status,
        trackingCode: o.tracking_code || "",
        createdAt: o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString(),
        items: [],
      }));
    }

    // 4. Generate Signed JWT Token
    const token = jwt.sign(
      {
        userId: dbUser.id,
        email: dbUser.email,
        cpfCnpj: dbUser.cpfCnpj,
        name: `${dbUser.firstName} ${dbUser.lastName}`,
        role: dbUser.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const user = {
      id: dbUser.id,
      cpfCnpj: dbUser.cpfCnpj,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      birthDate: toISODateString(dbUser.birthDate),
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
    };

    const response = NextResponse.json({
      success: true,
      token,
      user,
      addresses,
      orders,
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
    const message = err instanceof Error ? err.message : "Erro ao realizar login.";
    console.error("Erro no login DB:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
