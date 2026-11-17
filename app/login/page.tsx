import { redirect } from "next/navigation";

export default async function LoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; role?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params?.mode) query.set("mode", params.mode);
  if (params?.role) query.set("role", params.role);
  const qs = query.toString();
  redirect(qs ? `/ingreso?${qs}` : "/ingreso");
}
