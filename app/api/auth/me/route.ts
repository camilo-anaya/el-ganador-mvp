import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const account = await requestAccount(request);
  return NextResponse.json({ account });
}
