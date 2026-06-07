import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { readPendingCasdoorLogin } from "@/lib/casdoor";
import { toSignInPath } from "@/lib/auth-redirect";
import CasdoorLinkForm from "./CasdoorLinkForm";

export default async function CasdoorLinkPage() {
  const session = (await getServerSession(authOptions)) as {
    user?: { id?: string };
  } | null;

  if (session?.user?.id) {
    redirect("/");
  }

  const pending = await readPendingCasdoorLogin();

  if (!pending) {
    redirect(toSignInPath("/"));
  }

  return <CasdoorLinkForm pending={pending} />;
}
