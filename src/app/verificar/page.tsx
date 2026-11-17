import type { Metadata } from "next";
import VerifyClient from "./VerifyClient";

type SearchParamsInput = Promise<{ [key: string]: string | string[] | undefined }>;

function pickStr(val: string | string[] | undefined, fallback = ""): string {
  if (Array.isArray(val)) return val[0] || fallback;
  return val || fallback;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const sp = await searchParams;
  const w = pickStr(sp.w);
  const id = pickStr(sp.id, "EG-OFICIAL");
  const c = pickStr(sp.c, "99");
  const m = pickStr(sp.m, "balotas");

  const title = w
    ? `🏆 Balota Ganadora #${w} · Sorteo ${id} | El Ganador`
    : "Constancia Oficial de Sorteo Certificado | El Ganador";
  const description = w
    ? `Resultado oficial verificado: Balota #${w} (Cartón de ${c}). Consulta pública directa en 0 pasos con sello SHA-256.`
    : "Verificación pública inmediata de sorteos certificados en El Ganador.";

  const ogQuery = new URLSearchParams({
    w: w || "77",
    id,
    c,
    m,
  }).toString();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: `/api/og-winner?${ogQuery}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og-winner?${ogQuery}`],
    },
  };
}

export default function VerifyPage() {
  return <VerifyClient />;
}
