const PAYMOB_TIMEOUT_MS = 15_000;

export type PaymobConfig = {
  apiKey: string;
  integrationId: number;
  iframeId: number;
  hmacSecret: string;
};

type PaymobBilling = {
  name: string;
  email: string;
  phone: string;
  area: string;
  address: string;
};

type PaymobCallbackObject = Record<string, unknown> & {
  order?: unknown;
  source_data?: unknown;
};

export class PaymobError extends Error {
  stage: string;
  status: number;
  body: string;

  constructor(stage: string, status: number, body: string) {
    super(`Paymob ${stage} failed: HTTP ${status}`);
    this.name = "PaymobError";
    this.stage = stage;
    this.status = status;
    this.body = body;
  }
}

export class PaymobConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymobConfigError";
  }
}

export function validatePaymobEnv(): { ok: boolean; missing: string[] } {
  const required: Record<string, string | undefined> = {
    PAYMOB_API_KEY: process.env.PAYMOB_API_KEY,
    PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
    PAYMOB_CARD_INTEGRATION_ID: process.env.PAYMOB_CARD_INTEGRATION_ID,
    PAYMOB_IFRAME_ID: process.env.PAYMOB_IFRAME_ID,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value || value.trim() === "")
    .map(([key]) => key);
  return { ok: missing.length === 0, missing };
}

function readPaymobEnv() {
  return {
    apiKey: process.env.PAYMOB_API_KEY || "",
    hmacSecret: process.env.PAYMOB_HMAC_SECRET || "",
    integrationId: Number(process.env.PAYMOB_CARD_INTEGRATION_ID),
    iframeId: Number(process.env.PAYMOB_IFRAME_ID),
  };
}

export async function getPaymobConfig(): Promise<PaymobConfig | null> {
  const env = readPaymobEnv();
  if (
    !env.apiKey ||
    !env.hmacSecret ||
    !Number.isInteger(env.integrationId) ||
    env.integrationId <= 0 ||
    !Number.isInteger(env.iframeId) ||
    env.iframeId <= 0
  ) {
    return null;
  }
  return {
    apiKey: env.apiKey,
    integrationId: env.integrationId,
    iframeId: env.iframeId,
    hmacSecret: env.hmacSecret,
  };
}

export async function getPaymobCredentialStatus() {
  const env = readPaymobEnv();
  const required = {
    apiKey: Boolean(env.apiKey),
    hmacSecret: Boolean(env.hmacSecret),
    integrationId:
      Number.isInteger(env.integrationId) && env.integrationId > 0,
    iframeId:
      Number.isInteger(env.iframeId) && env.iframeId > 0,
  };
  return {
    ...required,
    publicKey: Boolean(process.env.PAYMOB_PUBLIC_KEY),
    configured: Object.values(required).every(Boolean),
  };
}

function logPaymob(step: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ component: "paymob-sdk", step, ...data }));
}

function logPaymobError(step: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const details: Record<string, unknown> = {
    component: "paymob-sdk",
    step,
    error: message,
    ...extra,
  };
  console.error(JSON.stringify(details));
}

async function paymobRequest<T>(path: string, payload: unknown, stage: string): Promise<T> {
  logPaymob(`${stage}_request`, { path });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAYMOB_TIMEOUT_MS);
  let response: Response;
  try {
    const apiBase = process.env.PAYMOB_API_BASE || "https://accept.paymob.com";
    response = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    const reason = error instanceof Error ? error.message : String(error);
    if (reason.includes("abort")) {
      logPaymobError(`${stage}_timeout`, null, { timeoutMs: PAYMOB_TIMEOUT_MS });
      throw new PaymobError(stage, 0, `Request timed out after ${PAYMOB_TIMEOUT_MS}ms`);
    }
    logPaymobError(`${stage}_network_error`, error);
    throw new PaymobError(stage, 0, `Network error: ${reason}`);
  } finally {
    clearTimeout(timer);
  }

  let bodyText: string;
  try {
    bodyText = await response.text();
  } catch {
    bodyText = "<unreadable>";
  }

  const contentType = response.headers.get("content-type") || "unknown";
  logPaymob(`${stage}_response`, {
    status: response.status,
    contentType,
    bodyLength: bodyText.length,
    ok: response.ok,
  });

  if (!response.ok) {
    logPaymobError(`${stage}_error_response`, null, {
      status: response.status,
      body: bodyText.slice(0, 300),
    });
    throw new PaymobError(stage, response.status, bodyText.slice(0, 500));
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    logPaymobError(`${stage}_invalid_json`, null, {
      body: bodyText.slice(0, 200),
    });
    throw new PaymobError(stage, response.status, `Invalid JSON: ${bodyText.slice(0, 200)}`);
  }
}

