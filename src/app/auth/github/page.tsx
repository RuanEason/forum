import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { readPendingGitHubLogin } from "@/lib/github";
import { toSignInPath } from "@/lib/auth-redirect";
import GitHubLinkForm from "./GitHubLinkForm";

export default async function GitHubLinkPage() {
  const session = (await getServerSession(authOptions)) as {
    user?: { id?: string };
  } | null;

  if (session?.user?.id) {
    redirect("/");
  }

  const pending = await readPendingGitHubLogin();

  if (!pending) {
    redirect(toSignInPath("/"));
  }

  return <GitHubLinkForm pending={pending} />;
}
