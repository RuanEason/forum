import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getSafeRedirectPath, toSignInPath } from "@/lib/auth-redirect";
import CompleteProfileForm from "./CompleteProfileForm";

type CompleteProfilePageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function CompleteProfilePage({ searchParams }: CompleteProfilePageProps) {
  const session = (await getServerSession(authOptions)) as {
    user?: { id?: string };
  } | null;
  const params = await searchParams;
  const redirectPath = getSafeRedirectPath(params.redirect);

  if (!session?.user?.id) {
    redirect(toSignInPath(redirectPath));
  }

  return <CompleteProfileForm redirectPath={redirectPath} />;
}
