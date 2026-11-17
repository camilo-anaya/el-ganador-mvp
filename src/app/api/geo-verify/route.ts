import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "CO";
  const region = req.headers.get("x-vercel-ip-country-region") || undefined;

  const allowed = country.toUpperCase() === "CO" || process.env.NODE_ENV !== "production";

  return NextResponse.json({
    allowed,
    countryCode: country.toUpperCase(),
    region,
    message: allowed
      ? "Ubicación verificada en territorio colombiano (Ley 643 de 2001)."
      : "Los sorteos y rifas promocionales están habilitados únicamente dentro del territorio de la República de Colombia (Ley 643 de 2001).",
  });
}
