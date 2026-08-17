import { NextRequest, NextResponse } from "next/server";
import { isDevToolboxEnabled } from "@/lib/dev-toolbox";
import { runDevToolScenario } from "@/lib/dev-tools/server";
import { requireAdminUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isDevToolboxEnabled()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  return runDevToolScenario(request);
}
