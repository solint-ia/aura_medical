import { NextResponse } from "next/server";

interface ShippingCalculateItem {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

interface ShippingOption {
  id: number | string;
  name: string;
  price: number;
  discountPrice?: number;
  deliveryTime: number;
  company: string;
  logo?: string;
}

/**
 * Calculates regional shipping quotes based on destination CEP and origin CEP (49041-060 Aracaju/SE).
 * Ensures Sergipe, Nordeste, Sudeste (SP, RJ, MG, ES), Sul, and Norte/Centro-Oeste get distinct realistic values.
 */
function getRegionalShippingQuotes(destinationCep: string): ShippingOption[] {
  const cleanCep = destinationCep.replace(/\D/g, "");
  const prefix2 = parseInt(cleanCep.slice(0, 2), 10) || 0;

  // 1. Local Sergipe (CEP 49000-000 a 49999-999)
  if (prefix2 === 49) {
    return [
      {
        id: 1,
        name: "SEDEX Expresso (Correios)",
        price: 18.5,
        discountPrice: 15.9,
        deliveryTime: 1,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 2,
        name: "PAC Econômico (Correios)",
        price: 12.9,
        discountPrice: 10.5,
        deliveryTime: 3,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 3,
        name: "Jadlog .Package",
        price: 14.2,
        discountPrice: 12.0,
        deliveryTime: 2,
        company: "Jadlog",
        logo: "/images/jadlog.png",
      },
    ];
  }

  // 2. Nordeste (BA: 40-48, AL: 57, PE: 50-56, PB: 58, RN: 59, CE: 60-63, PI: 64, MA: 65)
  if ((prefix2 >= 40 && prefix2 <= 65)) {
    return [
      {
        id: 1,
        name: "SEDEX Expresso (Correios)",
        price: 32.0,
        discountPrice: 28.5,
        deliveryTime: 2,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 2,
        name: "PAC Econômico (Correios)",
        price: 19.5,
        discountPrice: 16.9,
        deliveryTime: 5,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 3,
        name: "Jadlog .Package",
        price: 22.0,
        discountPrice: 18.9,
        deliveryTime: 4,
        company: "Jadlog",
        logo: "/images/jadlog.png",
      },
    ];
  }

  // 3. São Paulo (SP: 01-19)
  if (prefix2 >= 1 && prefix2 <= 19) {
    return [
      {
        id: 1,
        name: "SEDEX Expresso (Correios)",
        price: 58.4,
        discountPrice: 49.9,
        deliveryTime: 3,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 2,
        name: "PAC Econômico (Correios)",
        price: 34.2,
        discountPrice: 29.5,
        deliveryTime: 7,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 3,
        name: "Jadlog .Package",
        price: 36.8,
        discountPrice: 31.0,
        deliveryTime: 6,
        company: "Jadlog",
        logo: "/images/jadlog.png",
      },
    ];
  }

  // 4. Rio de Janeiro, Minas Gerais, Espírito Santo (RJ: 20-28, ES: 29, MG: 30-39)
  if (prefix2 >= 20 && prefix2 <= 39) {
    return [
      {
        id: 1,
        name: "SEDEX Expresso (Correios)",
        price: 54.0,
        discountPrice: 46.5,
        deliveryTime: 3,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 2,
        name: "PAC Econômico (Correios)",
        price: 32.0,
        discountPrice: 27.8,
        deliveryTime: 7,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 3,
        name: "Jadlog .Package",
        price: 35.0,
        discountPrice: 29.9,
        deliveryTime: 6,
        company: "Jadlog",
        logo: "/images/jadlog.png",
      },
    ];
  }

  // 5. Região Sul (PR: 80-87, SC: 88-89, RS: 90-99)
  if (prefix2 >= 80 && prefix2 <= 99) {
    return [
      {
        id: 1,
        name: "SEDEX Expresso (Correios)",
        price: 68.0,
        discountPrice: 59.0,
        deliveryTime: 4,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 2,
        name: "PAC Econômico (Correios)",
        price: 39.0,
        discountPrice: 33.5,
        deliveryTime: 9,
        company: "Correios",
        logo: "/images/correios.png",
      },
      {
        id: 3,
        name: "Jadlog .Package",
        price: 42.0,
        discountPrice: 36.0,
        deliveryTime: 8,
        company: "Jadlog",
        logo: "/images/jadlog.png",
      },
    ];
  }

  // 6. Norte & Centro-Oeste (DF/GO/TO/MT/MS/RO/AC/AM/RR/PA/AP: 66-79)
  return [
    {
      id: 1,
      name: "SEDEX Expresso (Correios)",
      price: 75.0,
      discountPrice: 65.0,
      deliveryTime: 5,
      company: "Correios",
      logo: "/images/correios.png",
    },
    {
      id: 2,
      name: "PAC Econômico (Correios)",
      price: 44.0,
      discountPrice: 38.0,
      deliveryTime: 10,
      company: "Correios",
      logo: "/images/correios.png",
    },
    {
      id: 3,
      name: "Jadlog .Package",
      price: 48.0,
      discountPrice: 41.5,
      deliveryTime: 9,
      company: "Jadlog",
      logo: "/images/jadlog.png",
    },
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { destinationCep, items } = body;

    if (!destinationCep) {
      return NextResponse.json(
        { error: "CEP de destino é obrigatório." },
        { status: 400 }
      );
    }

    const cleanDestinationCep = destinationCep.replace(/\D/g, "");
    if (cleanDestinationCep.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido. Deve possuir 8 dígitos." },
        { status: 400 }
      );
    }

    const originCep = (process.env.MELHOR_ENVIO_CEP_ORIGEM || "49041-060").replace(/\D/g, "");
    const apiUrl = process.env.MELHOR_ENVIO_API_URL || "https://sandbox.melhorenvio.com.br/api/v2";
    const token = process.env.MELHOR_ENVIO_TOKEN;

    const regionalFallbackOptions = getRegionalShippingQuotes(cleanDestinationCep);

    // Standard packaging dimensions for enzymatic kits from volume specifications
    const productsPayload: ShippingCalculateItem[] = (items && items.length > 0)
      ? items.map((item: { id?: string; quantity?: number; price?: number }) => ({
          id: item.id || "pbserum-kit",
          height: 15,
          width: 10,
          length: 20,
          weight: 0.5,
          insurance_value: item.price || 500,
          quantity: item.quantity || 1,
        }))
      : [
          {
            id: "pbserum-kit",
            height: 15,
            width: 10,
            length: 20,
            weight: 0.5,
            insurance_value: 500,
            quantity: 1,
          },
        ];

    const payload = {
      from: {
        postal_code: originCep,
      },
      to: {
        postal_code: cleanDestinationCep,
      },
      products: productsPayload,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "AuraRegenera (contato@auraregenera.com)",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Try calling Melhor Envio API
    try {
      const response = await fetch(`${apiUrl}/me/shipment/calculate`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const validOptions = Array.isArray(data)
          ? data
              .filter((opt: { error?: string }) => !opt.error)
              .map((opt: {
                id: number;
                name: string;
                price: number;
                custom_price?: number;
                delivery_time: number;
                company: { name: string; picture: string };
              }) => ({
                id: opt.id,
                name: `${opt.name} (${opt.company.name})`,
                price: parseFloat(String(opt.custom_price || opt.price)),
                deliveryTime: opt.delivery_time,
                company: opt.company.name,
                logo: opt.company.picture,
              }))
          : [];

        if (validOptions.length > 0) {
          return NextResponse.json({
            success: true,
            source: "melhor-envio",
            options: validOptions,
          });
        }
      }
    } catch {
      // Fallback to regional matrix on fetch error
    }

    // Return regional matrix based on CEP state prefix (Sergipe vs São Paulo vs Brazil)
    return NextResponse.json({
      success: true,
      source: "regional-calculation",
      options: regionalFallbackOptions,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro interno ao calcular frete.";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
