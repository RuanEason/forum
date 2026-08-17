import { notFound } from "next/navigation";
import DevToolsDashboard from "./DevToolsDashboard";
import { getDevToolboxState, isDevToolboxEnabled } from "@/lib/dev-toolbox";
import { devToolScenarios } from "@/lib/dev-tools/registry";
import { getCurrentUser, isAdminRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function DevToolsPage() {
  if (!isDevToolboxEnabled()) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user || user.banned || !isAdminRole(user.role)) {
    notFound();
  }

  const toolboxState = getDevToolboxState();

  return (
    <DevToolsDashboard
      environment={toolboxState.environment}
      scenarios={devToolScenarios}
    />
  );
}
