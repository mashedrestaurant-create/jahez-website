import assert from "node:assert/strict";
import test from "node:test";

/* ─────────────────────────────────────────────────────────────
   Paymob SDK Pure Function Tests
   Tests verifyPaymobHmac and queryToPaymobObject from app/paymob.ts
   ───────────────────────────────────────────────────────────── */

const { verifyPaymobHmac, queryToPaymobObject, PaymobError, validatePaymobEnv } = await import(
  "../app/paymob.ts"
);

/* ── queryToPaymobObject ───────────────────────────────────── */

test("queryToPaymobObject: maps all standard fields", () => {
  const params = new URLSearchParams({
    amount_cents: "15000",
    created_at: "2026-01-15T10:00:00Z",
    currency: "EGP",
    error_occured: "false",
    has_parent_transaction: "false",
    id: "998877",
    integration_id: "123456",
    is_3d_secure: "false",
    is_auth: "false",
    is_capture: "false",
    is_refunded: "false",
    is_standalone_payment: "true",
    is_voided: "false",
    order: "554433",
    owner: "merchant@example.com",
    pending: "false",
    "source_data.pan": "4111111111111111",
    "source_data.sub_type": "CREDIT",
    "source_data.type": "VISA",
    success: "true",
  });
  const obj = queryToPaymobObject(params);

  assert.equal(obj.amount_cents, "15000");
  assert.equal(obj.created_at, "2026-01-15T10:00:00Z");
  assert.equal(obj.currency, "EGP");
  assert.equal(obj.error_occured, "false");
  assert.equal(obj.has_parent_transaction, "false");
  assert.equal(obj.id, "998877");
  assert.equal(obj.integration_id, "123456");
  assert.equal(obj.is_3d_secure, "false");
  assert.equal(obj.is_auth, "false");
  assert.equal(obj.is_capture, "false");
  assert.equal(obj.is_refunded, "false");
  assert.equal(obj.is_standalone_payment, "true");
  assert.equal(obj.is_voided, "false");
  assert.deepEqual(obj.order, { id: "554433" });
  assert.equal(obj.owner, "merchant@example.com");
  assert.equal(obj.pending, "false");
  assert.deepEqual(obj.source_data, {
    pan: "4111111111111111",
    sub_type: "CREDIT",
    type: "VISA",
  });
  assert.equal(obj.success, "true");
});

test("queryToPaymobObject: defaults empty params to empty strings", () => {
  const params = new URLSearchParams({});
  const obj = queryToPaymobObject(params);

  assert.equal(obj.amount_cents, "");
  assert.equal(obj.id, "");
  assert.equal(obj.success, "");
  assert.deepEqual(obj.order, { id: "" });
  assert.deepEqual(obj.source_data, { pan: "", sub_type: "", type: "" });
});

test("queryToPaymobObject: handles partial params", () => {
  const params = new URLSearchParams({
    amount_cents: "5000",
    success: "true",
    order: "12345",
  });
  const obj = queryToPaymobObject(params);

  assert.equal(obj.amount_cents, "5000");
  assert.equal(obj.success, "true");
  assert.deepEqual(obj.order, { id: "12345" });
  assert.equal(obj.pending, "");
  assert.equal(obj.error_occured, "");
});

/* ── verifyPaymobHmac ──────────────────────────────────────── */

test("verifyPaymobHmac: returns false for empty hmac", async () => {
  const result = await verifyPaymobHmac({ id: "1" }, "", "secret");
  assert.equal(result, false);
});

test("verifyPaymobHmac: returns false for empty secret", async () => {
  const result = await verifyPaymobHmac({ id: "1" }, "abc123", "");
  assert.equal(result, false);
});

test("verifyPaymobHmac: returns false for both empty", async () => {
  const result = await verifyPaymobHmac({ id: "1" }, "", "");
  assert.equal(result, false);
});

test("verifyPaymobHmac: returns false for wrong hmac", async () => {
  const result = await verifyPaymobHmac(
    {
      amount_cents: "15000",
      created_at: "2026-01-15T10:00:00Z",
      currency: "EGP",
      error_occured: false,
      has_parent_transaction: false,
      id: "998877",
      integration_id: "123456",
      is_3d_secure: false,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: { id: "554433" },
      owner: "merchant@example.com",
      pending: false,
      source_data: { pan: "4111", sub_type: "CREDIT", type: "VISA" },
      success: true,
    },
    "wronghmacvalue1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    "test-secret-key",
  );
  assert.equal(result, false);
});

test("verifyPaymobHmac: returns true for valid hmac", async () => {
  const secret = "test-secret-key-for-hmac";
  const callbackObj = {
    amount_cents: "15000",
    created_at: "2026-01-15T10:00:00Z",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    id: "998877",
    integration_id: "123456",
    is_3d_secure: false,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: "554433" },
    owner: "merchant@example.com",
    pending: false,
    source_data: { pan: "4111", sub_type: "CREDIT", type: "VISA" },
    success: true,
  };

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
  ];

  function nestedValue(object, path) {
    let value = object;
    for (const key of path.split(".")) {
      if (!value || typeof value !== "object") return "";
      value = value[key];
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    return value === null || value === undefined ? "" : String(value);
  }

  const message = hmacFields
    .map((field) => nestedValue(callbackObj, field))
    .join("");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  const validHmac = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const result = await verifyPaymobHmac(callbackObj, validHmac, secret);
  assert.equal(result, true);
});

