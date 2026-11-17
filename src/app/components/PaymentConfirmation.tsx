"use client";

import { useEffect, useState } from "react";
import { plans } from "../../lib/plans";

type Result = { status: "loading" | "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED" | "missing" | "failed"; planId?: string; planExpiresAt?: string | null };

export default function PaymentConfirmation({ reference }: { reference: string }) {
  const [result, setResult] = useState<Result>({ status: reference ? "loading" : "missing" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`, { cache: "no-store" });
        if (response.status === 404) { if (!cancelled) setResult({ status: "missing" }); return; }
        if (!response.ok) throw new Error("No se pudo consultar el estado.");
        const data = await response.json() as { status?: string; planId?: string; planExpiresAt?: string | null };
        const status = (data.status ?? "PENDING").toUpperCase();
        if (cancelled) return;
        if (["APPROVED", "DECLINED", "ERROR", "VOIDED"].includes(status)) {
          setResult({ status: status as Result["status"], planId: data.planId, planExpiresAt: data.planExpiresAt });
          return;
        }
        setResult({ status: "PENDING", planId: data.planId });
        if (attempts < 20) timer = setTimeout(check, 3000);
      } catch {
        if (!cancelled) setResult({ status: "failed" });
      }
    };

    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [reference, refreshKey]);

  const planName = result.planId && Object.hasOwn(plans, result.planId) ? plans[result.planId as keyof typeof plans].name : "tu plan";
  const expiryText = result.planExpiresAt ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(result.planExpiresAt)) : "";
  const content = result.status === "APPROVED"
    ? { icon: "✓", title: "Pago confirmado", body: `Tu plan ${planName} está activo${expiryText ? ` hasta el ${expiryText}` : ""}. Ya puedes iniciar sesión en El Ganador.`, tone: "success" }
    : result.status === "PENDING" || result.status === "loading"
      ? { icon: "◷", title: "Estamos confirmando tu pago", body: "Wompi aún no ha enviado la confirmación final. Esta página no activa el plan por sí sola.", tone: "pending" }
      : result.status === "missing"
        ? { icon: "!", title: "No encontramos el pago", body: "Revisa el enlace recibido por Wompi o vuelve a los planes para empezar de nuevo.", tone: "error" }
        : result.status === "failed"
          ? { icon: "!", title: "No pudimos consultar el estado", body: "Inténtalo de nuevo en unos segundos. Si Wompi te hizo un cobro, no repitas el pago hasta confirmar su estado.", tone: "error" }
          : { icon: "!", title: "El pago no fue aprobado", body: result.status === "VOIDED" ? "La transacción aparece anulada. Comunícate con soporte si necesitas revisar el cobro." : "La transacción no quedó aprobada. Si el banco muestra un débito, espera la actualización de Wompi antes de intentar de nuevo.", tone: "error" };

  return (
    <main className="paymentConfirmationPage">
      <section className={`paymentConfirmationCard is-${content.tone}`} aria-live="polite">
        <a className="paymentConfirmationBrand" href="/">EL GANADOR</a>
        <span className="paymentConfirmationIcon" aria-hidden="true">{content.icon}</span>
        <p className="portalEyebrow">ESTADO DEL PAGO</p>
        <h1>{content.title}</h1>
        <p>{content.body}</p>
        {result.status === "PENDING" && <button type="button" onClick={() => { setResult({ status: "loading" }); setRefreshKey((key) => key + 1); }}>Consultar nuevamente</button>}
        {(result.status === "PENDING" || result.status === "DECLINED" || result.status === "ERROR" || result.status === "VOIDED") && <a className="paymentConfirmationSecondary" href="/admin?mode=login">Volver a iniciar sesión / continuar pago</a>}
        {result.status === "APPROVED" && <a className="portalPrimary" href="/admin?mode=login">Iniciar sesión →</a>}
        <small>Referencia: {reference || "no disponible"}</small>
      </section>
    </main>
  );
}
