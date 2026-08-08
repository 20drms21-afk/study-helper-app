const TOSS_API_BASE = "https://api.tosspayments.com/v1";

function authHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY ?? "";
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

export class TossApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "TossApiError";
    this.code = code;
  }
}

async function tossFetch(path: string, init: RequestInit) {
  const res = await fetch(`${TOSS_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new TossApiError(data?.message ?? "토스페이먼츠 API 호출에 실패했습니다.", data?.code);
  }

  return data;
}

export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
}

export async function issueBillingKey(
  authKey: string,
  customerKey: string
): Promise<{ billingKey: string }> {
  return tossFetch("/billing/authorizations/issue", {
    method: "POST",
    body: JSON.stringify({ authKey, customerKey }),
  });
}

export async function chargeBilling(
  billingKey: string,
  params: { customerKey: string; amount: number; orderId: string; orderName: string }
): Promise<TossPayment> {
  return tossFetch(`/billing/${billingKey}`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function deleteBillingKey(billingKey: string): Promise<void> {
  await tossFetch(`/billing/${billingKey}`, { method: "DELETE" });
}

export function generateOrderId(): string {
  return `order_${crypto.randomUUID().replace(/-/g, "")}`;
}
