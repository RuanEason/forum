import { NextRequest, NextResponse } from "next/server";
import { isProductionEnvironment } from "@/lib/dev-toolbox";
import {
  createHealthcheckPayload,
  getHealthcheckSecretFromHeaders,
  isHealthcheckSecretValid,
} from "@/lib/healthcheck";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Return a minimal database health result for internal monitoring.
 *
 * Production requests require the internal health-check secret; unauthenticated
 * production requests intentionally look like a missing route.
 */
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.HEALTHCHECK_SECRET;
  const providedSecret = getHealthcheckSecretFromHeaders(request.headers);

  if (!isHealthcheckSecretValid(providedSecret, expectedSecret)) {
    const status = isProductionEnvironment() ? 404 : 401;

    return NextResponse.json(
      { error: status === 404 ? "Not Found" : "Unauthorized" },
      { status },
    );
  }

  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      createHealthcheckPayload(true, `${Date.now() - startTime}ms`),
    );
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      createHealthcheckPayload(false, `${Date.now() - startTime}ms`),
      { status: 503 },
    );
  }
}
