import ConfirmEmailChangeForm from "./ConfirmEmailChangeForm";

type ConfirmEmailChangePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ConfirmEmailChangePage({ searchParams }: ConfirmEmailChangePageProps) {
  const params = await searchParams;
  return <ConfirmEmailChangeForm token={params.token || ""} />;
}
