import { NextRequest, NextResponse } from "next/server";
import { isDevToolboxEnabled } from "@/lib/dev-toolbox";
import { runDevToolScenario } from "@/lib/dev-tools/server";

export async function POST(request: NextRequest) {
  if (!isDevToolboxEnabled()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return runDevToolScenario(request);
}
