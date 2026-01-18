import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  redirect(`/user/${session.user.id}`);
}