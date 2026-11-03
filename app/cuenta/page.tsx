"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import PortalAuthShell from "../components/PortalAuthShell";
import BusinessPlansPreview from "../components/BusinessPlansPreview";


type Account = { id: string; role: "business" | "customer"; display_name: string; email: string };
type Entry = { id: string; draw_id: string; ticket_numbers: string; ticket_count: number; total_amount: number; status: "reserved" | "expired"; created_at: string; expires_at: string; title: string; admin: string; emoji: string; unit_price: number };
const money = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export default function CustomerAccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [history, setHistory] = useState<Entry[]>([]);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    const response = await fetch("/api/account/history", { cache: "no-store" });
    const data = await response.json() as { history?: Entry[]; error?: string };
    if (!response.ok) throw new Error(data.error ?? "No pudimos cargar tu historial.");
    setHistory(data.history ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "login" || requestedMode === "register") setMode(requestedMode);
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then(async (data: { account?: Account }) => {
      if (!active || !data.account) return;
      setAccount(data.account);
      if (data.account.role === "customer") await loadHistory();
    }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "No pudimos conectar."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadHistory]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "login" ? form : { ...form, role: "customer" }) });
      const data = await response.json() as { account?: Account; error?: string };
      if (!response.ok || !data.account) throw new Error(data.error ?? "No pudimos crear la cuenta.");
      setAccount(data.account);
      if (data.account.role === "customer") await loadHistory();
    } catch (e) { setError(e instanceof Error ? e.message : "No pudimos iniciar sesión."); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setAccount(null); setHistory([]); }
  if (loading) return <main className="portalLoading">Cargando tu cuenta…</main>;
  if (account?.role === "business") return <PortalAuthShell audience="client" authInline><section className="portalAuthCard premiumAuthCard"><span className="premiumFormIcon">🏪</span><p className="portalEyebrow">CUENTA DE LOCAL</p><h2>Tu espacio de negocio está listo.</h2><p className="portalMuted">Entra a tu panel para administrar tus rifas, novedades y configuración.</p><a className="portalPrimary portalLinkButton" href="/admin">Abrir panel del negocio <span>→</span></a><button className="portalSwitch" onClick={() => void logout()}>Cerrar sesión</button></section></PortalAuthShell>;

  if (!account) {
    return (
      <PortalAuthShell audience="client" authMode={mode} belowContent={<BusinessPlansPreview />}>
        <section className="portalAuthCard premiumAuthCard customerAuthCard">
          <nav className="premiumAccountChoice accountTypeSwitch" aria-label="Tipo de cuenta">
            <span>{mode === "register" ? "Crear cuenta como" : "Ingresar como"}</span>
            <div>
              <button type="button" className="selected" aria-current="page">👤 Cliente</button>
              <a href={mode === "register" ? "/admin?mode=register#planes" : "/admin?mode=login&auth=1"}>🏪 Empresa o local <b>↗</b></a>
            </div>
          </nav>
          <p className="portalEyebrow">
            {mode === "login" ? "QUÉ BUENO VERTE DE NUEVO" : "REGISTRO GRATIS · PERFIL DE CLIENTE"}
          </p>
          <h2>{mode === "login" ? "Entra y sigue tus participaciones." : "Crea tu cuenta"}</h2>
          <p className="portalMuted">
            {mode === "login"
              ? "Revisa tus números y vuelve a descubrir tiendas y rifas."
              : "Explora premios y tiendas; consulta tus participaciones desde tu perfil."}
          </p>
          <form className="portalForm premiumPortalForm" onSubmit={submit}>
            {mode === "register" && (
              <label>
                Tu nombre
                <input required minLength={2} maxLength={100} autoComplete="name" placeholder="¿Cómo te llamas?" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </label>
            )}
            <label>
              Correo electrónico
              <input type="email" autoComplete="email" required placeholder="tu@correo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              Contraseña
              <input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 10 : 1} maxLength={128} placeholder={mode === "register" ? "Crea una contraseña de 10 caracteres" : "Tu contraseña"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
            {error && <p className="portalError" role="alert">{error}</p>}
            <button className="portalPrimary premiumSubmit" disabled={busy}>
              {busy ? "Un momento…" : mode === "login" ? <>Entrar a mi cuenta <span>→</span></> : <>Crear mi cuenta gratis <span>→</span></>}
            </button>
          </form>
          <a className="portalSwitch premiumSwitch portalSwitchLink" href={mode === "login" ? "/cuenta?mode=register&auth=1" : "/cuenta?mode=login&auth=1"}>
            {mode === "login" ? <>¿Primera vez? <b>Crear una cuenta</b></> : <>¿Ya tienes cuenta? <b>Iniciar sesión</b></>}
          </a>
        </section>
      </PortalAuthShell>
    );
  }

  return <main className="portalCustomer"><header className="portalHeader"><a className="portalBrand" href="/">EL GANADOR</a><a className="portalPrimary portalLinkButton" href="/">Explorar premios</a></header>{account ? <section className="portalCustomerMain"><div className="portalCustomerHero"><div><p className="portalEyebrow">TU ESPACIO</p><h1>Hola, {account.display_name}</h1><p>Consulta tus participaciones y vuelve a explorar el marketplace cuando quieras.</p></div><button className="portalExit" onClick={() => void logout()}>Salir</button></div><section className="portalPanel"><div className="portalPanelHeading"><div><p className="portalEyebrow">ACTIVIDAD</p><h2>Compras y participaciones</h2><p>Tu historial de números reservados con esta cuenta.</p></div></div>{history.length ? <div className="portalCustomerHistory">{history.map((entry) => { let numbers = ""; try { numbers = (JSON.parse(entry.ticket_numbers) as number[]).map((n) => String(n).padStart(4, "0")).join(", "); } catch { numbers = "—"; } return <article className="portalHistoryRow" key={entry.id}><span className="portalHistoryEmoji">{entry.emoji}</span><div className="portalHistoryInfo"><b>{entry.title}</b><small>{entry.admin} · {new Date(entry.created_at).toLocaleString("es-CO")}</small><small>Número{entry.ticket_count === 1 ? "" : "s"}: {numbers}</small><small>Valor mostrado: {money(entry.total_amount)}</small></div><span className={`portalStatus ${entry.status === "reserved" ? "pendingHistory" : "draftStatus"}`}>{entry.status === "reserved" ? "Apartado · pendiente" : "Reserva vencida"}</span></article>; })}</div> : <div className="portalEmpty"><span>🎟️</span><h3>Aún no tienes participaciones</h3><p>Explora los premios de los locales y elige un cartón cuando quieras.</p><a className="portalPrimary portalLinkButton" href="/">Ver sorteos</a></div>}<p className="portalPrivateNote">Las reservas duran 10 minutos y no son compras pagadas. Los pagos y los resultados reales aún no están conectados en esta demostración.</p></section></section> : <section className="portalAuthCard customerAuthCard"><div className="portalUserIcon">👤</div><p className="portalEyebrow">PERFIL DE CLIENTE</p><h1>{mode === "login" ? "Entra a tu cuenta" : "Crea tu cuenta"}</h1><p className="portalMuted">Guarda el historial de participaciones y vuelve a explorar tiendas, novedades y rifas.</p><form className="portalForm" onSubmit={submit}>{mode === "register" && <label>Nombre<input required minLength={2} maxLength={100} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></label>}<label>Correo electrónico<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Contraseña<input type="password" required minLength={mode === "register" ? 10 : 1} maxLength={128} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <p className="portalError" role="alert">{error}</p>}<button className="portalPrimary" disabled={busy}>{busy ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}</button></form><button className="portalSwitch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "¿Primera vez? Crear una cuenta" : "Ya tengo una cuenta · Entrar"}</button><p className="portalDemoNote">Esta cuenta guarda participaciones y reservas de demostración; los pagos todavía no están conectados.</p><a className="portalBack" href="/">← Volver al marketplace</a></section>}</main>;
}
