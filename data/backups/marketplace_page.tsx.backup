"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { RaffleTerritoryFields } from "./components/RaffleTerritoryFields";
import { describeRaffleTerritory, type StoredRaffleTerritoryScope } from "../lib/raffle-territory";

type Draw = {
  id: string;
  title: string;
  admin: string;
  category: string;
  unit_price: number;
  total_tickets: number;
  followers: number;
  live: boolean;
  emoji: string;
  sold: number;
  reserved: number;
  available: number;
  description: string;
  business_city: string;
  business_description: string;
  business_followers: number;
  category_details: string;
  product_value: number;
  image_url: string;
  business_photo_url: string;
  territory_scope: StoredRaffleTerritoryScope;
  territory_department: string;
  territory_municipality: string;
  territory_municipalities: string;
  territory_departments: string;
};
type Ticket = { number: number; status: "available" | "reserved" | "sold" };
type BusinessDocument = { id: string; admin: string; document_type: string; file_name: string; mime_type: string; review_status: "pending" | "approved" | "rejected"; uploaded_at: string };
type RaffleForm = { title: string; category: string; description: string; emoji: string; unitPrice: string; totalTickets: string; live: boolean; details: Record<string, string>; territoryScope: "municipal" | "departmental" | "national"; territoryDepartment: string; territoryMunicipality: string; territoryMunicipalities: string; territoryDepartments: string };
type Reservation = {
  id: string;
  drawId: string;
  numbers: number[];
  totalAmount: number;
  status: "reserved";
  expiresAt: string;
};
type Screen = "home" | "raffles" | "live" | "favorites" | "profile" | "business" | "admin";

const money = (value: number) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0,
}).format(value);
const count = (value: number) => new Intl.NumberFormat("es-CO").format(value);

const categoryFields: Record<string, { key: string; label: string; placeholder: string }[]> = {
  Tecnología: [{ key: "brandModel", label: "Marca y modelo", placeholder: "Ej. Samsung Galaxy S25" }, { key: "warranty", label: "Garantía", placeholder: "Cobertura y tiempo de garantía" }, { key: "included", label: "Qué incluye", placeholder: "Accesorios, caja, factura…" }],
  Motos: [{ key: "modelYear", label: "Modelo y año", placeholder: "Ej. XTZ 250 · 2026" }, { key: "engine", label: "Cilindraje y especificaciones", placeholder: "Datos técnicos del vehículo" }, { key: "deliveryDocs", label: "Documentos y entrega", placeholder: "Documentos que acompañan el premio" }],
  Joyería: [{ key: "materials", label: "Materiales y quilates", placeholder: "Describe metales, piedras y pureza" }, { key: "certificate", label: "Certificado", placeholder: "Entidad o certificado incluido" }, { key: "pieces", label: "Piezas incluidas", placeholder: "Detalle del set o joya" }],
  Gaming: [{ key: "edition", label: "Edición y capacidad", placeholder: "Ej. Edición digital · 1 TB" }, { key: "included", label: "Accesorios incluidos", placeholder: "Controles, juegos y accesorios" }, { key: "warranty", label: "Garantía", placeholder: "Cobertura y tiempo de garantía" }],
};
const documentTypesByCategory: Record<string, string[]> = {
  Tecnología: ["Registro del negocio", "Identificación del representante", "Soporte de propiedad del premio", "Garantía o certificado del producto"],
  Motos: ["Registro del negocio", "Identificación del representante", "Soporte de propiedad o disponibilidad", "Documentación relacionada con el vehículo"],
  Joyería: ["Registro del negocio", "Identificación del representante", "Soporte de propiedad o disponibilidad", "Certificado de autenticidad o materiales"],
  Gaming: ["Registro del negocio", "Identificación del representante", "Soporte de propiedad del premio", "Garantía o factura del producto"],
};
const categoryDetailLabels: Record<string, string> = {
  brandModel: "Marca y modelo", warranty: "Garantía", included: "Incluye", modelYear: "Modelo y año",
  engine: "Cilindraje y especificaciones", deliveryDocs: "Documentos y entrega", materials: "Materiales y quilates",
  certificate: "Certificado", pieces: "Piezas incluidas", edition: "Edición y capacidad",
  specification: "Ficha del premio", delivery: "Entrega y garantía",
};
const readCategoryDetails = (value: string) => {
  try {
    const parsed: unknown = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
  } catch { return {}; }
};
const nav = [
  { id: "home" as const, icon: "⌂", label: "Inicio" },
  { id: "raffles" as const, icon: "🎁", label: "Sorteos" },
  { id: "live" as const, icon: "🔴", label: "En vivo" },
  { id: "favorites" as const, icon: "♡", label: "Mis favoritos" },
  { id: "profile" as const, icon: "♙", label: "Mi perfil" },
];

