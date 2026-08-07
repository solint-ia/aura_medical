const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

/**
 * Ids sintéticos emitidos pelo modo de testes de /api/payment/process quando a
 * API do Mercado Pago não responde a criação do PIX.
 */
export function isMockPaymentId(paymentId: unknown): boolean {
  const id = String(paymentId || "");
  return id.startsWith("PIX-TEST-") || id.startsWith("CARD-APPROVED-");
}

/**
 * Pagamento simulado só pode ser tratado como aprovado fora de produção. Em
 * produção um id sintético nunca vira pedido pago — o dinheiro precisa ter
 * entrado de fato no Mercado Pago.
 */
export const mockPaymentsAllowed = process.env.NODE_ENV !== "production";

export interface MercadoPagoPayment {
  /** `approved`, `pending`, `in_process`, `rejected`, `cancelled`, ... */
  status: string;
  statusDetail?: string;
  /** Valor efetivamente cobrado (`transaction_amount`). */
  amount?: number;
  paymentMethod?: string;
  /** Número do pedido enviado como `external_reference` na criação da cobrança. */
  externalReference?: string;
  isMock: boolean;
}

export type MercadoPagoLookup =
  | { ok: true; payment: MercadoPagoPayment }
  | { ok: false; httpStatus: number; error: string };

/**
 * Fonte única da verdade sobre o estado de um pagamento: consulta a API do
 * Mercado Pago com o access token do servidor. Nenhuma rota deve confiar no
 * status que o navegador informa.
 */
export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoLookup> {
  const id = String(paymentId || "").trim();

  if (!id) {
    return { ok: false, httpStatus: 400, error: "paymentId é obrigatório." };
  }

  if (isMockPaymentId(id)) {
    if (!mockPaymentsAllowed) {
      return {
        ok: false,
        httpStatus: 409,
        error: "Pagamento simulado não é aceito em produção.",
      };
    }

    return {
      ok: true,
      payment: {
        status: "approved",
        statusDetail: "accredited",
        isMock: true,
      },
    };
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        httpStatus: res.status,
        error: data?.message || "Erro ao consultar status do pagamento.",
      };
    }

    return {
      ok: true,
      payment: {
        status: String(data.status || ""),
        statusDetail: data.status_detail,
        amount: typeof data.transaction_amount === "number" ? data.transaction_amount : undefined,
        paymentMethod: data.payment_method_id,
        externalReference: data.external_reference ? String(data.external_reference) : undefined,
        isMock: false,
      },
    };
  } catch (err) {
    console.error("Erro ao consultar pagamento no Mercado Pago:", err);
    return { ok: false, httpStatus: 502, error: "Erro de comunicação com o Mercado Pago." };
  }
}