test("verifyPaymobHmac: returns false when tampering one field", async () => {
  const secret = "test-secret-key-for-hmac";
  const callbackObj = {
    amount_cents: "15000",
    created_at: "2026-01-15T10:00:00Z",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    id: "998877",
    integration_id: "123456",
    is_3d_secure: false,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: "554433" },
    owner: "merchant@example.com",
    pending: false,
    source_data: { pan: "4111", sub_type: "CREDIT", type: "VISA" },
    success: true,
  };

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
  ];

  function nestedValue(object, path) {
    let value = object;
    for (const key of path.split(".")) {
      if (!value || typeof value !== "object") return "";
      value = value[key];
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    return value === null || value === undefined ? "" : String(value);
  }

  const message = hmacFields
    .map((field) => nestedValue(callbackObj, field))
    .join("");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  const validHmac = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const tamperedObj = { ...callbackObj, amount_cents: "99999" };
  const result = await verifyPaymobHmac(tamperedObj, validHmac, secret);
  assert.equal(result, false);
});

test("verifyPaymobHmac: handles boolean fields correctly", async () => {
  const secret = "bool-test-secret";
  const objA = {
    amount_cents: "10000",
    created_at: "2026-01-01T00:00:00Z",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    id: "111",
    integration_id: "222",
    is_3d_secure: false,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: "333" },
    owner: "test",
    pending: false,
    source_data: { pan: "4111", sub_type: "CREDIT", type: "VISA" },
    success: true,
  };
  const objB = { ...objA, success: "true", pending: "false", error_occured: "false" };

  const hmacFields = [
    "amount_cents", "created_at", "currency", "error_occured",
    "has_parent_transaction", "id", "integration_id", "is_3d_secure",
    "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
    "is_voided", "order.id", "owner", "pending",
    "source_data.pan", "source_data.sub_type", "source_data.type", "success",
  ];

  function nestedValue(object, path) {
    let value = object;
    for (const key of path.split(".")) {
      if (!value || typeof value !== "object") return "";
      value = value[key];
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    return value === null || value === undefined ? "" : String(value);
  }

  const messageA = hmacFields.map((f) => nestedValue(objA, f)).join("");
  const messageB = hmacFields.map((f) => nestedValue(objB, f)).join("");

  assert.equal(messageA, messageB, "boolean and string representations should match");

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(messageA),
  );
  const hmac = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  assert.equal(await verifyPaymobHmac(objA, hmac, secret), true);
  assert.equal(await verifyPaymobHmac(objB, hmac, secret), true);
});

test("verifyPaymobHmac: nested order.id path resolves correctly", async () => {
  const secret = "nested-test";
  const obj = { order: { id: "12345" } };
  const hmacFields = ["order.id"];

  function nestedValue(object, path) {
    let value = object;
    for (const key of path.split(".")) {
      if (!value || typeof value !== "object") return "";
      value = value[key];
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    return value === null || value === undefined ? "" : String(value);
  }

  const message = hmacFields.map((f) => nestedValue(obj, f)).join("");
  assert.equal(message, "12345");

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  const hmac = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  assert.equal(await verifyPaymobHmac(obj, hmac, secret), true);
});

test("verifyPaymobHmac: missing nested path returns empty string", async () => {
  const obj = { order: null };
  const hmacFields = ["order.id"];

  function nestedValue(object, path) {
    let value = object;
    for (const key of path.split(".")) {
      if (!value || typeof value !== "object") return "";
      value = value[key];
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    return value === null || value === undefined ? "" : String(value);
  }

  const message = hmacFields.map((f) => nestedValue(obj, f)).join("");
  assert.equal(message, "");
});

/* ── PaymobError ─────────────────────────────────────────────── */

test("PaymobError: carries stage, status, and body", () => {
  const err = new PaymobError("payment_key", 502, "Upstream timeout");
  assert.equal(err.name, "PaymobError");
  assert.equal(err.stage, "payment_key");
  assert.equal(err.status, 502);
  assert.equal(err.body, "Upstream timeout");
  assert.ok(err.message.includes("payment_key"));
  assert.ok(err instanceof Error);
});

/* ── validatePaymobEnv ──────────────────────────────────────── */

test("validatePaymobEnv: returns ok when all env vars are set", () => {
  const orig = {
    PAYMOB_API_KEY: process.env.PAYMOB_API_KEY,
    PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
    PAYMOB_CARD_INTEGRATION_ID: process.env.PAYMOB_CARD_INTEGRATION_ID,
    PAYMOB_IFRAME_ID: process.env.PAYMOB_IFRAME_ID,
  };
  process.env.PAYMOB_API_KEY = "test-key";
  process.env.PAYMOB_HMAC_SECRET = "test-secret";
  process.env.PAYMOB_CARD_INTEGRATION_ID = "12345";
  process.env.PAYMOB_IFRAME_ID = "999";

  const result = validatePaymobEnv();
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);

  for (const [key, value] of Object.entries(orig)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("validatePaymobEnv: reports missing env vars", () => {
  const orig = {
    PAYMOB_API_KEY: process.env.PAYMOB_API_KEY,
    PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
    PAYMOB_CARD_INTEGRATION_ID: process.env.PAYMOB_CARD_INTEGRATION_ID,
    PAYMOB_IFRAME_ID: process.env.PAYMOB_IFRAME_ID,
  };
  delete process.env.PAYMOB_API_KEY;
  delete process.env.PAYMOB_HMAC_SECRET;
  delete process.env.PAYMOB_CARD_INTEGRATION_ID;
  delete process.env.PAYMOB_IFRAME_ID;

  const result = validatePaymobEnv();
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes("PAYMOB_API_KEY"));
  assert.ok(result.missing.includes("PAYMOB_HMAC_SECRET"));
  assert.ok(result.missing.includes("PAYMOB_CARD_INTEGRATION_ID"));
  assert.ok(result.missing.includes("PAYMOB_IFRAME_ID"));

  for (const [key, value] of Object.entries(orig)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
