"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import PortalAuthShell from "../components/PortalAuthShell";
import { RaffleTerritoryFields } from "../components/RaffleTerritoryFields";
import RaffleTerritoryNotice from "../components/RaffleTerritoryNotice";
import { describeCartons, describeRaffleCapacity, planCartonOptions, plans as availablePlans, raffleTerritoryNotice, type PlanId } from "../../lib/plans";
import { describeRaffleTerritory, type RaffleTerritoryScope, type StoredRaffleTerritoryScope } from "../../lib/raffle-territory";


type Account = { id: string; role: "business" | "customer"; display_name: string; email: string; business_name: string; business_city: string; business_description: string; category: string; plan: string; plan_expires_at: string | null; created_at: string; entity_type: string; legal_name: string; tax_id: string; identity_number: string; business_phone: string; business_address: string; business_photo_url: string };
type Draw = { id: string; title: string; category: string; description: string; emoji: string; unit_price: number; total_tickets: number; product_value: number; image_url: string; published: number; live: number; start_mode: string; start_threshold: number; scheduled_at: string | null; started_at: string | null; created_at: string; sold: number; reserved: number; available: number; category_details: string; territory_scope: StoredRaffleTerritoryScope; territory_department: string; territory_municipality: string; territory_municipalities: string; territory_departments: string };
type Document = { id: string; document_type: string; file_name: string; review_status: "pending" | "approved" | "rejected"; uploaded_at: string };
type Post = { id: string; content: string; image_url: string; created_at: string; business_name?: string; business_city?: string; category?: string };
type Plan = (typeof availablePlans)[PlanId];
type Draft = { drawId?: string; title: string; category: string; description: string; emoji: string; unitPrice: string; productValue: string; totalTickets: string; published: boolean; startMode: "threshold" | "date"; startThreshold: string; scheduledAt: string; imageUrl: string; details: Record<string, string>; territoryScope: RaffleTerritoryScope; territoryDepartment: string; territoryMunicipality: string; territoryMunicipalities: string; territoryDepartments: string };

const categories = ["Tecnología", "Celulares y accesorios", "Computación", "Electrodomésticos", "Motos y movilidad", "Automóviles", "Bicicletas", "Repuestos y accesorios", "Joyería y relojería", "Gaming y videojuegos", "Hogar y decoración", "Moda y accesorios", "Calzado", "Alimentos y bebidas", "Restaurantes y cafés", "Panadería y repostería", "Supermercado y mercado", "Belleza y cuidado personal", "Salud y bienestar", "Deportes y fitness", "Mascotas", "Bebés y niños", "Educación", "Libros y papelería", "Arte y entretenimiento", "Música", "Turismo y experiencias", "Ferretería", "Construcción", "Inmobiliaria", "Agro y campo", "Transporte", "Servicios profesionales", "Fotografía", "Otros"];
const specifics: Record<string, [string, string][]> = {
  Tecnología: [["Marca y modelo", "brandModel"], ["Garantía", "warranty"], ["Qué incluye", "included"]],
  Motos: [["Modelo y año", "modelYear"], ["Cilindraje y especificaciones", "engine"], ["Documentos y entrega", "delivery"]],
  Joyería: [["Materiales y quilates", "materials"], ["Certificado", "certificate"], ["Piezas incluidas", "pieces"]],
  Gaming: [["Edición y capacidad", "edition"], ["Accesorios incluidos", "included"], ["Garantía", "warranty"]],
  Hogar: [["Marca y referencia", "brandModel"], ["Medidas y materiales", "specification"], ["Entrega y garantía", "delivery"]],
  Moda: [["Marca y referencia", "brandModel"], ["Talla o medidas", "size"], ["Materiales", "materials"]],
};
const docsByCategory: Record<string, string[]> = {
  Tecnología: ["Registro del negocio", "Identificación del representante", "Soporte de propiedad del premio", "Garantía o factura"],
  Motos: ["Registro del negocio", "Identificación del representante", "Soporte de disponibilidad", "Documentación del vehículo"],
  Joyería: ["Registro del negocio", "Identificación del representante", "Soporte de propiedad", "Certificado de autenticidad"],
  Gaming: ["Registro del negocio", "Identificación del representante", "Soporte de propiedad del premio", "Garantía o factura"],
};
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);
const count = (value: number) => new Intl.NumberFormat("es-CO").format(value || 0);
const liveDrawPlanSummary = Object.values(availablePlans).filter((candidate) => candidate.liveDrawTools).map((candidate) => `${candidate.name}: ${candidate.liveDrawTools?.annualQuota} usos de herramienta al año`).join(" · ");
const detailRead = (raw: string) => { try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; } };
const freshDraft = (category = "Tecnología", cartonSize = 100, published = true): Draft => ({ title: "", category, description: "", emoji: "🎁", unitPrice: "20000", productValue: "0", totalTickets: String(cartonSize), published, startMode: "threshold", startThreshold: "80", scheduledAt: "", imageUrl: "", details: {}, territoryScope: "municipal", territoryDepartment: "", territoryMunicipality: "", territoryMunicipalities: "", territoryDepartments: "" });
const liveDrawPlanNames = Object.values(availablePlans).filter((candidate) => candidate.liveDrawTools !== null).map((candidate) => candidate.name).join(" y ");

