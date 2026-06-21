import { notFound } from "next/navigation";
import DevToolsDashboard from "./DevToolsDashboard";
import { getDevToolboxState, isDevToolboxEnabled } from "@/lib/dev-toolbox";
import { devToolScenarios } from "@/lib/dev-tools/registry";

export default function DevToolsPage() {
  if (!isDevToolboxEnabled()) {
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
