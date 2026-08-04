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

    const hasTestItem = Array.isArray(items) && items.some((i: { id?: string }) => i.id === "teste-pix" || i.id === "teste-cartao");
    if (hasTestItem) {
      return NextResponse.json({
        success: true,
        source: "teste-frete-gratis",
        options: [
          {
            id: "frete-gratis-teste",
            name: "Frete Grátis (Protocolo de Teste)",
            price: 0,
            deliveryTime: 1,
            company: "Aura Express",
            logo: "",
          },
        ],
      });
    }

    const originCep = (process.env.MELHOR_ENVIO_CEP_ORIGEM || "49041-060").replace(/\D/g, "");
    const configuredApiUrl = process.env.MELHOR_ENVIO_API_URL || "https://sandbox.melhorenvio.com.br/api/v2";
    const token = process.env.MELHOR_ENVIO_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Token de API do Melhor Envio não configurado no servidor (.env.local)." },
        { status: 500 }
      );
    }

    // Standard packaging dimensions for enzymatic kits (15cm x 10cm x 20cm, 0.5kg)
    const productsPayload: ShippingCalculateItem[] = (items && items.length > 0)
      ? items.map((item: { id?: string; quantity?: number }) => ({
          id: item.id || "pbserum-kit",
          height: 15,
          width: 10,
          length: 20,
          weight: 0.5,
          insurance_value: 0,
          quantity: item.quantity || 1,
        }))
      : [
          {
            id: "pbserum-kit",
            height: 15,
            width: 10,
            length: 20,
            weight: 0.5,
            insurance_value: 0,
            quantity: 1,
          },
        ];

    const payload = {
      from: { postal_code: originCep },
      to: { postal_code: cleanDestinationCep },
      products: productsPayload,
    };

    // Prepare primary and fallback endpoints (Sandbox & Production)
    const endpoints = [
      configuredApiUrl,
      configuredApiUrl.includes("sandbox")
        ? "https://melhorenvio.com.br/api/v2"
        : "https://sandbox.melhorenvio.com.br/api/v2",
    ];

    let lastResponseData: unknown = null;
    let successfulData: unknown = null;

    for (const url of endpoints) {
      try {
        const response = await fetch(`${url}/me/shipment/calculate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
            "User-Agent": "AuraRegenera (contato@auraregenera.com)",
          },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        lastResponseData = responseData;

        if (response.ok && Array.isArray(responseData)) {
          successfulData = responseData;
          break; // Calculation succeeded!
        }
      } catch (err) {
        console.warn(`Tentativa no endpoint ${url} falhou:`, err);
      }
    }

    if (!successfulData || !Array.isArray(successfulData)) {
      const errorDetail = typeof lastResponseData === "object" && lastResponseData !== null
        ? (lastResponseData as { message?: string }).message || JSON.stringify(lastResponseData)
        : "Erro ao comunicar com a API do Melhor Envio.";

      return NextResponse.json(
        { error: `Erro na API do Melhor Envio: ${errorDetail}` },
        { status: 400 }
      );
    }

    // Map live options returned by Melhor Envio API directly
    const validOptions = successfulData
      .filter((opt: { error?: string }) => !opt.error)
      .map((opt: {
        id: number | string;
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
      }));

    return NextResponse.json({
      success: true,
      source: "melhor-envio-live",
      options: validOptions,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro interno ao calcular frete.";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
