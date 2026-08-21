import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAuthPageRedirectPath } from "@/lib/auth-redirect";
import SignInForm from "@/app/auth/signin/SignInForm";

type SignInModalPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function SignInModalPage({ searchParams }: SignInModalPageProps) {
  const session = (await getServerSession(authOptions)) as {
    user?: { name?: string | null };
  } | null;
  const params = await searchParams;
  const redirectPath = getAuthPageRedirectPath(params.redirect);

  if (session?.user) {
    redirect(redirectPath);
  }

  return <SignInForm redirectPath={redirectPath} presentation="modal" />;
}
