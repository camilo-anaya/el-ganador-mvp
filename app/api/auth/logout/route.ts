import { NextResponse } from "next/server";
import { removeSession } from "../../../../lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { return await removeSession(request, NextResponse.json({ ok: true })); }
