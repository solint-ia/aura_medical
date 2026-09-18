import type { ShippingPackage, VerifiedCheckoutItem } from "@/lib/checkoutPricing";

/** Embalagem padrão enquanto o produto não tem medidas reais cadastradas. */
export const DEFAULT_PACKAGE: ShippingPackage = { width: 10, height: 15, length: 20, weight: 0.5 };

const PRODUCTION_API_URL = "https://melhorenvio.com.br/api/v2";
const REQUEST_TIMEOUT_MS = 12_000;

export interface MelhorEnvioShippingOption {
  id: string;
  name: string;
  price: number;
  deliveryTime: number;
  company: string;
  logo?: string;
}

export class MelhorEnvioError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "MelhorEnvioError";
  }
}

function cleanCep(value: string): string {
  return value.replace(/\D/g, "");
}

function money(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.round((parsed + Number.EPSILON) * 100) / 100
    : null;
}

/**
 * Calcula o frete apenas com itens previamente resolvidos pelo catálogo do
 * servidor. Cada item vai com as medidas de UMA unidade e a quantidade: o
 * Melhor Envio multiplica pela quantidade e monta a embalagem combinada, então
 * nada é somado ou multiplicado aqui.
 */
export async function calculateMelhorEnvioShipping(
  destinationCep: string,
  items: VerifiedCheckoutItem[]
): Promise<MelhorEnvioShippingOption[]> {
  const destination = cleanCep(destinationCep);
  const origin = cleanCep(process.env.MELHOR_ENVIO_CEP_ORIGEM || "");
  const token = process.env.MELHOR_ENVIO_TOKEN?.trim();
  const configuredUrl = (process.env.MELHOR_ENVIO_API_URL || PRODUCTION_API_URL)
    .trim()
    .replace(/\/+$/, "");

  if (destination.length !== 8) {
    throw new MelhorEnvioError("CEP de destino inválido.", 400);
  }
  if (origin.length !== 8) {
    throw new MelhorEnvioError("CEP de origem do Melhor Envio não configurado.", 503);
  }
  if (!token) {
    throw new MelhorEnvioError("Token do Melhor Envio não configurado.", 503);
  }
  if (configuredUrl.includes("sandbox")) {
    throw new MelhorEnvioError(
      "A integração do Melhor Envio ainda está configurada para o sandbox.",
      503
    );
  }

  const hasTestItem = items.some(
    (item) => item.id === "teste-pix" || item.id === "teste-cartao"
  );
  if (hasTestItem) {
    return [
      {
        id: "frete-gratis-teste",
        name: "Frete Grátis (Protocolo de Teste)",
        price: 0,
        deliveryTime: 1,
        company: "Aura Regenera",
      },
    ];
  }

  const payload = {
    from: { postal_code: origin },
    to: { postal_code: destination },
    products: items.map((item) => {
      const box = item.package ?? DEFAULT_PACKAGE;
      return {
        id: item.id,
        // A API exige centímetros inteiros; arredondar para cima nunca subdimensiona.
        width: Math.ceil(box.width),
        height: Math.ceil(box.height),
        length: Math.ceil(box.length),
        weight: box.weight,
        insurance_value: item.unitPrice,
        quantity: item.quantity,
      };
    }),
  };

  let response: Response;
  try {
    response = await fetch(`${configuredUrl}/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "AuraRegenera (contato@auraregenera.com)",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("Falha de comunicação com o Melhor Envio:", error);
    throw new MelhorEnvioError("Não foi possível consultar o Melhor Envio.");
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data)) {
    const apiMessage =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message || "")
        : "";
    throw new MelhorEnvioError(
      apiMessage || `O Melhor Envio recusou a cotação (HTTP ${response.status}).`,
      response.status >= 400 && response.status < 500 ? response.status : 502
    );
  }

  const options = data
    .filter((raw): raw is Record<string, unknown> => Boolean(raw && typeof raw === "object"))
    .filter((raw) => !raw.error)
    .map<MelhorEnvioShippingOption | null>((raw) => {
      const company =
        raw.company && typeof raw.company === "object"
          ? (raw.company as Record<string, unknown>)
          : {};
      const price = money(raw.custom_price ?? raw.price);
      const deliveryTime = Number(raw.custom_delivery_time ?? raw.delivery_time);

      if (
        raw.id === undefined ||
        !raw.name ||
        price === null ||
        !Number.isFinite(deliveryTime) ||
        deliveryTime < 0
      ) {
        return null;
      }

      const companyName = String(company.name || "Transportadora");
      return {
        id: String(raw.id),
        name: `${String(raw.name)} (${companyName})`,
        price,
        deliveryTime: Math.ceil(deliveryTime),
        company: companyName,
        logo: company.picture ? String(company.picture) : undefined,
      };
    })
    .filter((option): option is MelhorEnvioShippingOption => option !== null)
    .sort((a, b) => a.price - b.price || a.deliveryTime - b.deliveryTime);

  if (options.length === 0) {
    throw new MelhorEnvioError(
      "Nenhuma transportadora atende este CEP para os produtos selecionados.",
      422
    );
  }

  return options;
}
