import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedRole = url.searchParams.get("role") as "business" | "customer" | null;
  const account = await requestAccount(request, requestedRole || undefined);
  return NextResponse.json({ account });
}
