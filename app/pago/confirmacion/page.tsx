import PaymentConfirmation from "../../components/PaymentConfirmation";

export const dynamic = "force-dynamic";

export default async function PaymentConfirmationPage({ searchParams }: {
  searchParams: Promise<{ reference?: string | string[] }>;
}) {
  const params = await searchParams;
  const reference = typeof params.reference === "string" ? params.reference : "";
  return <PaymentConfirmation reference={reference} />;
}