export async function createPaymobCardPayment(input: {
  config: PaymobConfig;
  localOrderId: number;
  total: number;
  billing: PaymobBilling;
}) {
  const amountCents = Math.round(input.total * 100);
  logPaymob("createPayment_start", {
    localOrderId: input.localOrderId,
    amountCents,
    integrationId: input.config.integrationId,
    iframeId: input.config.iframeId,
  });

  const auth = await paymobRequest<{ token?: string }>(
    "/api/auth/tokens",
    { api_key: input.config.apiKey },
    "auth",
  );
  if (!auth.token) {
    logPaymobError("auth_no_token", null);
    throw new PaymobError("auth", 200, "No token in response");
  }
  logPaymob("auth_success", { hasToken: true });

  const providerOrder = await paymobRequest<{ id?: number }>(
    "/api/ecommerce/orders",
    {
      auth_token: auth.token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: String(input.localOrderId),
      items: [],
    },
    "order_registration",
  );
  if (!providerOrder.id) {
    logPaymobError("order_no_id", null, { response: providerOrder });
    throw new PaymobError("order_registration", 200, "No order ID in response");
  }
  logPaymob("order_success", { providerOrderId: providerOrder.id });

  const nameParts = input.billing.name.trim().split(/\s+/);
  const firstName = nameParts.shift() || "Jahez";
  const lastName = nameParts.join(" ") || firstName;
  const paymentKey = await paymobRequest<{ token?: string }>(
    "/api/acceptance/payment_keys",
    {
      auth_token: auth.token,
      amount_cents: amountCents,
      expiration: 1800,
      order_id: providerOrder.id,
      billing_data: {
        apartment: "NA",
        email: input.billing.email || "orders@jahez.local",
        floor: "NA",
        first_name: firstName,
        street: input.billing.address || "Jahez pickup",
        building: "NA",
        phone_number: input.billing.phone.startsWith("0")
          ? `+20${input.billing.phone.slice(1)}`
          : input.billing.phone,
        shipping_method: "NA",
        postal_code: "NA",
        city: input.billing.area || "New Cairo",
        country: "EG",
        last_name: lastName,
        state: "Cairo",
      },
      currency: "EGP",
      integration_id: input.config.integrationId,
      lock_order_when_paid: true,
    },
    "payment_key",
  );
  if (!paymentKey.token) {
    logPaymobError("paymentKey_no_token", null);
    throw new PaymobError("payment_key", 200, "No payment key in response");
  }
  logPaymob("paymentKey_success", { hasToken: true });

  const paymobHost = process.env.PAYMOB_API_BASE || "https://accept.paymob.com";
  const acceptHost = paymobHost.includes("alpha") ? "https://accept-alpha.paymob.com" : paymobHost;
  const redirectUrl = `${acceptHost}/api/acceptance/iframes/${input.config.iframeId}?payment_token=${encodeURIComponent(paymentKey.token)}`;
  logPaymob("createPayment_complete", {
    localOrderId: input.localOrderId,
    providerOrderId: providerOrder.id,
  });

  return {
    providerOrderId: String(providerOrder.id),
    redirectUrl,
  };
}

const hmacFields = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function nestedValue(object: PaymobCallbackObject, path: string) {
  let value: unknown = object;
  for (const key of path.split(".")) {
    if (!value || typeof value !== "object") return "";
    value = (value as Record<string, unknown>)[key];
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return value === null || value === undefined ? "" : String(value);
}

export async function verifyPaymobHmac(
  object: PaymobCallbackObject,
  receivedHmac: string,
  secret: string,
) {
  if (!receivedHmac || !secret) return false;
  const message = hmacFields.map((field) => nestedValue(object, field)).join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== receivedHmac.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ receivedHmac.charCodeAt(index);
  }
  return mismatch === 0;
}

export function queryToPaymobObject(params: URLSearchParams) {
  return {
    amount_cents: params.get("amount_cents") || "",
    created_at: params.get("created_at") || "",
    currency: params.get("currency") || "",
    error_occured: params.get("error_occured") || "",
    has_parent_transaction: params.get("has_parent_transaction") || "",
    id: params.get("id") || "",
    integration_id: params.get("integration_id") || "",
    is_3d_secure: params.get("is_3d_secure") || "",
    is_auth: params.get("is_auth") || "",
    is_capture: params.get("is_capture") || "",
    is_refunded: params.get("is_refunded") || "",
    is_standalone_payment: params.get("is_standalone_payment") || "",
    is_voided: params.get("is_voided") || "",
    order: { id: params.get("order") || "" },
    owner: params.get("owner") || "",
    pending: params.get("pending") || "",
    source_data: {
      pan: params.get("source_data.pan") || "",
      sub_type: params.get("source_data.sub_type") || "",
      type: params.get("source_data.type") || "",
    },
    success: params.get("success") || "",
  };
}