export default function Home() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [view, setView] = useState<Screen>("home");
  const [search, setSearch] = useState("");
  const [following, setFollowing] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [adminBusiness, setAdminBusiness] = useState("");
  const [profileForm, setProfileForm] = useState({ name: "", city: "", description: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [raffleEditor, setRaffleEditor] = useState<"new" | Draw | null>(null);
  const [raffleForm, setRaffleForm] = useState<RaffleForm>({ title: "", category: "Tecnología", description: "", emoji: "🎁", unitPrice: "20000", totalTickets: "500", live: false, details: {}, territoryScope: "municipal", territoryDepartment: "", territoryMunicipality: "", territoryMunicipalities: "", territoryDepartments: "" });
  const [raffleSaving, setRaffleSaving] = useState(false);
  const [raffleError, setRaffleError] = useState("");
  const [raffleMessage, setRaffleMessage] = useState("");
  const [businessDocuments, setBusinessDocuments] = useState<BusinessDocument[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentMessage, setDocumentMessage] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [showTicketMap, setShowTicketMap] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketReload, setTicketReload] = useState(0);
  const firstAvailableRef = useRef<HTMLButtonElement | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get("buscar");
    const storeName = params.get("local");
    if (searchTerm) setSearch(searchTerm);
    if (storeName) { setBusinessName(storeName); setView("business"); }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadDraws = async () => {
      try {
        const response = await fetch("/api/draws", { cache: "no-store" });
        if (!response.ok) throw new Error("No fue posible cargar los sorteos.");
        const data = (await response.json()) as { draws: Draw[] };
        if (mounted) {
          setDraws(data.draws);
          setAdminBusiness((current) => current || data.draws[0]?.admin || "");
          setSelectedDraw((current) => current ? data.draws.find((draw) => draw.id === current.id) ?? current : null);
          setLoadError("");
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoadError("No pudimos conectar con el servidor. Recarga la página para intentarlo de nuevo.");
          setLoading(false);
        }
      }
    };
    void loadDraws();
    const timer = window.setInterval(loadDraws, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const drawId = selectedDraw?.id;
    if (!drawId || !showTicketMap || reservation) return;
    let mounted = true;
    const loadTickets = async () => {
      try {
        const response = await fetch(`/api/draws/${encodeURIComponent(drawId)}/tickets`, { cache: "no-store" });
        const data = await response.json() as { tickets?: Ticket[]; error?: string };
        if (!response.ok || !data.tickets) throw new Error(data.error ?? "No pudimos cargar el cartón.");
        if (mounted) {
          setTickets(data.tickets);
          const available = new Set(data.tickets.filter((ticket) => ticket.status === "available").map((ticket) => ticket.number));
          setSelectedNumbers((current) => current.filter((number) => available.has(number)));
          setTicketError("");
          setTicketLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setTicketError(error instanceof Error ? error.message : "No pudimos cargar el cartón.");
          setTicketLoading(false);
        }
      }
    };
    setTicketLoading(true);
    void loadTickets();
    const timer = window.setInterval(loadTickets, 5000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [selectedDraw?.id, showTicketMap, Boolean(reservation), ticketReload]);

  useEffect(() => {
    const business = draws.find((draw) => draw.admin === adminBusiness);
    if (business) setProfileForm({ name: business.admin, city: business.business_city === "Colombia" ? "" : business.business_city, description: business.business_description });
  }, [adminBusiness]);

  useEffect(() => {
    if (view !== "admin" || !adminBusiness) return;
    let mounted = true;
    fetch(`/api/admin/documents?admin=${encodeURIComponent(adminBusiness)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { documents?: BusinessDocument[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "No pudimos consultar los documentos.");
        if (mounted) setBusinessDocuments(data.documents ?? []);
      })
      .catch(() => { if (mounted) setBusinessDocuments([]); });
    return () => { mounted = false; };
  }, [adminBusiness, view]);

  const matchingDraws = useMemo(() => {
    const query = search.toLocaleLowerCase("es-CO").trim();
    return draws.filter((draw) => !query || `${draw.title} ${draw.admin} ${draw.category}`.toLocaleLowerCase("es-CO").includes(query));
  }, [draws, search]);
  const visibleDraws = useMemo(() => {
    if (view === "live") return matchingDraws.filter((draw) => draw.live);
    if (view === "favorites") return matchingDraws.filter((draw) => following.includes(draw.admin));
    return matchingDraws;
  }, [following, matchingDraws, view]);

  const refreshDraws = async () => {
    try {
      const response = await fetch("/api/draws", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { draws: Draw[] };
      setDraws(data.draws);
      setSelectedDraw((current) => current ? data.draws.find((draw) => draw.id === current.id) ?? current : null);
      if (!data.draws.some((draw) => draw.admin === adminBusiness) && data.draws[0]) setAdminBusiness(data.draws[0].admin);
    } catch {
      // The regular five-second refresh will try again.
    }
  };
  const saveBusinessProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: adminBusiness, ...profileForm }),
      });
      const data = await response.json() as { name?: string; error?: string };
      if (!response.ok || !data.name) throw new Error(data.error ?? "No pudimos guardar el perfil.");
      setAdminBusiness(data.name);
      if (businessName === adminBusiness) setBusinessName(data.name);
      setProfileMessage("Perfil del local actualizado.");
      await refreshDraws();
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "No pudimos guardar el perfil.");
    } finally { setProfileSaving(false); }
  };
  const openRaffleEditor = (draw?: Draw) => {
    setRaffleError("");
    setRaffleMessage("");
    setRaffleEditor(draw ?? "new");
    setRaffleForm(draw ? {
      title: draw.title,
      category: draw.category,
      description: draw.description,
      emoji: draw.emoji,
      unitPrice: String(draw.unit_price),
      totalTickets: String(draw.total_tickets),
      live: draw.live,
      details: readCategoryDetails(draw.category_details),
      territoryScope: draw.territory_scope === "departmental" || draw.territory_scope === "national" ? draw.territory_scope : "municipal",
      territoryDepartment: draw.territory_department ?? "",
      territoryMunicipality: draw.territory_municipality ?? "",
      territoryMunicipalities: draw.territory_municipalities ?? "",
      territoryDepartments: draw.territory_departments ?? "",
    } : {
      title: "", category: businessDraws[0]?.category ?? "Tecnología", description: "", emoji: "🎁",
      unitPrice: "20000", totalTickets: "500", live: false, details: {}, territoryScope: "municipal", territoryDepartment: "", territoryMunicipality: "", territoryMunicipalities: "", territoryDepartments: "",
    });
  };
  const saveRaffle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRaffleSaving(true);
    setRaffleError("");
    const editing = raffleEditor !== "new" && raffleEditor !== null ? raffleEditor : null;
    try {
      const response = await fetch("/api/admin/draws", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawId: editing?.id, admin: adminBusiness, ...raffleForm,
          unitPrice: Number(raffleForm.unitPrice), totalTickets: Number(raffleForm.totalTickets),
          categoryDetails: raffleForm.details, businessCity: profileForm.city,
          businessDescription: profileForm.description,
        }),
      });
      const data = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "No pudimos guardar el sorteo.");
      setRaffleEditor(null);
      setRaffleMessage(data.message ?? "Cambios guardados.");
      await refreshDraws();
    } catch (error) {
      setRaffleError(error instanceof Error ? error.message : "No pudimos guardar el sorteo.");
    } finally { setRaffleSaving(false); }
  };
  const uploadBusinessDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!documentFile) { setDocumentError("Elige un PDF, JPG o PNG para subir."); return; }
    setDocumentUploading(true);
    setDocumentError("");
    setDocumentMessage("");
    try {
      const form = new FormData();
      form.set("admin", adminBusiness);
      form.set("documentType", documentType);
      form.set("file", documentFile);
      const response = await fetch("/api/admin/documents", { method: "POST", body: form });
      const data = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "No pudimos recibir el archivo.");
      setDocumentMessage(data.message ?? "Documento recibido.");
      setDocumentFile(null);
      const listing = await fetch(`/api/admin/documents?admin=${encodeURIComponent(adminBusiness)}`, { cache: "no-store" });
      const listingData = await listing.json() as { documents?: BusinessDocument[] };
      setBusinessDocuments(listingData.documents ?? []);
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "No pudimos recibir el archivo.");
    } finally { setDocumentUploading(false); }
  };
  const openDraw = (draw: Draw) => {
    setSelectedDraw(draw);
    setReservation(null);
    setFormError("");
    setSelectedNumbers([]);
    setTickets([]);
    setTicketError("");
    setShowTicketMap(false);
  };
  const closeDraw = () => {
    setSelectedDraw(null);
    setReservation(null);
    setShowTicketMap(false);
    setSelectedNumbers([]);
  };
  const openBusiness = (name: string) => {
    setBusinessName(name);
    setScreen("business");
  };
  const toggleTicket = (ticket: Ticket) => {
    if (ticket.status !== "available") return;
    setFormError("");
    setSelectedNumbers((current) => current.includes(ticket.number)
      ? current.filter((number) => number !== ticket.number)
      : current.length < 10 ? [...current, ticket.number] : current);
  };
  const reserveTickets = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDraw) return;
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/participations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId: selectedDraw.id, buyerName, buyerEmail, ticketNumbers: selectedNumbers }),
      });
      const data = await response.json() as { reservation?: Reservation; error?: string };
      if (!response.ok || !data.reservation) throw new Error(data.error ?? "No se pudo guardar la reserva.");
      setReservation(data.reservation);
      await refreshDraws();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la reserva.");
      await refreshDraws();
    } finally {
      setSubmitting(false);
    }
  };
  const follow = (admin: string) => setFollowing((current) => current.includes(admin)
    ? current.filter((name) => name !== admin)
    : [...current, admin]);

  const liveDraw = draws.find((draw) => draw.live) ?? draws[0];
  const focusDraw = draws[0];
  const activeBusinessName = businessName || focusDraw?.admin || "";
  const businessDraws = draws.filter((draw) => draw.admin === activeBusinessName);
  const businessLead = businessDraws[0];
  const adminDraws = draws.filter((draw) => draw.admin === adminBusiness);
  const adminBusinessOptions = [...new Set(draws.map((draw) => draw.admin))];
  const adminCategory = adminDraws[0]?.category ?? "Tecnología";
  const categoryDocumentOptions = documentTypesByCategory[adminCategory] ?? ["Registro del negocio", "Identificación del representante", "Soporte de propiedad o disponibilidad del premio"];
  const raffleCategoryOptions = [...new Set([...Object.keys(categoryFields), "Otros", ...draws.map((draw) => draw.category)])];
  const editingRaffle = raffleEditor && raffleEditor !== "new" ? raffleEditor : null;
  const adminSold = adminDraws.reduce((sum, draw) => sum + draw.sold, 0);
  const adminReserved = adminDraws.reduce((sum, draw) => sum + draw.reserved, 0);
  const adminAvailable = adminDraws.reduce((sum, draw) => sum + draw.available, 0);
  const formCategoryFields = categoryFields[raffleForm.category] ?? [
    { key: "specification", label: "Ficha del premio", placeholder: "Incluye las especificaciones relevantes" },
    { key: "delivery", label: "Entrega y garantía", placeholder: "Condiciones de entrega y garantía" },
  ];
  const availableTicketCount = tickets.filter((ticket) => ticket.status === "available").length;
  const firstAvailableNumber = tickets.find((ticket) => ticket.status === "available")?.number;
  const soldTotal = draws.reduce((sum, draw) => sum + draw.sold, 0);
  const reservedTotal = draws.reduce((sum, draw) => sum + draw.reserved, 0);
  const availableTotal = draws.reduce((sum, draw) => sum + draw.available, 0);
  const occupied = (draw: Draw) => draw.sold + draw.reserved;
  const progress = (draw: Draw) => Math.round((occupied(draw) / draw.total_tickets) * 100);
  const setScreen = (screen: Screen) => {
    if (screen === "profile") { window.location.href = "/cuenta"; return; }
    if (screen === "admin") { window.location.href = "/admin"; return; }
    if (screen === "business" && !businessName && focusDraw) setBusinessName(focusDraw.admin);
    setView(screen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const title = view === "home" ? "Sorteos que están rifando ahora"
    : view === "raffles" ? "Todos los sorteos"
      : view === "live" ? "Sorteos en vivo"
        : view === "favorites" ? "Mis locales favoritos"
          : view === "profile" ? "Mi perfil de prueba"
            : view === "business" ? "Perfil del local"
              : "Panel del negocio";

  return <div className="appShell">
    <header className="siteHeader">
      <button className="brand" onClick={() => setScreen("home")} aria-label="Ir al inicio"><span className="brandWordmark">EL GANADOR</span></button>
      <label className="searchBox"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busca sorteos, números o locales…" aria-label="Buscar sorteos" /></label>
      <button className="buyTop" disabled={!draws.length} onClick={() => draws[0] && openDraw(draws[0])}>＋ Comprar números</button>
      <button className="profileButton" onClick={() => setScreen("profile")}><span className="userAvatar">👤</span><span>Mi cuenta</span><span>⌄</span></button>
    </header>

    <div className="dashboardLayout">
      <aside className="sidebar">
        <nav className="sideNav" aria-label="Navegación principal">
          {nav.map((item) => <button key={item.id} className={view === item.id ? "navItem active" : "navItem"} onClick={() => setScreen(item.id)}><span className="navIcon">{item.icon}</span>{item.label}</button>)}
          <a className="navItem navAnchor" href="/novedades"><span className="navIcon">◉</span>Novedades</a>
          <div className="navDivider" />
          <button className={view === "business" ? "navItem active" : "navItem"} onClick={() => setScreen("business")}><span className="navIcon">🏪</span>Perfil del local</button>
          <button className="navItem" onClick={() => setScreen("admin")}><span className="navIcon">▦</span>Panel del negocio</button>
        </nav>
        <div className="sidebarPromo"><span className="promoCup">🏆</span><p className="eyebrow">EL GANADOR</p><h3>Descubre.<br />Participa.<br />Celebra.</h3><button onClick={() => setScreen("raffles")}>Explorar sorteos →</button></div>
        <div className="sidebarNote">Prototipo · datos de muestra</div>
      </aside>

      <main className="mainColumn">
        {view === "home" && <div className="stories" aria-label="Locales destacados">
          <button className="story" onClick={() => setScreen("profile")}><span className="storyRing ownStory"><span>＋</span></span><small>Tu perfil</small></button>
          {draws.slice(0, 5).map((draw) => <button className="story" key={draw.id} onClick={() => openBusiness(draw.admin)}><span className="storyRing"><span>{draw.emoji}</span></span><small>{draw.admin}</small></button>)}
          <button className="story" onClick={() => setScreen("raffles")}><span className="storyRing"><span>🎟️</span></span><small>Sorteos</small></button>
        </div>}

        {view === "profile" ? <section className="profilePanel cardSurface"><div className="profileHero"><div className="profileAvatar">👤</div><div><p className="eyebrow">MODO DE PRUEBA</p><h1>Mi perfil</h1><p>Las cuentas personales se conectarán en la siguiente etapa.</p></div></div><div className="profileActions"><button className="buyTop" onClick={() => setScreen("favorites")}>Ver mis favoritos ({following.length})</button><button className="softButton" onClick={() => setScreen("raffles")}>Buscar sorteos</button></div><div className="profileCallout">Las reservas de prueba duran 10 minutos. No hay cuentas, pagos ni sorteos reales conectados todavía.</div></section>
          : view === "business" ? <section className="businessProfile cardSurface">
            {businessLead ? <><div className="businessCover">{businessLead.business_photo_url ? <img src={businessLead.business_photo_url} alt={`Foto de ${activeBusinessName}`} /> : <span>🏪</span>}</div><div className="businessInfo"><div><p className="eyebrow">PERFIL DEL LOCAL · DEMOSTRACIÓN</p><h1>{activeBusinessName}</h1><p>{businessLead.business_city} · {businessLead.business_description}</p></div><button className={following.includes(activeBusinessName) ? "softButton following" : "softButton"} onClick={() => follow(activeBusinessName)}>{following.includes(activeBusinessName) ? "✓ Siguiendo" : "♡ Seguir local"}</button></div>
            <div className="businessStats"><div><b>{count(businessLead.business_followers)}</b><span>seguidores de muestra</span></div><div><b>{count(businessDraws.length)}</b><span>sorteos publicados</span></div><div><b>{count(businessDraws.reduce((sum, draw) => sum + draw.available, 0))}</b><span>números disponibles</span></div></div>
            <h2>Premios que está rifando</h2><div className="productRail">{businessDraws.map((draw) => <DrawCard key={draw.id} draw={draw} isFollowing={following.includes(draw.admin)} onFollow={follow} onOpen={openDraw} onBusiness={openBusiness} occupied={occupied} progress={progress} />)}</div></>
              : <div className="emptyCard">No encontramos locales en el catálogo.</div>}
          </section>
            : view === "admin" ? <section className="adminPage">
              <div className="pageHeading"><div><p className="eyebrow">CENTRO DEL NEGOCIO · MODO DE PRUEBA</p><h1>Panel del negocio</h1><p>Administra el perfil, los premios y los documentos del local.</p></div><div className="adminHeadingActions"><label className="businessPicker">Local<select value={adminBusiness} onChange={(event) => { setAdminBusiness(event.target.value); setProfileMessage(""); setDocumentMessage(""); }} aria-label="Local que estás administrando">{adminBusinessOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><button className="buyTop" onClick={() => openRaffleEditor()}>＋ Crear y publicar rifa</button></div></div>
              <div className="adminKpis"><Metric label="Premios publicados" value={count(adminDraws.length)} icon="🎁" /><Metric label="Números vendidos" value={count(adminSold)} icon="🎟️" /><Metric label="Apartados" value={count(adminReserved)} icon="◷" /><Metric label="Disponibles" value={count(adminAvailable)} icon="✓" /></div>
              {raffleMessage && <p className="adminSuccess" role="status">{raffleMessage}</p>}
              <div className="adminWorkspace">
                <section className="cardSurface adminFormCard"><div className="sectionTitle"><div><p className="eyebrow">PRESENCIA DEL NEGOCIO</p><h2>Perfil público</h2><p>Estos datos aparecen junto a los premios de {adminBusiness || "tu local"}.</p></div><span className="adminSectionIcon">🏪</span></div>
                  <form className="adminProfileForm" onSubmit={saveBusinessProfile}>
                    <label>Nombre del local<input required minLength={2} maxLength={100} value={profileForm.name} onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))} /></label>
                    <label>Ciudad<input maxLength={100} placeholder="Ej. Bogotá, Colombia" value={profileForm.city} onChange={(event) => setProfileForm((form) => ({ ...form, city: event.target.value }))} /></label>
                    <label className="fullField">Descripción del negocio<textarea maxLength={500} rows={3} placeholder="Qué ofrece tu negocio y qué lo hace confiable" value={profileForm.description} onChange={(event) => setProfileForm((form) => ({ ...form, description: event.target.value }))} /></label>
                    {profileError && <p className="formError fullField" role="alert">{profileError}</p>}{profileMessage && <p className="adminSuccess fullField" role="status">{profileMessage}</p>}
                    <button className="buyTop" disabled={profileSaving || !adminBusiness}>{profileSaving ? "Guardando…" : "Guardar perfil"}</button>
                  </form>
                </section>
                <section className="cardSurface adminFormCard documentPanel"><div className="sectionTitle"><div><p className="eyebrow">CONFIANZA DEL COMPRADOR</p><h2>Documentos del negocio</h2><p>Archivos sugeridos para el rubro: <strong>{adminCategory}</strong>.</p></div><span className="adminSectionIcon">📄</span></div>
                  <form className="documentUploadForm" onSubmit={uploadBusinessDocument}>
                    <label>Tipo de documento<select required value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="">Selecciona un documento</option>{categoryDocumentOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                    <label>Archivo PDF, JPG o PNG · máximo 5 MB<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} /></label>
                    {documentError && <p className="formError" role="alert">{documentError}</p>}{documentMessage && <p className="adminSuccess" role="status">{documentMessage}</p>}
                    <button className="softButton" disabled={documentUploading || !adminBusiness}>{documentUploading ? "Subiendo archivo…" : "Subir para revisión"}</button>
                  </form>
                  <div className="documentPrivacyNote"><strong>Revisión pendiente:</strong> cargar un archivo no certifica ni verifica el negocio. En esta demo local, usa documentos ficticios; la autenticación y el acceso privado por cuenta se conectarán antes de recibir archivos reales.</div>
                  <div className="documentList">{businessDocuments.length ? businessDocuments.map((document) => <div className="documentRow" key={document.id}><span>📎</span><div><strong>{document.document_type}</strong><small>{document.file_name} · {new Date(document.uploaded_at).toLocaleDateString("es-CO")}</small></div><span className={`documentStatus ${document.review_status}`}>{document.review_status === "pending" ? "Pendiente" : document.review_status === "approved" ? "Revisado" : "Requiere ajuste"}</span></div>) : <p className="emptyDocuments">Todavía no hay documentos para este local.</p>}</div>
                </section>
              </div>
              <section className="cardSurface inventoryCard"><div className="sectionTitle"><div><p className="eyebrow">CATÁLOGO DE PREMIOS</p><h2>Rifas de {adminBusiness || "tu negocio"}</h2><p>La ficha del premio tiene campos propios para su categoría.</p></div><span className="syncPill"><i /> Actualiza cada 5 s</span></div>
                {adminDraws.map((draw) => <div className="inventoryRow" key={draw.id}><span className="inventoryEmoji">{draw.emoji}</span><div className="inventoryName"><strong>{draw.title}</strong><small>{draw.category} · {draw.id} · {draw.live ? "En vivo" : "Publicado"}</small><div className="progressTrack"><span style={{ width: `${progress(draw)}%` }} /></div></div><div className="inventoryNumbers"><b>{count(occupied(draw))} / {count(draw.total_tickets)}</b><small>{count(draw.available)} disponibles</small></div><button className="softButton compact" onClick={() => openDraw(draw)}>Ver</button><button className="softButton compact" onClick={() => openRaffleEditor(draw)}>Editar</button></div>)}
                {!adminDraws.length && <div className="emptyCard">Este local todavía no tiene premios. Crea y publica su primera rifa.</div>}
              </section>
              <p className="prototypeNote">Panel de demostración sin inicio de sesión. La revisión legal se registra como pendiente; el sistema no otorga insignias de verificación automáticamente.</p>
            </section>
              : <>
                {view === "home" && <section className="marketSection">
                  <div className="sectionTitle"><div><p className="eyebrow">MARKETPLACE</p><h1>{title}</h1><p>Descubre premios, conoce los locales y reserva números.</p></div><button className="textButton" onClick={() => setScreen("raffles")}>Ver todos →</button></div>
                  <div className="productRail">{matchingDraws.slice(0, 4).map((draw) => <DrawCard key={draw.id} draw={draw} isFollowing={following.includes(draw.admin)} onFollow={follow} onOpen={openDraw} onBusiness={openBusiness} occupied={occupied} progress={progress} />)}</div>
                </section>}
                {view === "home" && <section className="enginePromo" aria-label="Herramientas de sorteo de El Ganador">
                  <div className="enginePromoIcon" aria-hidden="true">🎱</div>
                  <div className="enginePromoCopy"><p className="eyebrow">EL PLUS DE EL GANADOR</p><h2>El sorteo también se vive.</h2><p>Conoce nuestras balotas digitales y la ruleta personalizable para compartir la emoción en vivo.</p><small>Herramientas incluidas en Premium y Empresarial · demo interactiva, sin sorteos reales</small></div>
                  <a className="enginePromoLink" href="/sorteo-en-vivo">Ver cómo funciona <span>↗</span></a>
                </section>}
                {view === "home" && <NewsFeed onBusiness={openBusiness} />}
                {(view === "raffles" || view === "live" || view === "favorites") && <section className="marketSection fullMarket">
                  <div className="sectionTitle"><div><p className="eyebrow">EL GANADOR</p><h1>{title}</h1><p>{view === "favorites" ? "Locales que sigues durante esta sesión de prueba." : "El inventario se consulta desde la base de datos."}</p></div><span className="syncPill"><i /> Actualiza cada 5 s</span></div>
                  {visibleDraws.length ? <div className="productRail">{visibleDraws.map((draw) => <DrawCard key={draw.id} draw={draw} isFollowing={following.includes(draw.admin)} onFollow={follow} onOpen={openDraw} onBusiness={openBusiness} occupied={occupied} progress={progress} />)}</div>
                    : <div className="emptyCard">{loading ? "Cargando sorteos…" : loadError || (view === "favorites" ? "Aún no sigues ningún local. Usa “Seguir local” en un sorteo para guardarlo aquí." : "No encontramos sorteos con este filtro.")}</div>}
                </section>}

                {(view === "home" || view === "live") && <section className="liveLayout">
                  <div className="liveColumn">
                    {liveDraw ? <article className="liveFeature cardSurface">
                      <div className="liveFeatureTop"><span className="liveBadge"><i />{liveDraw.live ? "EN VIVO · DEMOSTRACIÓN" : "SORTEO DESTACADO"}</span><span className="viewers">● Datos de muestra</span></div>
                      <div className="liveFocus"><div className="livePrizeArt">{liveDraw.emoji}</div><div className="liveCopy"><p className="eyebrow">{liveDraw.id}</p><h2>{liveDraw.title}</h2><p>Administrado por {liveDraw.admin}</p><div className="liveCount"><strong>{count(occupied(liveDraw))}</strong><span>números ocupados<br />de {count(liveDraw.total_tickets)}</span></div><div className="progressTrack"><span style={{ width: `${progress(liveDraw)}%` }} /></div><button className="buyTop" onClick={() => openDraw(liveDraw)}>Ver sorteo y reservar →</button></div></div>
                      <div className="liveFoot"><span>✓ Contador compartido</span><span>◷ Reserva de 10 minutos</span><span>Sin cobros de prueba</span></div>
                    </article> : <div className="emptyCard">{loading ? "Cargando sorteo en vivo…" : "No hay sorteos en vivo ahora."}</div>}
                    <section className="communityCard cardSurface"><div className="sectionTitle"><div><p className="eyebrow">COMUNIDAD</p><h2>Participa con tranquilidad</h2><p>Los datos del prototipo son de demostración. Las reservas no procesan pagos.</p></div><span className="communityMark">✓</span></div><div className="communitySteps"><div><b>1</b><span>Elige un sorteo</span></div><div><b>2</b><span>Reserva números</span></div><div><b>3</b><span>Revisa el contador actualizado</span></div></div></section>
                  </div>
                  <aside className="rightRail">
                    <section className="sideCard"><div className="sectionTitle compactTitle"><div><h2>Sorteos activos</h2><p>Inventario de muestra</p></div><button className="textButton" onClick={() => setScreen("raffles")}>Ver →</button></div>
                      {draws.slice(0, 3).map((draw) => <button className="miniDraw" key={draw.id} onClick={() => openDraw(draw)}><span>{draw.emoji}</span><span><strong>{draw.title}</strong><small>{draw.admin}</small><small>{count(draw.available)} disponibles</small></span></button>)}
                    </section>
                    <section className="sideCard liveStatsCard"><p className="eyebrow">ESTADO DE LA PLATAFORMA</p><h2>Actualización en vivo</h2><p>Los cambios de inventario aparecen en tus pestañas abiertas.</p><div className="statLine"><span>Vendidos de muestra</span><b>{count(soldTotal)}</b></div><div className="statLine"><span>En reserva ahora</span><b>{count(reservedTotal)}</b></div><div className="statLine"><span>Disponibles</span><b>{count(availableTotal)}</b></div><span className="syncPill"><i /> Conectado a SQLite</span></section>
                  </aside>
                </section>}
              </>}
        {loadError && <p className="pageError" role="status">{loadError}</p>}
        <footer className="siteFooter"><strong>EL GANADOR</strong><span>Prototipo de pruebas · sin pagos ni sorteos reales</span></footer>
      </main>
    </div>

    <nav className="bottomNav" aria-label="Navegación móvil">{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setScreen(item.id)}><span>{item.icon}</span><small>{item.label === "Mis favoritos" ? "Favoritos" : item.label.replace("Mi ", "")}</small></button>)}<a href="/novedades"><span>◉</span><small>Noticias</small></a></nav>

    {raffleEditor && <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !raffleSaving) setRaffleEditor(null); }}>
      <section className="reservationModal adminEditorModal" role="dialog" aria-modal="true" aria-labelledby="editorTitle">
        <button className="modalClose" aria-label="Cerrar" disabled={raffleSaving} onClick={() => setRaffleEditor(null)}>×</button>
        <p className="eyebrow">{adminBusiness} · {editingRaffle ? "EDITAR PREMIO" : "NUEVA PUBLICACIÓN"}</p>
        <h2 id="editorTitle">{editingRaffle ? "Editar rifa" : "Crear y publicar una rifa"}</h2>
        <p className="modalDescription">Completa los datos del premio. La ficha cambia según la categoría y aparecerá en el marketplace al guardar.</p>
        <aside className="raffleTerritoryCallout" aria-label="Advertencia sobre cobertura y autorización de la rifa">
          <strong>La cobertura es una declaración del negocio</strong>
          <p>Debe coincidir con las autorizaciones reales. Guardar un alcance aquí no concede permisos ni comprueba dónde se encuentran los compradores.</p>
        </aside>
        <form className="raffleEditorForm" onSubmit={saveRaffle}>
          <label>Nombre del premio<input required minLength={3} maxLength={100} value={raffleForm.title} onChange={(event) => setRaffleForm((form) => ({ ...form, title: event.target.value }))} placeholder="Ej. Computador portátil" /></label>
          <div className="editorFieldGrid">
            <label>Categoría<select value={raffleForm.category} onChange={(event) => setRaffleForm((form) => ({ ...form, category: event.target.value, details: {} }))}>{raffleCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label>Emoji del premio<input required maxLength={16} value={raffleForm.emoji} onChange={(event) => setRaffleForm((form) => ({ ...form, emoji: event.target.value }))} placeholder="🎁" /></label>
          </div>
          <div className="categoryFields"><strong>Ficha para {raffleForm.category}</strong><div className="editorFieldGrid">{formCategoryFields.map((field) => <label key={field.key}>{field.label}<input maxLength={200} value={raffleForm.details[field.key] ?? ""} onChange={(event) => setRaffleForm((form) => ({ ...form, details: { ...form.details, [field.key]: event.target.value } }))} placeholder={field.placeholder} /></label>)}</div></div>
          <RaffleTerritoryFields value={{ territoryScope: raffleForm.territoryScope, territoryDepartment: raffleForm.territoryDepartment, territoryMunicipality: raffleForm.territoryMunicipality, territoryMunicipalities: raffleForm.territoryMunicipalities, territoryDepartments: raffleForm.territoryDepartments }} onChange={(patch) => setRaffleForm((form) => ({ ...form, ...patch }))} />
          <label>Descripción y condiciones del premio<textarea required minLength={8} maxLength={2500} rows={4} value={raffleForm.description} onChange={(event) => setRaffleForm((form) => ({ ...form, description: event.target.value }))} placeholder="Describe qué gana la persona, qué incluye y las condiciones de entrega." /></label>
          <div className="editorFieldGrid"><label>Precio por número (COP)<input required type="number" min={1000} max={1000000000} step={1000} value={raffleForm.unitPrice} onChange={(event) => setRaffleForm((form) => ({ ...form, unitPrice: event.target.value }))} /></label><label>Cantidad de números<input required type="number" min={10} max={10000} step={1} value={raffleForm.totalTickets} onChange={(event) => setRaffleForm((form) => ({ ...form, totalTickets: event.target.value }))} /></label></div>
          <label className="liveToggle"><input type="checkbox" checked={raffleForm.live} onChange={(event) => setRaffleForm((form) => ({ ...form, live: event.target.checked }))} /><span><strong>Marcar como transmisión en vivo</strong><small>El indicador se muestra en el marketplace.</small></span></label>
          {raffleError && <p className="formError" role="alert">{raffleError}</p>}
          <button className="buyTop reserveButton" disabled={raffleSaving}>{raffleSaving ? "Guardando…" : editingRaffle ? "Guardar cambios" : "Crear y publicar rifa"}</button>
        </form>
      </section>
    </div>}

    {selectedDraw && <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDraw(); }}>
      <section className="reservationModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <button className="modalClose" aria-label="Cerrar" onClick={closeDraw}>×</button>
        <p className="eyebrow">{selectedDraw.id} · {selectedDraw.category}</p><h2 id="modalTitle">{selectedDraw.title}</h2>
        {!reservation ? <>
          <button className="modalBusinessLink" onClick={() => { const admin = selectedDraw.admin; closeDraw(); openBusiness(admin); }}>🏪 {selectedDraw.admin} · {selectedDraw.business_city} <span>Ver perfil →</span></button>
          <div className="raffleCoverageDisplay"><span>Cobertura declarada por el negocio</span><strong>{describeRaffleTerritory(selectedDraw).label}</strong><small>Autoridad de referencia: {describeRaffleTerritory(selectedDraw).authority}.</small></div>
          <p className="modalDescription">{selectedDraw.description}</p>
          {Object.entries(readCategoryDetails(selectedDraw.category_details)).filter(([, value]) => value.trim()).length > 0 && <dl className="prizeCategoryDetails">{Object.entries(readCategoryDetails(selectedDraw.category_details)).filter(([, value]) => value.trim()).map(([key, value]) => <div key={key}><dt>{categoryDetailLabels[key] ?? key}</dt><dd>{value}</dd></div>)}</dl>}
          <div className="modalAvailability"><span>Números disponibles</span><strong>{count(selectedDraw.available)} / {count(selectedDraw.total_tickets)}</strong><span>Precio por número</span><strong>{money(selectedDraw.unit_price)}</strong><span>Ocupados</span><strong>{count(selectedDraw.sold + selectedDraw.reserved)}</strong></div>
          <p className="modalDescription">Premio y condiciones de demostración. Elige tus números en el cartón digital; la reserva dura 10 minutos y esta prueba no procesa pagos.</p>
          {!showTicketMap ? <button className="buyTop reserveButton" onClick={() => { setShowTicketMap(true); setTicketLoading(true); }}>Ver cartón digital y elegir números →</button> : <>
            <div className="ticketMapHeading"><div><h3>Cartón digital</h3><p>Selecciona de 1 a 10 números · se actualiza cada 5 s</p></div><div className="mapHeadingActions"><button className="mapJumpButton" disabled={!availableTicketCount} onClick={() => firstAvailableRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })}>↓ Ver disponibles ({count(availableTicketCount)})</button><button className="mapBackButton" onClick={() => { setShowTicketMap(false); setSelectedNumbers([]); }}>← Detalles</button></div></div>
            <div className="ticketLegend"><span><i className="legendAvailable" />Disponible</span><span><i className="legendSelected" />Tu selección</span><span><i className="legendReserved" />Reservado</span><span><i className="legendSold" />Vendido</span></div>
            {ticketLoading && !tickets.length ? <div className="emptyCard">Cargando el cartón…</div> : ticketError ? <div className="emptyCard">{ticketError}<button className="mapBackButton" onClick={() => { setTicketLoading(true); setTicketReload((value) => value + 1); }}>Intentar de nuevo</button></div> : <div className="ticketMap" aria-label="Mapa de números del sorteo">{tickets.map((ticket) => {
              const selected = selectedNumbers.includes(ticket.number);
              const stateClass = selected ? "selected" : ticket.status;
              return <button key={ticket.number} ref={ticket.number === firstAvailableNumber ? firstAvailableRef : undefined} type="button" className={`ticketButton ${stateClass}`} disabled={ticket.status !== "available" || submitting} aria-pressed={selected} aria-label={`Número ${ticket.number}, ${selected ? "seleccionado" : ticket.status === "available" ? "disponible" : ticket.status === "reserved" ? "reservado" : "vendido"}`} onClick={() => toggleTicket(ticket)}>{String(ticket.number).padStart(4, "0")}</button>;
            })}</div>}
            <div className="ticketSelectionSummary"><span>{selectedNumbers.length} {selectedNumbers.length === 1 ? "número seleccionado" : "números seleccionados"}</span><strong>{money(selectedDraw.unit_price * selectedNumbers.length)}</strong></div>
            {selectedNumbers.length > 0 && <form className="reserveForm" onSubmit={reserveTickets}>
              <aside className="raffleTerritoryCallout customerTerritoryCallout" aria-label="Información de cobertura para clientes">
                <strong>Revisa la cobertura de esta rifa</strong>
                <p>Puedes explorar El Ganador desde cualquier lugar. Mostramos el alcance declarado por el negocio, pero esta demo no solicita tu municipio, no verifica permisos y no restringe reservas por ubicación. Reservar números no es una compra ni genera un cobro.</p>
              </aside>
              <label>Tu nombre<input required minLength={2} maxLength={100} autoComplete="name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} /></label>
              <label>Correo electrónico<input required type="email" maxLength={254} autoComplete="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} /></label>
              {formError && <p className="formError" role="alert">{formError}</p>}
              <button className="buyTop reserveButton" disabled={submitting || ticketLoading}>{submitting ? "Reservando…" : `Reservar ${selectedNumbers.length} ${selectedNumbers.length === 1 ? "número" : "números"}`}</button>
            </form>}
          </>}
        </> : <div className="reservationSuccess" role="status"><span className="successMark">✓</span><h3>Reserva creada</h3><p>Estos son tus números:</p><div className="numberChips">{reservation.numbers.map((number) => <span key={number}>{String(number).padStart(4, "0")}</span>)}</div><p className="modalDescription">Vence a las {new Date(reservation.expiresAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}. No se realizó ningún cobro.</p><button className="buyTop reserveButton" onClick={closeDraw}>Listo</button></div>}
      </section>
    </div>}
  </div>;
}

function DrawCard({ draw, isFollowing, onFollow, onOpen, onBusiness, occupied, progress }: {
  draw: Draw;
  isFollowing: boolean;
  onFollow: (admin: string) => void;
  onOpen: (draw: Draw) => void;
  onBusiness: (admin: string) => void;
  occupied: (draw: Draw) => number;
  progress: (draw: Draw) => number;
}) {
  return <article className="productCard">
    <div className="productVisual"><span className="productTag">{draw.live ? "EN VIVO · DEMO" : draw.category}</span>{draw.image_url ? <img src={draw.image_url} alt={draw.title} /> : <span>{draw.emoji}</span>}</div>
    <div className="productInfo"><h3>{draw.title}</h3><div className="productAdmin">Administrado por <button className="inlineLink" onClick={() => onBusiness(draw.admin)}>{draw.admin}</button></div><div className="raffleCardCoverage"><span>Cobertura declarada</span><strong>{describeRaffleTerritory(draw).label}</strong></div><div className="productMeter"><span><b>{count(occupied(draw))}</b> / {count(draw.total_tickets)} ocupados</span><strong>{progress(draw)}%</strong></div><div className="progressTrack"><span style={{ width: `${progress(draw)}%` }} /></div>
      <div className="productBottom"><span className="price">{money(draw.unit_price)} <small>por número</small></span><div><button className="followSmall" aria-pressed={isFollowing} onClick={() => onFollow(draw.admin)}>{isFollowing ? "✓" : "♡"}</button><button className="goAdmin" onClick={() => onOpen(draw)}>Ver sorteo →</button></div></div>
    </div>
  </article>;
}

type PublicPost = { id: string; content: string; image_url: string; created_at: string; account_id: string; business_name: string; business_city: string; category: string };
function NewsFeed({ onBusiness }: { onBusiness: (name: string) => void }) {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/news", { cache: "no-store" }).then((r) => r.json()).then((data: { posts?: PublicPost[] }) => { if (active) setPosts(data.posts ?? []); }).catch(() => undefined);
    void load(); const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return <section className="marketSection newsSection"><div className="sectionTitle"><div><p className="eyebrow">NOTICIAS DE LA COMUNIDAD</p><h2>Lo nuevo de los locales</h2><p>Actualizaciones de tiendas, premios y rifas para clientes y administradores.</p></div><a className="textButton" href="/novedades">Ver novedades →</a></div>{posts.length ? <div className="newsGrid">{posts.slice(0, 4).map((post) => <article className="newsCard" key={post.id}><div className="newsByline"><span className="newsAvatar">{post.business_name.slice(0, 1)}</span><div><button onClick={() => onBusiness(post.business_name)}>{post.business_name}</button><small>{post.business_city || "Colombia"} · {post.category} · {new Date(post.created_at).toLocaleDateString("es-CO")}</small></div></div><p>{post.content}</p>{post.image_url && <img src={post.image_url} alt={`Novedad de ${post.business_name}`} />}<button className="newsStoreLink" onClick={() => { window.location.href = `/?local=${encodeURIComponent(post.business_name)}`; }}>Ver tienda →</button></article>)}</div> : <div className="emptyCard">Cuando una tienda publique una novedad, aparecerá aquí para todos.</div>}</section>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return <div className="metricCard"><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>;
}
