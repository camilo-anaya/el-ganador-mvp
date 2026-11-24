"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { plans } from "../../lib/plans";

type Result = {
  status: "loading" | "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED" | "missing" | "failed";
  type?: "ticket" | "plan";
  planId?: string;
  planExpiresAt?: string | null;
  drawTitle?: string;
  ticketNumbers?: number[];
  totalAmount?: number;
  buyerName?: string;
  buyerEmail?: string;
  participationId?: string;
};

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
        if (response.status === 404) {
          if (!cancelled) setResult({ status: "missing" });
          return;
        }
        if (!response.ok) throw new Error("No se pudo consultar el estado.");
        const data = (await response.json()) as {
          type?: "ticket" | "plan";
          status?: string;
          planId?: string;
          planExpiresAt?: string | null;
          drawTitle?: string;
          ticketNumbers?: number[];
          totalAmount?: number;
          buyerName?: string;
          buyerEmail?: string;
          participationId?: string;
        };
        const status = (data.status ?? "PENDING").toUpperCase();
        if (cancelled) return;
        if (["APPROVED", "DECLINED", "ERROR", "VOIDED"].includes(status)) {
          setResult({
            status: status as Result["status"],
            type: data.type,
            planId: data.planId,
            planExpiresAt: data.planExpiresAt,
            drawTitle: data.drawTitle,
            ticketNumbers: data.ticketNumbers,
            totalAmount: data.totalAmount,
            buyerName: data.buyerName,
            buyerEmail: data.buyerEmail,
            participationId: data.participationId,
          });
          return;
        }
        setResult({
          status: "PENDING",
          type: data.type,
          planId: data.planId,
          drawTitle: data.drawTitle,
          ticketNumbers: data.ticketNumbers,
        });
        if (attempts < 20) timer = setTimeout(check, 3000);
      } catch {
        if (!cancelled) setResult({ status: "failed" });
      }
    };

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, refreshKey]);

  // Si es compra de boletas de un sorteo
  if (result.type === "ticket") {
    const isApproved = result.status === "APPROVED";
    const drawTitle = result.drawTitle || "Sorteo Oficial El Ganador";
    const numbers = result.ticketNumbers || [];
    const formattedAmount = result.totalAmount ? `$${result.totalAmount.toLocaleString("es-CO")} COP` : "";

    const whatsappShareText = encodeURIComponent(
      `¡Hola! Mis balotas oficiales en El Ganador para el sorteo *${drawTitle}* son: ${numbers
        .map((n) => `#${n}`)
        .join(", ")}. Consulta la transmisión en vivo aquí: https://el-ganador-mvp.vercel.app/sorteo-en-vivo`
    );

    return (
      <main className="paymentConfirmationPage">
        <section
          className={`paymentConfirmationCard ${isApproved ? "is-success" : "is-pending"}`}
          aria-live="polite"
        >
          <Link className="paymentConfirmationBrand" href="/">
            EL GANADOR
          </Link>

          <span
            className="paymentConfirmationIcon"
            aria-hidden="true"
            style={{
              background: isApproved ? "rgba(16, 185, 129, 0.15)" : "#fef3c7",
              color: isApproved ? "#007AFF" : "#d97706",
              fontSize: "32px",
            }}
          >
            {isApproved ? "🎉" : "◷"}
          </span>

          <p className="portalEyebrow">
            {isApproved ? "¡EMISIÓN EXITOSA DE BALOTAS!" : "VERIFICANDO PAGO WOMPI"}
          </p>

          <h1>{isApproved ? "¡Tus Balotas Están Aseguradas!" : "Confirmando tu Transacción..."}</h1>

          <p>
            {isApproved
              ? `Pago confirmado en Wompi Bancolombia para: ${drawTitle}. Tus números ya están inscritos en el cartón oficial.`
              : "Estamos validando la confirmación de Wompi con tu banco. Por favor no cierres esta ventana."}
          </p>

          {isApproved && numbers.length > 0 && (
            <div
              style={{
                width: "100%",
                background: "linear-gradient(135deg, rgba(8, 30, 20, 0.98), rgba(5, 18, 12, 0.99))",
                borderRadius: "14px",
                padding: "16px",
                border: "1.5px solid #d4af37",
                color: "#ffffff",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                margin: "8px 0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "1px", color: "#f5d47a" }}>
                  TUS NÚMEROS OFICIALES
                </span>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#6ee7b7" }}>{formattedAmount}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                {numbers.map((num) => (
                  <span
                    key={num}
                    style={{
                      background: "linear-gradient(135deg, #007AFF 0%, #0284c7 100%)",
                      color: "#ffffff",
                      fontWeight: "900",
                      fontSize: "16px",
                      padding: "6px 14px",
                      borderRadius: "999px",
                      boxShadow: "0 2px 8px rgba(0, 122, 255, 0.35)",
                    }}
                  >
                    #{num}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: "11px", opacity: 0.85, textAlign: "center", marginTop: "4px" }}>
                Comprador: <strong>{result.buyerName || "Cliente El Ganador"}</strong>
              </div>
            </div>
          )}

          {isApproved && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "6px" }}>
              <a
                href={`https://api.whatsapp.com/send?text=${whatsappShareText}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "#25D366",
                  color: "#ffffff",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "14px",
                  textDecoration: "none",
                  boxShadow: "0 3px 12px rgba(37, 211, 102, 0.35)",
                }}
              >
                <span>📲</span> Enviar Balotas a mi WhatsApp
              </a>

              <Link
                href="/sorteo-en-vivo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #007AFF 0%, #0284c7 100%)",
                  color: "#ffffff",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  fontWeight: "900",
                  fontSize: "14px",
                  textDecoration: "none",
                  boxShadow: "0 3px 12px rgba(0, 122, 255, 0.35)",
                }}
              >
                <span>🎱</span> Ir a la Sala de Sorteo en Vivo
              </Link>

              <Link
                href="/mis-boletas"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "#f1f5f9",
                  color: "#0f172a",
                  fontWeight: "800",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                Ver Mis Boletas Guardadas
              </Link>
            </div>
          )}

          {result.status === "PENDING" && (
            <button
              type="button"
              onClick={() => {
                setResult({ status: "loading" });
                setRefreshKey((key) => key + 1);
              }}
              style={{
                marginTop: "12px",
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              🔄 Consultar estado de nuevo
            </button>
          )}

          <small style={{ marginTop: "12px", opacity: 0.7 }}>Referencia: {reference || "no disponible"}</small>
        </section>
      </main>
    );
  }

  // Caso habitual: Suscripción de plan de comercio
  const planName = result.planId && Object.hasOwn(plans, result.planId) ? plans[result.planId as keyof typeof plans].name : "tu plan";
  const expiryText = result.planExpiresAt
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(result.planExpiresAt))
    : "";
  const content =
    result.status === "APPROVED"
      ? {
          icon: "✓",
          title: "Pago confirmado",
          body: `Tu plan ${planName} está activo${expiryText ? ` hasta el ${expiryText}` : ""}. Ya puedes iniciar sesión en El Ganador.`,
          tone: "success",
        }
      : result.status === "PENDING" || result.status === "loading"
      ? {
          icon: "◷",
          title: "Estamos confirmando tu pago",
          body: "Wompi aún no ha enviado la confirmación final. Esta página no activa el plan por sí sola.",
          tone: "pending",
        }
      : result.status === "missing"
      ? {
          icon: "!",
          title: "No encontramos el pago",
          body: "Revisa el enlace recibido por Wompi o vuelve a los planes para empezar de nuevo.",
          tone: "error",
        }
      : result.status === "failed"
      ? {
          icon: "!",
          title: "No pudimos consultar el estado",
          body: "Inténtalo de nuevo en unos segundos. Si Wompi te hizo un cobro, no repitas el pago hasta confirmar su estado.",
          tone: "error",
        }
      : {
          icon: "!",
          title: "El pago no fue aprobado",
          body:
            result.status === "VOIDED"
              ? "La transacción aparece anulada. Comunícate con soporte si necesitas revisar el cobro."
              : "La transacción no quedó aprobada. Si el banco muestra un débito, espera la actualización de Wompi antes de intentar de nuevo.",
          tone: "error",
        };

  return (
    <main className="paymentConfirmationPage">
      <section className={`paymentConfirmationCard is-${content.tone}`} aria-live="polite">
        <Link className="paymentConfirmationBrand" href="/">
          EL GANADOR
        </Link>
        <span className="paymentConfirmationIcon" aria-hidden="true">
          {content.icon}
        </span>
        <p className="portalEyebrow">ESTADO DEL PAGO</p>
        <h1>{content.title}</h1>
        <p>{content.body}</p>
        {result.status === "PENDING" && (
          <button
            type="button"
            onClick={() => {
              setResult({ status: "loading" });
              setRefreshKey((key) => key + 1);
            }}
          >
            Consultar nuevamente
          </button>
        )}
        {(result.status === "PENDING" ||
          result.status === "DECLINED" ||
          result.status === "ERROR" ||
          result.status === "VOIDED") && (
          <Link className="paymentConfirmationSecondary" href="/admin?mode=login">
            Volver a iniciar sesión / continuar pago
          </Link>
        )}
        {result.status === "APPROVED" && (
          <Link className="portalPrimary" href="/admin?mode=login">
            Iniciar sesión →
          </Link>
        )}
        <small>Referencia: {reference || "no disponible"}</small>
      </section>
    </main>
  );
}
