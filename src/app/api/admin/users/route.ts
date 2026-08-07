import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbPool } from "@/lib/db";
import { toISODateString } from "@/lib/format";
import { validateEmail, validatePhone } from "@/lib/validators";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").toLowerCase().trim();

    let users = [];

    try {
      const dbUsers = await prisma.userProfile.findMany({
        where: query
          ? {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { cpfCnpj: { contains: query } },
              ],
            }
          : undefined,
        include: {
          orders: {
            select: { id: true, totalPrice: true },
          },
          addresses: {
            where: { isDefault: true },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      users = dbUsers.map((u) => {
        const defaultAddress = u.addresses[0];
        return {
          id: u.id,
          cpfCnpj: u.cpfCnpj,
          firstName: u.firstName,
          lastName: u.lastName,
          birthDate: toISODateString(u.birthDate),
          email: u.email,
          phone: u.phone,
          role: (u as any).role || "USER",
          createdAt: u.createdAt,
          totalOrders: u.orders.length,
          totalSpent: u.orders.reduce((sum, o) => sum + Number(o.totalPrice), 0),
          address: defaultAddress
            ? {
                cep: defaultAddress.cep,
                street: defaultAddress.street,
                number: defaultAddress.number,
                complement: defaultAddress.complement || "",
                neighborhood: defaultAddress.neighborhood,
                city: defaultAddress.city,
                uf: defaultAddress.uf,
              }
            : null,
        };
      });
    } catch (prismaErr) {
      console.warn("Prisma users list fallback dbPool:", prismaErr);

      const sqlRes = await dbPool.query(`
        SELECT u.*,
               COUNT(o.id) as orders_count,
               COALESCE(SUM(o.total_price), 0) as total_spent,
               a.cep as address_cep,
               a.street as address_street,
               a.number as address_number,
               a.complement as address_complement,
               a.neighborhood as address_neighborhood,
               a.city as address_city,
               a.uf as address_uf
        FROM public.user_profiles u
        LEFT JOIN public.orders o ON u.id = o.user_id
        LEFT JOIN public.user_addresses a ON a.user_id = u.id AND a.is_default = true
        WHERE ($1 = '' OR LOWER(u.first_name) LIKE $2 OR LOWER(u.last_name) LIKE $2 OR LOWER(u.email) LIKE $2 OR u.cpf_cnpj LIKE $2)
        GROUP BY u.id, a.cep, a.street, a.number, a.complement, a.neighborhood, a.city, a.uf
        ORDER BY u.created_at DESC
      `, [query, `%${query}%`]);

      users = sqlRes.rows.map((u) => ({
        id: u.id,
        cpfCnpj: u.cpf_cnpj,
        firstName: u.first_name,
        lastName: u.last_name,
        birthDate: toISODateString(u.birth_date),
        email: u.email,
        phone: u.phone,
        role: u.role || "USER",
        createdAt: u.created_at,
        totalOrders: parseInt(u.orders_count || "0"),
        totalSpent: Number(u.total_spent || 0),
        address: u.address_street
          ? {
              cep: u.address_cep,
              street: u.address_street,
              number: u.address_number,
              complement: u.address_complement || "",
              neighborhood: u.address_neighborhood,
              city: u.address_city,
              uf: u.address_uf,
            }
          : null,
      }));
    }

    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao listar usuários.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 401 });
    }

    const body = await req.json();
    const { id, firstName, lastName, phone, email, cpfCnpj, role } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do usuário é obrigatório." }, { status: 400 });
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: "Nome e Sobrenome são obrigatórios." }, { status: 400 });
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: "E-mail com formato inválido." }, { status: 400 });
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: "Telefone inválido." }, { status: 400 });
    }

    try {
      const updated = await prisma.userProfile.update({
        where: { id },
        data: {
          firstName: firstName?.trim(),
          lastName: lastName?.trim(),
          phone: phone ? phone.replace(/\D/g, "") : undefined,
          email: email ? email.toLowerCase().trim() : undefined,
          cpfCnpj: cpfCnpj ? cpfCnpj.replace(/\D/g, "") : undefined,
          ...(role ? { role: role as any } : {}),
        },
      });

      return NextResponse.json({ success: true, user: updated });
    } catch (prismaErr) {
      console.warn("Prisma user update fallback dbPool:", prismaErr);

      await dbPool.query(
        `UPDATE public.user_profiles 
         SET first_name = $1, last_name = $2, phone = $3, email = $4, cpf_cnpj = $5, role = $6, updated_at = NOW()
         WHERE id = $7`,
        [
          firstName?.trim(),
          lastName?.trim(),
          phone?.replace(/\D/g, ""),
          email?.toLowerCase().trim(),
          cpfCnpj?.replace(/\D/g, ""),
          role || "USER",
          id,
        ]
      );

      return NextResponse.json({ success: true });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar usuário.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!verifyAdminToken(req)) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do usuário é obrigatório." }, { status: 400 });
    }

    try {
      await prisma.userProfile.delete({
        where: { id },
      });
    } catch (prismaErr) {
      console.warn("Prisma user delete fallback dbPool:", prismaErr);
      await dbPool.query("DELETE FROM public.user_profiles WHERE id = $1", [id]);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao excluir usuário.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
