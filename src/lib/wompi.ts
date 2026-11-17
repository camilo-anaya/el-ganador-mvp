import { createHash, timingSafeEqual } from "node:crypto";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAtPath(root: unknown, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!isRecord(value)) return undefined;
    return value[key];
  }, root);
}

function constantTimeHexEquals(left: string, right: string) {
  if (!/^[\da-f]{64}$/i.test(left) || !/^[\da-f]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

type CheckoutInput = {
  requestUrl: string;
  reference: string;
  amountInCents: number;
};

/** Builds the official Web Checkout URL using server-only Wompi secrets. */
export function createWompiCheckoutUrl({ requestUrl, reference, amountInCents }: CheckoutInput) {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUB_KEY || process.env.WOMPI_PUBLIC_KEY || "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? "";
  const environment = publicKey.startsWith("pub_test_") ? "test" : publicKey.startsWith("pub_prod_") ? "prod" : "";

  if (!environment || !integritySecret || !eventsSecret) {
    throw new Error("PSE aún no está configurado. Agrega las llaves oficiales de Wompi para habilitar el pago.");
  }
  const expectedIntegrityPrefix = environment === "test" ? "test_integrity_" : "prod_integrity_";
  const expectedEventsPrefix = environment === "test" ? "test_events_" : "prod_events_";
  if (!integritySecret.startsWith(expectedIntegrityPrefix) || !eventsSecret.startsWith(expectedEventsPrefix)) {
    throw new Error("Las llaves de Wompi pertenecen a ambientes distintos. Usa todas las llaves de prueba o todas las de producción.");
  }
  if (environment === "prod" && process.env.NODE_ENV !== "production") {
    throw new Error("No se permiten cobros reales desde el entorno local. Usa las llaves de prueba de Wompi.");
  }

  const configuredAppUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!configuredAppUrl) {
    throw new Error("Configura APP_URL con el dominio HTTPS público. Wompi no puede enviar confirmaciones a localhost.");
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredAppUrl || new URL(requestUrl).origin);
  } catch {
    throw new Error("APP_URL no es una dirección válida.");
  }
  if (baseUrl.protocol !== "https:") {
    throw new Error("APP_URL debe usar HTTPS para habilitar pagos y recibir confirmaciones seguras de Wompi.");
  }

  const signature = createHash("sha256")
    .update(`${reference}${amountInCents}COP${integritySecret}`)
    .digest("hex");
  const redirectUrl = new URL("/pago/confirmacion", baseUrl);
  redirectUrl.searchParams.set("reference", reference);

  const checkoutUrl = new URL("https://checkout.wompi.co/p/");
  checkoutUrl.searchParams.set("public-key", publicKey);
  checkoutUrl.searchParams.set("currency", "COP");
  checkoutUrl.searchParams.set("amount-in-cents", String(amountInCents));
  checkoutUrl.searchParams.set("reference", reference);
  checkoutUrl.searchParams.set("signature:integrity", signature);
  checkoutUrl.searchParams.set("redirect-url", redirectUrl.toString());
  return checkoutUrl.toString();
}

export function verifyWompiEvent(body: unknown, eventSecret: string, headerChecksum?: string | null) {
  if (!isRecord(body) || !isRecord(body.signature) || !Array.isArray(body.signature.properties)) return false;
  if (!isRecord(body.data) || !Number.isSafeInteger(body.timestamp)) return false;

  const properties = body.signature.properties;
  if (properties.length === 0 || properties.length > 30 || properties.some((path) => typeof path !== "string" || !path)) return false;

  const values = properties.map((path) => valueAtPath(body.data, path as string));
  if (values.some((value) => value === undefined || value === null || !["string", "number", "boolean"].includes(typeof value))) return false;

  const checksum = typeof body.signature.checksum === "string" ? body.signature.checksum : "";
  const header = headerChecksum?.trim() ?? "";
  if (header && checksum && header.toLowerCase() !== checksum.toLowerCase()) return false;
  const provided = checksum || header;
  if (!provided || !eventSecret) return false;

  const environment = body.environment;
  if (environment === "test" && eventSecret.startsWith("prod_events_")) return false;
  if (environment === "prod" && eventSecret.startsWith("test_events_")) return false;
  if (environment !== "test" && environment !== "prod") return false;

  const signed = `${values.map(String).join("")}${body.timestamp}${eventSecret}`;
  const calculated = createHash("sha256").update(signed).digest("hex");
  return constantTimeHexEquals(calculated, provided);
}
