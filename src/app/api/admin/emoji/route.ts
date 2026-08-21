import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/server-auth";

export const runtime = "nodejs";

function retiredResponse() {
  return NextResponse.json(
    { error: "The admin custom emoji endpoint has been retired; use /api/emoji" },
    { status: 410 },
  );
}

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  return retiredResponse();
}

export async function POST() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  return retiredResponse();
}

export async function DELETE() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  return retiredResponse();
}