export default function AdminPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [renewBusy, setRenewBusy] = useState(false);
  const [renewError, setRenewError] = useState("");
  const [form, setForm] = useState({ displayName: "", email: "", password: "", businessName: "", category: "", city: "", description: "", plan: "", entityType: "natural", legalName: "", taxId: "", identityNumber: "", phone: "", address: "" });
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [rutDocument, setRutDocument] = useState<File | null>(null);
  const [chamberDocument, setChamberDocument] = useState<File | null>(null);
  const [businessPhotoFile, setBusinessPhotoFile] = useState<File | null>(null);
  const [tab, setTab] = useState("Resumen");
  const [draws, setDraws] = useState<Draw[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [monthlyRafflesUsed, setMonthlyRafflesUsed] = useState(0);
  const [yearlyRafflesUsed, setYearlyRafflesUsed] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [docType, setDocType] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [profile, setProfile] = useState({ name: "", city: "", category: "Tecnología", description: "" });
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    const response = await fetch("/api/admin/draws", { cache: "no-store" });
    const data = await response.json() as { error?: string; account?: Account; draws?: Draw[]; plan?: Plan; monthlyRafflesUsed?: number; yearlyRafflesUsed?: number };
    if (!response.ok || !data.account) throw new Error(data.error ?? "Inicia sesión con una cuenta de negocio.");
    setAccount(data.account); setDraws(data.draws ?? []); setPlan(data.plan ?? null); setMonthlyRafflesUsed(data.monthlyRafflesUsed ?? 0); setYearlyRafflesUsed(data.yearlyRafflesUsed ?? 0);
    setProfile({ name: data.account.business_name, city: data.account.business_city, category: data.account.category, description: data.account.business_description });
    const [docs, news] = await Promise.all([fetch("/api/admin/documents", { cache: "no-store" }), fetch("/api/news", { cache: "no-store" })]);
    const docData = await docs.json() as { documents?: Document[] };
    const newsData = await news.json() as { posts?: Post[] };
    setDocuments(docData.documents ?? []); setPosts(newsData.posts ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "register" || window.location.hash === "#registro-empresa") setMode("register");
    else if (requestedMode === "login") setMode("login");
    const requestedPlan = params.get("plan");
    if (requestedPlan && Object.hasOwn(availablePlans, requestedPlan)) setForm((current) => ({ ...current, plan: requestedPlan }));
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then((data: { account?: Account }) => {
      if (!active) return;
      if (data.account?.role === "business") { setAccount(data.account); void loadData().catch((e) => setError(e.message)); }
      else if (data.account?.role === "customer") setAuthError("Esta es la entrada para locales. Usa Mi cuenta para clientes.");
    }).catch(() => { if (active) setAuthError("No pudimos conectar con la plataforma."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadData]);

  useEffect(() => {
    if (!account) return;
    const timer = window.setInterval(() => { void loadData().catch(() => undefined); }, 10000);
    return () => window.clearInterval(timer);
  }, [account, loadData]);

  const sold = draws.reduce((sum, d) => sum + d.sold, 0);
  const reservations = draws.reduce((sum, d) => sum + d.reserved, 0);
  const available = draws.reduce((sum, d) => sum + d.available, 0);
  const activeRaffles = draws.filter((draw) => Boolean(draw.published)).length;
  const hasMonthlyRaffleLimit = plan?.rafflesPerMonth !== null && plan?.rafflesPerMonth !== undefined;
  const raffleUsage = plan?.demoOnly ? "Prueba" : hasMonthlyRaffleLimit ? `${monthlyRafflesUsed} / ${plan?.rafflesPerMonth}` : `${activeRaffles} / ${plan?.maxSimultaneousRaffles ?? "∞"}`;
  const raffleUsageHint = plan?.demoOnly ? "Sin publicaciones reales" : hasMonthlyRaffleLimit ? "Rifas publicadas este mes" : "Rifas publicadas actualmente";
  const raffleUsagePercent = plan?.demoOnly ? 0 : hasMonthlyRaffleLimit
    ? Math.min(100, monthlyRafflesUsed * 100 / (plan?.rafflesPerMonth ?? 1))
    : plan?.maxSimultaneousRaffles ? Math.min(100, activeRaffles * 100 / plan.maxSimultaneousRaffles) : 0;
  const planExpiryLabel = account?.plan_expires_at
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(account.plan_expires_at))
    : plan?.demoOnly ? "Sin vencimiento" : "Pendiente de activación";
  const categoryFields = useMemo(() => specifics[draft?.category ?? "Tecnología"] ?? [["Especificaciones", "specification"], ["Entrega y garantía", "delivery"]], [draft?.category]);
  const availableCartonSizes = useMemo(() => {
    if (!plan) return [100];
    if (!plan.cartonSizes) return planCartonOptions(plan);
    const publishedDraws = draws.filter((draw) => Boolean(draw.published) && draw.id !== draft?.drawId);
    return planCartonOptions(plan).filter((size) =>
      publishedDraws.filter((draw) => draw.total_tickets === size).length < plan.cartonSizes!.filter((allowed) => allowed === size).length,
    );
  }, [plan, draws, draft?.drawId]);
  const selectedBusinessPlan = Object.hasOwn(availablePlans, form.plan) ? availablePlans[form.plan as PlanId] : null;

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuthError("");
    if (mode === "register" && !selectedBusinessPlan) { setAuthError("Selecciona uno de los cuatro planes pagos o la demo gratis."); return; }
    if (mode === "register" && !identityDocument) { setAuthError("Adjunta la identificación del titular o representante legal."); return; }
    if (mode === "register" && form.entityType === "legal" && (!rutDocument || !chamberDocument)) { setAuthError("Para una persona jurídica adjunta el RUT y el certificado vigente de Cámara de Comercio."); return; }
    setAuthBusy(true);
    try {
      let requestBody: BodyInit;
      const headers: Record<string, string> = {};
      if (mode === "login") {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify({ email: form.email, password: form.password });
      } else {
        const body = new FormData();
        Object.entries({ ...form, displayName: form.legalName, role: "business" }).forEach(([key, value]) => body.set(key, value));
        if (identityDocument) body.set("identityDocument", identityDocument);
        if (rutDocument) body.set("rutDocument", rutDocument);
        if (chamberDocument) body.set("chamberDocument", chamberDocument);
        if (businessPhotoFile) body.set("businessPhoto", businessPhotoFile);
        requestBody = body;
      }
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", headers, body: requestBody });
      const data = await response.json() as { account?: Account; checkoutUrl?: string; error?: string };
      if (response.ok && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      if (!response.ok || !data.account) throw new Error(data.error ?? "No pudimos iniciar sesión.");
      if (data.account.role !== "business") throw new Error("Esta cuenta corresponde a un cliente.");
      setAccount(data.account); await loadData();
    } catch (e) { setAuthError(e instanceof Error ? e.message : "No pudimos iniciar sesión."); }
    finally { setAuthBusy(false); }
  }

  async function renewPlan() {
    setRenewBusy(true); setRenewError("");
    try {
      const response = await fetch("/api/payments/renew", { method: "POST" });
      const data = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error ?? "No pudimos iniciar la renovación.");
      window.location.assign(data.checkoutUrl);
    } catch (e) { setRenewError(e instanceof Error ? e.message : "No pudimos iniciar la renovación."); }
    finally { setRenewBusy(false); }
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return; if (plan?.demoOnly && draft.published) { setError("El plan Gratis es solo de prueba y no puede publicar rifas reales."); return; } setBusy(true); setError(""); setNotice("");
    try {
      const body = { ...draft, unitPrice: Number(draft.unitPrice), productValue: Number(draft.productValue), totalTickets: Number(draft.totalTickets), startThreshold: Number(draft.startThreshold), scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : "" };
      const response = await fetch("/api/admin/draws", { method: draft.drawId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error ?? "No pudimos guardar la rifa.");
      setDraft(null); setNotice(data.message ?? "Cambios guardados."); await loadData();
    } catch (e) { setError(e instanceof Error ? e.message : "No pudimos guardar la rifa."); }
    finally { setBusy(false); }
  }

  async function uploadImage(file: File, assign: (url: string) => void) {
    setImageBusy(true); setError("");
    try { const body = new FormData(); body.set("file", file); const response = await fetch("/api/admin/images", { method: "POST", body }); const data = await response.json() as { imageUrl?: string; error?: string }; if (!response.ok || !data.imageUrl) throw new Error(data.error ?? "No pudimos subir la foto."); assign(data.imageUrl); }
    catch (e) { setError(e instanceof Error ? e.message : "No pudimos subir la foto."); }
    finally { setImageBusy(false); }
  }

  async function saveNews(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      let imageUrl = "";
      if (postImage) { const body = new FormData(); body.set("file", postImage); const upload = await fetch("/api/admin/images", { method: "POST", body }); const uploaded = await upload.json() as { imageUrl?: string; error?: string }; if (!upload.ok || !uploaded.imageUrl) throw new Error(uploaded.error ?? "No pudimos subir la foto."); imageUrl = uploaded.imageUrl; }
      const response = await fetch("/api/admin/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: postText, imageUrl }) });
      const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error ?? "No pudimos publicar.");
      setPostText(""); setPostImage(null); setNotice("Actualización publicada para clientes y locales."); await loadData();
    } catch (e) { setError(e instanceof Error ? e.message : "No pudimos publicar."); } finally { setBusy(false); }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!docFile) { setError("Elige un archivo PDF, JPG o PNG."); return; }
    setDocBusy(true); setError(""); setNotice("");
    try { const body = new FormData(); body.set("documentType", docType); body.set("file", docFile); const response = await fetch("/api/admin/documents", { method: "POST", body }); const data = await response.json() as { error?: string; message?: string }; if (!response.ok) throw new Error(data.error ?? "No pudimos subir el archivo."); setNotice(data.message ?? "Archivo recibido."); setDocFile(null); await loadData(); }
    catch (e) { setError(e instanceof Error ? e.message : "No pudimos subir el archivo."); } finally { setDocBusy(false); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { const response = await fetch("/api/admin/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }); const data = await response.json() as { error?: string; message?: string }; if (!response.ok) throw new Error(data.error ?? "No pudimos guardar el perfil."); setNotice(data.message ?? "Perfil guardado."); await loadData(); }
    catch (e) { setError(e instanceof Error ? e.message : "No pudimos guardar el perfil."); } finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setAccount(null); setDraws([]); }
  function editDraw(draw?: Draw) {
    if (!draw) { setDraft(freshDraft(account?.category, availableCartonSizes[0] ?? planCartonOptions(plan ?? availablePlans.gratis)[0] ?? 100, !plan?.demoOnly)); return; }
    const details = detailRead(draw.category_details);
    setDraft({ drawId: draw.id, title: draw.title, category: draw.category, description: draw.description, emoji: draw.emoji, unitPrice: String(draw.unit_price), productValue: String(draw.product_value), totalTickets: String(draw.total_tickets), published: Boolean(draw.published), startMode: draw.start_mode === "threshold" ? "threshold" : "date", startThreshold: String(draw.start_threshold), scheduledAt: draw.scheduled_at ? new Date(draw.scheduled_at).toISOString().slice(0, 16) : "", imageUrl: draw.image_url, details, territoryScope: draw.territory_scope === "departmental" || draw.territory_scope === "national" ? draw.territory_scope : "municipal", territoryDepartment: draw.territory_department ?? "", territoryMunicipality: draw.territory_municipality ?? "", territoryMunicipalities: draw.territory_municipalities ?? "", territoryDepartments: draw.territory_departments ?? "" });
  }

  if (loading) return <main className="portalLoading">Preparando el panel del negocio…</main>;
  if (!account) return (
    <PortalAuthShell
      audience="business"
      wideAuthPanel={mode === "register"}
      authMode={mode}
      belowContent={mode === "register" ? ({ openAuth }) => (
        <section className="businessPricingSection" aria-labelledby="businessPlansHeading">
          <header className="businessPricingHeader">
            <div>
              <p className="portalEyebrow">PASO 2 · PLAN PARA TU EMPRESA</p>
              <h2 id="businessPlansHeading">Elige el plan para tu local</h2>
              <p>Compara límites, herramientas y precios. El plan Gratis te permite conocer el paso a paso antes de contratar.</p>
            </div>
            <span className="businessPricingBadge">4 planes pagos · valores en COP</span>
          </header>
          <div className={`businessTrialCard ${form.plan === "gratis" ? "isSelected" : ""}`}><div><p className="portalEyebrow">PRUEBA GRATUITA · APARTE DE LOS PLANES PAGOS</p><strong>Gratis · panel de demostración</strong><p>Explora el panel y prepara borradores; no permite publicar rifas ni recibir ventas reales.</p></div><button type="button" aria-pressed={form.plan === "gratis"} onClick={() => setForm({ ...form, plan: "gratis" })}>{form.plan === "gratis" ? "Demo elegida ✓" : "Elegir demo gratis"}</button></div><div className="businessPricingCards">
            {(Object.entries(availablePlans) as [PlanId, (typeof availablePlans)[PlanId]][]).filter(([planId]) => planId !== "gratis").map(([planId, plan]) => (
              <article key={planId} className={`businessPricingCard ${form.plan === planId ? "isSelected" : ""}`}>
                <div className="businessPricingIdentity">
                  <div className="businessPricingCardTop"><span>{plan.name}</span>{form.plan === planId && <b>✓ Seleccionado</b>}</div>
                  <p className="businessPricingTagline">{plan.tagline}</p>
                  <div className="businessPricingPrice"><strong>{plan.subscriptionPrice === 0 ? "Gratis" : money(plan.subscriptionPrice)}</strong><span>{plan.subscriptionPrice === 0 ? "" : plan.subscriptionPeriod}</span></div>
                </div>
                <ul>
                  <li><span>✓</span><div><b>{describeRaffleCapacity(plan)}</b></div></li>
                  <li><span>✓</span><div>{describeCartons(plan.cartonSizes, plan.maxTicketsPerDraw)}</div></li>
                  <li><span>✓</span><div>Tope de venta bruta: <b>{money(plan.maxRaffleGain)} por rifa</b></div></li>
                  <li><span>✓</span><div>Comisión de plataforma por cada rifa jugada: <b>{plan.commissionPercent}%</b></div></li>
                  <li><span>✓</span><div>Panel <b>{plan.panelAccess.toLowerCase()}</b> · {plan.businessProfile ? "perfil empresarial" : "sin tienda empresarial"}</div></li>
                  {plan.businessProfile && <li><span>✓</span><div>Tienda online con perfil empresarial y lista de productos con fotos y descripciones</div></li>}
                  <li><span>✓</span><div>Descripción, foto del producto y elección de la fecha</div></li>
                  {planId !== "gratis" && <li><span>✓</span><div>Vincula Nequi, Bancolombia, cuenta de ahorros u otra cuenta preferida</div></li>}
                  {planId !== "gratis" && <li><span>✓</span><div>Vinculación de redes sociales con el perfil empresarial</div></li>}
                  <li><span>✓</span><div>Comparte el enlace de tu rifa</div></li>
                  <li><span>✓</span><div>{planId === "pro" || planId === "premium" || planId === "empresarial" ? "Soporte prioritario por chat 24/7" : "Soporte por chat"}</div></li>
                  {plan.crm && <><li><span>✓</span><div>CRM y base de datos de clientes</div></li><li><span>✓</span><div>Envío de ofertas por WhatsApp, correo y notificaciones desde El Ganador</div></li></>}
                  {plan.liveDrawTools && <li><span>✓</span><div>Microjuegos El Ganador: balotas y ruleta personalizable para 10, 20, 30 o 50 participantes · <b>{plan.liveDrawTools.annualQuota} usos de la herramienta al año</b></div></li>}
                  {plan.features.map((feature) => <li key={feature}><span>✓</span><div>{feature}</div></li>)}
                </ul>
                <button type="button" className="businessPlanSelectButton" aria-pressed={form.plan === planId} onClick={() => setForm({ ...form, plan: planId })}>
                  {form.plan === planId ? "Plan elegido ✓" : "Elegir este plan"}
                </button>
              </article>
            ))}
          </div>
          <RaffleTerritoryNotice />
          <section className="businessTechPromo" aria-labelledby="businessTechHeading">
            <div className="businessTechMark" aria-hidden="true">🎱<span>+</span>🎡</div>
            <div className="businessTechCopy">
              <p className="portalEyebrow">NUESTRA TECNOLOGÍA · EL PLUS DE EL GANADOR</p>
              <h3 id="businessTechHeading">Una pasarela de rifas con experiencias propias.</h3>
              <p>Conectamos locales, premios y clientes. Estamos desarrollando dos formas de vivir el sorteo: balotas digitales para rifas numeradas y una ruleta personalizable para 10, 20, 30 o 50 participantes.</p>
              <div className="businessTechModes"><span>🎱 Balotas digitales</span><span>🎡 Ruleta del local</span></div>
              <small>Acceso según el plan: {liveDrawPlanSummary}. El cupo de la herramienta no reemplaza la autorización de cada rifa.</small>
            </div>
            <a className="businessTechLink" href="/sorteo-en-vivo">Conocer la demo <span>↗</span></a>
            <p className="businessTechDisclosure">La demo es visual. El motor verificable y los pagos para rifas reales aún no están conectados.</p>
          </section>
          <div className="businessPlanContinue">
            <p aria-live="polite">{selectedBusinessPlan ? selectedBusinessPlan.demoOnly ? <>Elegiste Gratis: se abrirá un panel de prueba sin publicación de rifas reales.</> : <>Elegiste <b>{selectedBusinessPlan.name}</b>. Después de completar tus datos, continuarás al checkout seguro de Wompi. Podrás elegir PSE entre los medios habilitados para el comercio y el acceso se activará cuando Wompi confirme el pago.</> : "Elige uno de los cuatro planes pagos o la demo gratis."}</p>
            <button type="button" className="portalPrimary premiumSubmit" disabled={!selectedBusinessPlan} onClick={openAuth}>
              {selectedBusinessPlan ? "Continuar al registro · " + selectedBusinessPlan.name + " →" : "Elige un plan para continuar"}
            </button>
          </div>
          <aside className="businessPricingDisclaimer" aria-label="Estado de pagos de planes">
            <strong>Estado de pagos</strong>
            <p>PSE aún requiere configuración con las credenciales comerciales de Wompi; este sitio no simula cobros ni activa planes pagos. El alta tampoco autoriza rifas reales.</p>
          </aside>
        </section>
      ) : null}
    >
      <section id="registro-empresa" className={`portalAuthCard premiumAuthCard businessAuthCard ${mode === "register" ? "businessRegisterCard" : ""}`}>
        <div className="premiumFormTopline"><span className="premiumFormIcon">🏪</span><span className="premiumFormMiniTag">ACCESO DE NEGOCIO</span></div>
        <nav className="premiumAccountChoice accountTypeSwitch" aria-label="Tipo de cuenta">
          <span>{mode === "register" ? "Crear cuenta como" : "Ingresar como"}</span>
          <div>
            <a href={`/cuenta?mode=${mode}&auth=1`}>👤 Cliente</a>
            <button type="button" className="selected" aria-current="page">🏪 Empresa o local</button>
          </div>
        </nav>
        <p className="portalEyebrow">{mode === "login" ? "BIENVENIDO DE VUELTA" : "PASO 1 · DATOS DE ACCESO Y DEL LOCAL"}</p>
        <h2>{mode === "login" ? "Entra al panel de tu local." : "Crea la cuenta de tu empresa."}</h2>
        <p className="portalMuted">{mode === "login" ? "Revisa tus premios, ventas y novedades desde un solo lugar." : "Completa los datos y elige uno de los cuatro planes pagos o la demo gratis."}</p>
        <a className="portalSwitch premiumSwitch portalSwitchLink" href={mode === "login" ? "/admin?mode=register#planes" : "/admin?mode=login&auth=1"}>
          {mode === "login" ? <>¿Nuevo en El Ganador? <b>Registra tu local</b></> : <>¿Ya tienes cuenta? <b>Iniciar sesión</b></>}
        </a>
        <form id="business-registration" className="portalForm premiumPortalForm" onSubmit={submitAuth}>
          {mode === "register" && <>
            <div className="portalFormGrid">
              <label>{form.entityType === "natural" ? "Nombre completo del titular" : "Razón social registrada"}<input required minLength={3} maxLength={150} autoComplete={form.entityType === "legal" ? "organization" : "name"} value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} /></label>
              <label>Nombre público del local<input required minLength={2} maxLength={100} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></label>
            </div>
            <div className="businessLegalPanel">
              <div className="businessLegalHeading"><span>DATOS LEGALES DEL TITULAR</span><small>Se usarán para validar la identidad y el negocio.</small></div>
              <label>Tipo de titular<select value={form.entityType} onChange={(e) => { const entityType = e.target.value; setForm({ ...form, entityType }); if (entityType === "natural") setChamberDocument(null); }}><option value="natural">Persona natural</option><option value="legal">Empresa · persona jurídica</option></select></label>
              <label>{form.entityType === "legal" ? "Cédula del representante legal" : "Número de cédula del titular"}<input required minLength={5} maxLength={30} autoComplete="off" value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} /></label>
              <label>{form.entityType === "legal" ? "NIT de la empresa, incluido el dígito de verificación" : "RUT / NIT · si ya lo tienes"}<input required={form.entityType === "legal"} minLength={form.entityType === "legal" ? 5 : undefined} maxLength={30} value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} /></label>
            </div>
            <div className="businessContactPanel">
              <div className="businessLegalHeading"><span>CONTACTO Y ACCESO A LA CUENTA</span><small>Mantén juntos los datos de contacto del negocio.</small></div>
              <label>Teléfono de contacto<input required type="tel" autoComplete="tel" maxLength={24} placeholder="+57 300 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <div className="portalFormGrid businessContactGrid">
                <label>Correo electrónico<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                <label>Contraseña<input required minLength={10} maxLength={20} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><small>De 10 a 20 caracteres, con al menos una mayúscula y un símbolo.</small></label>
              </div>
            </div>
            <div className="businessProfileFields">
              <div className="businessLegalHeading"><span>PERFIL DEL NEGOCIO</span><small>Información que verán tus clientes.</small></div>
              <div className="portalFormGrid">
                <label>Categoría del negocio<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="" disabled>Selecciona una categoría</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>Ciudad<input required maxLength={100} placeholder="Bogotá" autoComplete="address-level2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              </div>
              <div className="portalFormGrid businessAddressPhotoGrid">
                <label>Dirección del negocio<input required maxLength={180} autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
                <label>Foto del negocio <small>Opcional · JPG, PNG o WebP · máximo 8 MB</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setBusinessPhotoFile(e.target.files?.[0] ?? null)} />{businessPhotoFile && <small>Seleccionada: {businessPhotoFile.name}</small>}</label>
              </div>
              <label>Descripción del negocio<textarea rows={3} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            </div>
            <div className="businessLegalPanel">
              <div className="businessLegalHeading"><span>DOCUMENTOS PARA VALIDAR EL TITULAR</span><small>Quedan privados y pendientes de revisión.</small></div>
              <div className="businessLegalDocuments">
                <label>Identificación del titular{form.entityType === "legal" ? " / representante legal" : ""}<small>Obligatorio · PDF, JPG o PNG · máximo 5 MB</small><input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setIdentityDocument(e.target.files?.[0] ?? null)} /></label>
                <label>RUT{form.entityType === "legal" ? " de la empresa" : " · si aplica"}<small>{form.entityType === "legal" ? "Obligatorio · PDF, JPG o PNG · máximo 5 MB" : "Opcional para persona natural · PDF, JPG o PNG · máximo 5 MB"}</small><input required={form.entityType === "legal"} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setRutDocument(e.target.files?.[0] ?? null)} /></label>
                {form.entityType === "legal" && <label>Certificado de Cámara de Comercio<small>Obligatorio · certificado vigente · PDF, JPG o PNG · máximo 5 MB</small><input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setChamberDocument(e.target.files?.[0] ?? null)} /></label>}
              </div>
              <p className="businessLegalNote">Persona natural: identificación y RUT cuando corresponda a su situación tributaria. Persona jurídica: cédula del representante, NIT/RUT y certificado de existencia y representación legal. Estos documentos no sustituyen la autorización de una rifa.</p>
            </div>          </>}
          {mode === "login" && <>
            <label>Correo electrónico<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Contraseña<input required type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          </>}
          {authError && <p className="portalError" role="alert">{authError}</p>}
          {mode === "register" && <button className="portalPrimary premiumSubmit" disabled={!selectedBusinessPlan || authBusy}>{authBusy ? "Un momento…" : selectedBusinessPlan ? (selectedBusinessPlan.demoOnly ? "Crear demo gratis →" : "Continuar al pago con Wompi · " + selectedBusinessPlan.name + " →") : "Elige un plan en la página siguiente"}</button>}
          {mode === "login" && <button className="portalPrimary premiumSubmit" disabled={authBusy}>{authBusy ? "Un momento…" : <>Entrar al panel <span>→</span></>}</button>}
        </form>

      </section>
    </PortalAuthShell>
  );
  if (account.role !== "business") return <PortalAuthShell audience="business" authInline><section className="portalAuthCard premiumAuthCard"><span className="premiumFormIcon">👤</span><h2>Esta cuenta es de cliente.</h2><p className="portalMuted">Entra con una cuenta de negocio para abrir el panel del local.</p><a className="portalPrimary portalLinkButton" href="/cuenta">Ir a mi cuenta</a></section></PortalAuthShell>;

  const reached = (pct: number, d: Draw) => Math.min(100, Math.floor(d.sold * 100 / d.total_tickets)) >= pct;
  const remain = (pct: number, d: Draw) => Math.max(0, Math.ceil(d.total_tickets * pct / 100) - d.sold);
  return <main className="portalShell"><header className="portalHeader"><a className="portalBrand" href="/">EL GANADOR</a><div className="portalHeaderRight"><a className="portalTextLink" href="/">Ver marketplace ↗</a><span className="portalAccount">🏪 {account.business_name}</span><button className="portalExit" onClick={() => void logout()}>Salir</button></div></header>
    <div className="portalLayout"><aside className="portalSide"><div className="portalStoreCard"><div className="portalStoreAvatar">{account.business_name.slice(0, 1).toUpperCase()}</div><div><strong>{account.business_name}</strong><small>{account.business_city || "Colombia"} · {account.category}</small></div><span className="portalPill">{plan?.name ?? account.plan}</span></div>
      <nav className="portalNav">{[["Resumen", "▦"], ["Mis rifas", "🎁"], ["Novedades", "◉"], ["Documentos", "▤"], ["Configuración", "⚙"]].map(([label, icon]) => <button key={label} className={tab === label ? "selected" : ""} onClick={() => { setTab(label); setDraft(null); }}><span>{icon}</span>{label}</button>)}{plan?.liveDrawTools ? <a href="/sorteo-en-vivo" className="portalNavDemo"><span>🎱</span>Sorteo en vivo <small>Demo</small></a> : <span className="portalNavLocked" aria-disabled="true" title={`Disponible en los planes ${liveDrawPlanNames}`}><span>🎱</span>Sorteo en vivo <small>🔒 {liveDrawPlanNames}</small></span>}</nav>
      <div className="portalSideHint"><b>Tu local en la comunidad</b><p>Publica noticias y aparecerán en el inicio para clientes y otros negocios.</p><button onClick={() => setTab("Novedades")}>Crear publicación →</button></div>
    </aside><section className="portalMain"><div className="portalWelcome"><div><p className="portalEyebrow">PANEL DEL NEGOCIO · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p><h1>Hola, {account.display_name.split(" ")[0]}</h1><p>Administra tus rifas y mantén al día a quienes exploran El Ganador.</p></div><button className="portalPrimary portalTopAction" onClick={() => editDraw()}>＋ Nueva rifa</button></div>
      {notice && <p className="portalNotice" role="status">{notice}</p>}{error && <p className="portalError" role="alert">{error}</p>}
      {tab === "Resumen" && <>
        <div className="portalStats"><PortalMetric icon="🎁" label={hasMonthlyRaffleLimit ? "Rifas este mes" : "Rifas activas"} value={raffleUsage} hint={raffleUsageHint} /><PortalMetric icon="🎟️" label="Números vendidos" value={count(sold)} hint="Suma de tus rifas" /><PortalMetric icon="◷" label="Apartados" value={count(reservations)} hint="Reservas temporales · no son pagos" /><PortalMetric icon="✓" label="Disponibles" value={count(available)} hint="Números en tus cartones" /></div>
        <section className="portalPanel"><div className="portalPanelHeading"><div><p className="portalEyebrow">SEGUIMIENTO</p><h2>Así van tus rifas</h2><p>El avance se calcula con números vendidos. Los apartados de 10 minutos se muestran aparte.</p></div><span className="portalLiveSync"><i /> Actualiza cada 10 s</span></div>
          {draws.length ? <div className="portalDrawList">{draws.map((d) => { const pct = Math.floor(d.sold * 100 / d.total_tickets); const coverage = describeRaffleTerritory(d); return <article className="portalDrawRow" key={d.id}><div className="portalDrawThumb">{d.image_url ? <img src={d.image_url} alt="" /> : d.emoji}</div><div className="portalDrawSummary"><div className="portalDrawTitle"><strong>{d.title}</strong><span className={d.live ? "portalStatus isLive" : d.published ? "portalStatus" : "portalStatus draftStatus"}>{d.live ? "En vivo" : d.published ? "Publicada" : "Borrador"}</span></div><small>{d.id} · {d.category} · {money(d.unit_price)} por número</small><small>Cobertura declarada: {coverage.label}</small><div className="portalProgress"><span style={{ width: `${pct}%` }} /></div><small>{count(d.sold)} vendidos de {count(d.total_tickets)} · {pct}%</small><div className="portalThresholds">{[50, 70, 80, 90, 100].map((p) => <span key={p} className={reached(p, d) ? "reached" : ""}>{p}% {reached(p, d) ? "✓" : `faltan ${count(remain(p, d))}`}</span>)}</div><small>{d.live ? `Inició ${d.started_at ? new Date(d.started_at).toLocaleString("es-CO") : "ahora"}` : d.start_mode === "threshold" ? `Inicio automático al vender ${d.start_threshold}% del cartón` : `Fecha programada: ${d.scheduled_at ? new Date(d.scheduled_at).toLocaleString("es-CO") : "sin definir"}`}</small></div><div className="portalDrawActions"><b>{money(d.sold * d.unit_price)}<small>valor reservado por ventas de muestra</small></b><button onClick={() => editDraw(d)}>Editar</button><a href="/">Ver en marketplace</a></div></article>; })}</div> : <div className="portalEmpty"><span>🎁</span><h3>Aún no publicas una rifa</h3><p>Carga el producto, define el valor de cada número y decide cuándo quieres que empiece.</p><button className="portalPrimary" onClick={() => editDraw()}>Crear mi primera rifa</button></div>}
        </section><section className="portalPlanCard"><div><p className="portalEyebrow">PLAN {plan?.name.toUpperCase() ?? account.plan.toUpperCase()}</p><h2>Tu capacidad de publicación</h2><p>Uso: {raffleUsage} · {describeRaffleCapacity(plan ?? availablePlans.gratis)} · cartones: {describeCartons(plan ? plan.cartonSizes : availablePlans.gratis.cartonSizes, plan?.maxTicketsPerDraw ?? 100)} · tope bruto {money(plan?.maxRaffleGain ?? 3_000_000)} por rifa</p><div className="portalProgress"><span style={{ width: `${raffleUsagePercent}%` }} /></div><p>Vigencia del plan: {planExpiryLabel}</p></div><div className="portalPlanActions">{plan && !plan.demoOnly && <button className="portalPrimary" type="button" onClick={() => void renewPlan()} disabled={renewBusy}>{renewBusy ? "Preparando pago…" : "Renovar plan →"}</button>}<span>El acceso se mantiene hasta la fecha de vigencia.</span>{renewError && <small className="portalError" role="alert">{renewError}</small>}</div></section>
      </>}
      {tab === "Mis rifas" && <section className="portalPanel"><div className="portalPanelHeading"><div><p className="portalEyebrow">CATÁLOGO DEL LOCAL</p><h2>Mis rifas</h2><p>Las rifas publicadas se ven en la portada y en el perfil público del local.</p></div><button className="portalPrimary" onClick={() => editDraw()}>＋ Crear rifa</button></div>{draws.map((d) => <article className="portalSimpleRow" key={d.id}><span>{d.emoji}</span><div><b>{d.title}</b><small>{d.category} · {count(d.available)} números libres · Cobertura: {describeRaffleTerritory(d).label} · {d.published ? "Visible" : "Borrador"}</small></div><button onClick={() => editDraw(d)}>Editar</button></article>)}</section>}
      {tab === "Novedades" && <section className="portalPanel"><div className="portalPanelHeading"><div><p className="portalEyebrow">COMUNIDAD DE EL GANADOR</p><h2>Novedades del local</h2><p>Como una red de publicaciones: tus novedades aparecen en la página principal para clientes y otros negocios.</p></div><a className="portalTextLink" href="/novedades">Abrir feed completo ↗</a></div><form className="portalPostComposer" onSubmit={saveNews}><label>¿Qué quieres contar hoy?<textarea required minLength={2} maxLength={1200} rows={4} placeholder="Llegó un nuevo premio, detalles de la rifa, novedades de tu tienda…" value={postText} onChange={(e) => setPostText(e.target.value)} /></label><div><label className="portalFileButton">＋ Foto del local<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setPostImage(e.target.files?.[0] ?? null)} /></label><span>{postImage?.name ?? "Opcional · JPG, PNG o WebP"}</span><button className="portalPrimary" disabled={busy}>{busy ? "Publicando…" : "Publicar novedad"}</button></div></form><div className="portalPostList">{posts.map((p) => <article className="portalFeedPost" key={p.id}><div className="portalPostByline"><span className="portalStoreAvatar smallStoreAvatar">{(p.business_name ?? account.business_name).slice(0, 1).toUpperCase()}</span><div><b>{p.business_name ?? account.business_name}</b><small>{new Date(p.created_at).toLocaleString("es-CO")} · {p.business_city || "Colombia"}</small></div></div><p>{p.content}</p>{p.image_url && <img className="portalPostImage" src={p.image_url} alt="Foto de una novedad" />}</article>)}</div></section>}
      {tab === "Documentos" && <section className="portalPanel"><div className="portalPanelHeading"><div><p className="portalEyebrow">FORMALIDAD DEL NEGOCIO</p><h2>Documentos para revisión</h2><p>La documentación no se publica ni aparece en tu perfil de tienda.</p></div></div><form className="portalDocForm" onSubmit={uploadDocument}><label>Tipo de documento<select required value={docType} onChange={(e) => setDocType(e.target.value)}><option value="">Selecciona</option>{[...new Set(["Identificación del titular o representante legal", "RUT", "Certificado de existencia y representación legal (Cámara de Comercio)", ...(docsByCategory[account.category] ?? ["Soporte legal del premio"])] )].map((x) => <option key={x}>{x}</option>)}</select></label><label>Archivo PDF, JPG o PNG · máximo 5 MB<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} /></label><button className="portalPrimary" disabled={docBusy}>{docBusy ? "Subiendo…" : "Enviar para revisión"}</button></form><div className="portalPrivateNote"><b>Almacenamiento de prototipo:</b> el archivo queda en el equipo donde corre esta demostración, en una carpeta privada. No existe equipo verificador todavía; usa documentos ficticios hasta instalar almacenamiento privado y revisión de identidad antes del lanzamiento público.</div><div className="portalDocs">{documents.length ? documents.map((d) => <div className="portalDocRow" key={d.id}><span>📄</span><div><b>{d.document_type}</b><small>{d.file_name} · {new Date(d.uploaded_at).toLocaleDateString("es-CO")}</small></div><span className={`portalStatus ${d.review_status === "approved" ? "isLive" : ""}`}>{d.review_status === "pending" ? "Pendiente" : d.review_status === "approved" ? "Aprobado" : "Requiere ajuste"}</span></div>) : <p className="portalMuted">No has agregado documentos todavía.</p>}</div></section>}
      {tab === "Configuración" && <section className="portalPanel"><div className="portalPanelHeading"><div><p className="portalEyebrow">PERFIL PÚBLICO DEL LOCAL</p><h2>Configuración del negocio</h2><p>Estos datos se comparten junto a tus rifas y publicaciones.</p></div></div><form className="portalForm portalSettingsForm" onSubmit={saveProfile}><label>Nombre del local<input required minLength={2} maxLength={100} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label><div className="portalFormGrid"><label>Ciudad<input maxLength={100} value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></label><label>Categoría<select value={profile.category} onChange={(e) => setProfile({ ...profile, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label></div><label>Descripción<textarea rows={4} maxLength={500} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} /></label><div><b>Correo de acceso</b><p className="portalMuted">{account.email} · Inicio de sesión con contraseña</p></div><button className="portalPrimary" disabled={busy}>{busy ? "Guardando…" : "Guardar perfil"}</button></form></section>}
    </section></div>
    {draft && <div className="portalModalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setDraft(null); }}><section className="portalEditor" role="dialog" aria-modal="true" aria-labelledby="raffleHeading"><button className="portalModalClose" onClick={() => setDraft(null)}>×</button><p className="portalEyebrow">{draft.drawId ? "EDITAR RIFA" : "NUEVA RIFA"}</p><h2 id="raffleHeading">Configura tu premio</h2><p className="portalMuted">Elige las condiciones que aparecerán en el marketplace.</p><aside className="raffleTerritoryCallout" aria-label="Advertencia sobre cobertura y autorización de la rifa"><strong>Antes de publicar una rifa real</strong><p>{raffleTerritoryNotice}</p><small>Esta demo conserva la cobertura que declara el negocio, pero no valida permisos ni restringe ventas por ubicación.</small></aside><form className="portalForm" onSubmit={saveDraft}><div className="portalFormGrid"><label>Nombre del artículo<input required minLength={3} maxLength={100} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Categoría<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value, details: {} })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label><label>Valor real del premio (COP)<input required type="number" min="0" max="10000000000" value={draft.productValue} onChange={(e) => setDraft({ ...draft, productValue: e.target.value })} /><small>El tope del plan se aplica a las ventas proyectadas.</small></label><label>Precio por número (COP)<input required type="number" min="1000" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} /><small>Venta bruta proyectada: {money(Number(draft.unitPrice || 0) * Number(draft.totalTickets || 0))} · Tope del plan: {money(plan?.maxRaffleGain ?? 3000000)}</small></label><label>Números en el cartón<select required value={draft.totalTickets} onChange={(e) => setDraft({ ...draft, totalTickets: e.target.value })}>{planCartonOptions(plan ?? availablePlans.gratis).map((size) => <option key={size} value={size}>{count(size)} números</option>)}</select><small>Cartones disponibles para publicar: {availableCartonSizes.map(count).join(", ") || "sin cupos libres"}.</small></label><label>Icono del premio<input maxLength={8} value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} /></label></div><label>Descripción del premio<textarea required minLength={8} maxLength={2500} rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label><div className="portalCategoryFields"><b>Especificaciones de {draft.category}</b><div className="portalFormGrid">{categoryFields.map(([label, key]) => <label key={key}>{label}<input value={draft.details[key] ?? ""} onChange={(e) => setDraft({ ...draft, details: { ...draft.details, [key]: e.target.value } })} /></label>)}</div></div><RaffleTerritoryFields value={{ territoryScope: draft.territoryScope, territoryDepartment: draft.territoryDepartment, territoryMunicipality: draft.territoryMunicipality, territoryMunicipalities: draft.territoryMunicipalities, territoryDepartments: draft.territoryDepartments }} onChange={(patch) => setDraft({ ...draft, ...patch })} /><label>Foto real del premio<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file, (imageUrl) => setDraft((current) => current ? { ...current, imageUrl } : current)); }} /></label>{imageBusy && <small>Subiendo foto…</small>}{draft.imageUrl && <img className="portalPrizePreview" src={draft.imageUrl} alt="Vista previa del premio" />}<fieldset className="portalStartOptions"><legend>¿Cuándo debe comenzar la rifa?</legend><label><input type="radio" checked={draft.startMode === "threshold"} onChange={() => setDraft({ ...draft, startMode: "threshold" })} /> Al alcanzar ventas</label>{draft.startMode === "threshold" && <label>Activar al vender<select value={draft.startThreshold} onChange={(e) => setDraft({ ...draft, startThreshold: e.target.value })}>{[50, 70, 80, 90, 100].map((x) => <option key={x} value={x}>{x}% del cartón</option>)}</select></label>}<label><input type="radio" checked={draft.startMode === "date"} onChange={() => setDraft({ ...draft, startMode: "date" })} /> Esperar a una fecha</label>{draft.startMode === "date" && <label>Fecha y hora<input required type="datetime-local" value={draft.scheduledAt} onChange={(e) => setDraft({ ...draft, scheduledAt: e.target.value })} /></label>}</fieldset><label className="portalPublishToggle"><input type="checkbox" checked={draft.published} disabled={plan?.demoOnly} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Mostrar mi rifa en el marketplace ahora</label>{plan?.demoOnly && <p className="portalPrivateNote">La cuenta Gratis solo permite guardar borradores de prueba.</p>}<p className="portalPrivateNote">El progreso usa números vendidos, no reservas temporales. El prototipo no cobra, no confirma ventas y no sortea ganadores automáticamente.</p><button className="portalPrimary" disabled={busy || imageBusy}>{busy ? "Guardando…" : draft.drawId ? "Guardar cambios" : draft.published ? "Publicar rifa" : "Guardar borrador"}</button></form></section></div>}
  </main>;
}

function PortalMetric({ icon, label, value, hint }: { icon: string; label: string; value: string; hint: string }) { return <article className="portalMetric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><small>{hint}</small></div></article>; }









