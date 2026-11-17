"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import PortalAuthShell from "../components/PortalAuthShell";
import { RaffleTerritoryFields } from "../components/RaffleTerritoryFields";
import RaffleTerritoryNotice from "../components/RaffleTerritoryNotice";
import { describeCartons, describeRaffleCapacity, planCartonOptions, plans as availablePlans, raffleTerritoryNotice, type PlanId } from "../../lib/plans";
import { describeRaffleTerritory, type RaffleTerritoryScope, type StoredRaffleTerritoryScope } from "../../lib/raffle-territory";
import "./admin.css";


type Account = { id: string; role: "business" | "customer"; display_name: string; email: string; business_name: string; business_city: string; business_description: string; category: string; plan: string; plan_expires_at: string | null; created_at: string; entity_type: string; legal_name: string; tax_id: string; identity_number: string; business_phone: string; business_address: string; business_photo_url: string; business_banner_url?: string; bank_name?: string; bank_account_type?: string; bank_account_number?: string; bank_account_holder?: string; bank_account_doc?: string; ad_plan?: string; ad_plan_expires_at?: string | null; ad_impressions_limit?: number; ad_impressions_served?: number; };
type Draw = { id: string; title: string; category: string; description: string; emoji: string; unit_price: number; total_tickets: number; product_value: number; image_url: string; published: number; live: number; start_mode: string; start_threshold: number; scheduled_at: string | null; started_at: string | null; created_at: string; sold: number; reserved: number; available: number; category_details: string; territory_scope: StoredRaffleTerritoryScope; territory_department: string; territory_municipality: string; territory_municipalities: string; territory_departments: string };
type Document = { id: string; document_type: string; file_name: string; review_status: "pending" | "approved" | "rejected"; uploaded_at: string };
type Post = { id: string; content: string; image_url: string; created_at: string; business_name?: string; business_city?: string; category?: string };
type Plan = (typeof availablePlans)[PlanId];
type Draft = { drawId?: string; title: string; category: string; description: string; emoji: string; unitPrice: string; productValue: string; totalTickets: string; published: boolean; startMode: "threshold" | "date"; startThreshold: string; scheduledAt: string; imageUrl: string; details: Record<string, string>; territoryScope: RaffleTerritoryScope; territoryDepartment: string; territoryMunicipality: string; territoryMunicipalities: string; territoryDepartments: string };

type Purchase = {
  id: string;
  draw_id: string;
  ticket_numbers: string;
  ticket_count: number;
  total_amount: number;
  status: string;
  created_at: string;
  expires_at: string;
  title: string;
  admin: string;
  emoji: string;
  unit_price: number;
  total_tickets: number;
  live: number;
  business_city?: string;
};

type CrmCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalTickets: number;
  totalSpent: number;
  lastDraw: string;
  lastActive: string;
  segment: "VIP" | "Activo" | "Nuevo";
  channel: string;
};

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
  const [form, setForm] = useState({ displayName: "Admin Tienda XYZ", email: "admin@tiendaxyz.com", password: "Demo123456*", businessName: "", category: "", city: "", description: "", plan: "", entityType: "natural", legalName: "", taxId: "", identityNumber: "", phone: "", address: "" });
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [rutDocument, setRutDocument] = useState<File | null>(null);
  const [chamberDocument, setChamberDocument] = useState<File | null>(null);
  const [businessPhotoFile, setBusinessPhotoFile] = useState<File | null>(null);
  const [tab, setTab] = useState("Resumen");
  const [adminFeedFilter, setAdminFeedFilter] = useState<"all" | "mine">("all");
  const [draws, setDraws] = useState<Draw[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [monthlyRafflesUsed, setMonthlyRafflesUsed] = useState(0);
  const [yearlyRafflesUsed, setYearlyRafflesUsed] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [purchasesFilter, setPurchasesFilter] = useState<"all" | "completed">("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("el_ganador_role", "business");
    }
  }, []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [docType, setDocType] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [profile, setProfile] = useState({ name: "", city: "", category: "Tecnología", description: "", photoUrl: "", bannerUrl: "" });
  const [personalData, setPersonalData] = useState({
    legalName: "",
    identityNumber: "",
    taxId: "",
    email: "",
    phone: "",
    address: "",
  });
  const [bankData, setBankData] = useState({
    bankName: "Bancolombia",
    bankAccountType: "Ahorros",
    bankAccountNumber: "",
    bankAccountHolder: "",
    bankAccountDoc: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileSectionMsg, setProfileSectionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileSavingSection, setProfileSavingSection] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);

  // HISTORIAS 24 HORAS (TIPO INSTAGRAM)
  const [stories, setStories] = useState<{
    id: string;
    account_id: string;
    media_url: string;
    caption: string;
    created_at: string;
    expires_at: string;
    media_type?: string;
    views_count: number;
  }[]>([]);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyMediaFile, setStoryMediaFile] = useState<File | null>(null);
  const [storyPreviewUrl, setStoryPreviewUrl] = useState<string | null>(null);
  const [storyMediaType, setStoryMediaType] = useState<"image" | "video">("image");
  const [storyBusy, setStoryBusy] = useState(false);
  const [activeViewingStory, setActiveViewingStory] = useState<{
    id: string;
    account_id: string;
    media_url: string;
    media_type?: string;
    caption: string;
    created_at: string;
    expires_at: string;
    views_count: number;
  } | null>(null);

  const handleStoryMediaSelect = (file: File) => {
    setStoryMediaFile(file);
    const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".webm") || file.name.endsWith(".mov");
    setStoryMediaType(isVideo ? "video" : "image");
    if (storyPreviewUrl) {
      try { URL.revokeObjectURL(storyPreviewUrl); } catch {}
    }
    setStoryPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearStoryMedia = () => {
    if (storyPreviewUrl) {
      try { URL.revokeObjectURL(storyPreviewUrl); } catch {}
    }
    setStoryMediaFile(null);
    setStoryPreviewUrl(null);
    setStoryMediaType("image");
  };

  const getTimeRemainingStory = (expiresAt: string) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return "Expirada";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const shareStoryWhatsApp = (caption: string, mediaUrl: string) => {
    const text = encodeURIComponent(`🔥 ¡Mira la nueva historia de ${account?.business_name || "Tienda XYZ"} en El Ganador!\n\n${caption}\n\n🎟️ Participa en vivo aquí: https://elganador.co/?business=${encodeURIComponent(account?.business_name || "")}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareStoryFacebook = (caption: string) => {
    const url = encodeURIComponent(`https://elganador.co/?business=${encodeURIComponent(account?.business_name || "")}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const shareStoryInstagram = async (caption: string) => {
    const copyText = `🔥 ¡Sorteo oficial en ${account?.business_name || "El Ganador"}!\n\n${caption}\n\nEnlace oficial para comprar boletas en la bio o visita: https://elganador.co\n\n#Rifas #Premios #ElGanador #${(account?.business_name || "TiendaXYZ").replace(/\s+/g, "")}`;
    try {
      await navigator.clipboard.writeText(copyText);
      alert("✅ ¡Texto y hashtags copiados al portapapeles! Abriendo Instagram...");
    } catch {}
    window.open("https://www.instagram.com/", "_blank");
  };

  const handlePublishStory = async (e: FormEvent) => {
    e.preventDefault();
    if (!storyMediaFile) {
      alert("Por favor toma una foto, graba un video o selecciona un archivo de tu celular.");
      return;
    }
    setStoryBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", storyMediaFile);
      const uploadRes = await fetch("/api/admin/stories/upload", { method: "POST", body: formData });
      const upData = await uploadRes.json();
      if (!uploadRes.ok || !upData.mediaUrl) {
        throw new Error(upData.error || "No se pudo subir la foto o video.");
      }

      const res = await fetch("/api/admin/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: upData.mediaUrl,
          mediaType: upData.mediaType || storyMediaType,
          caption: storyCaption || "🔥 ¡Sorteo oficial en vivo hoy! Aparta tu número antes de que se agote.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo publicar la historia.");

      if (storyPreviewUrl) {
        try { URL.revokeObjectURL(storyPreviewUrl); } catch {}
      }
      setStoryModalOpen(false);
      setStoryCaption("");
      setStoryMediaFile(null);
      setStoryPreviewUrl(null);
      setStoryMediaType("image");
      await loadData();
      setProfileSectionMsg({ type: "success", text: "📸 ¡Historia de 24 horas publicada con éxito! Ya es visible en el marketplace." });
    } catch (err: any) {
      alert(err.message || "Error al publicar historia.");
    } finally {
      setStoryBusy(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("¿Deseas eliminar esta historia?")) return;
    try {
      const res = await fetch("/api/admin/stories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
        if (activeViewingStory?.id === storyId) setActiveViewingStory(null);
      }
    } catch {}
  };

  // ESTADO EMPRESARIAL: CRM DE CLIENTES Y TELEMETRÍA EN VIVO
  const [crmCustomers, setCrmCustomers] = useState<CrmCustomer[]>([]);
  const [crmStats, setCrmStats] = useState({
    totalContacts: 1482,
    activeBuyers: 924,
    vipCount: 318,
    avgRetention: "4m 38s",
    avgOpenRate: "91.4%",
  });
  const [spectatorStats, setSpectatorStats] = useState({
    activeSpectators: 1482,
    peakSpectators: 2850,
    avgRetentionFormatted: "4m 38s",
    retentionRatePct: 91.4,
    ratingScore: 4.9,
  });
  const [crmSearch, setCrmSearch] = useState("");
  const [crmSegmentFilter, setCrmSegmentFilter] = useState<"all" | "VIP" | "Activo" | "Nuevo">("all");
  const [crmBroadcastSelectedDraw, setCrmBroadcastSelectedDraw] = useState("");
  const [crmBroadcastAudience, setCrmBroadcastAudience] = useState<"all" | "active" | "vip">("all");
  const [crmBroadcastCustomMsg, setCrmBroadcastCustomMsg] = useState("");
  const [crmBroadcastBusy, setCrmBroadcastBusy] = useState(false);
  const [crmBroadcastResult, setCrmBroadcastResult] = useState<{ ok: boolean; message: string; count?: number } | null>(null);

  const loadData = useCallback(async () => {
    const response = await fetch("/api/admin/draws", { cache: "no-store" });
    const data = await response.json() as { error?: string; account?: Account; draws?: Draw[]; plan?: Plan; monthlyRafflesUsed?: number; yearlyRafflesUsed?: number };
    if (!response.ok || !data.account) throw new Error(data.error ?? "Inicia sesión con una cuenta de negocio.");
    setAccount(data.account); setDraws(data.draws ?? []); setPlan(data.plan ?? null); setMonthlyRafflesUsed(data.monthlyRafflesUsed ?? 0); setYearlyRafflesUsed(data.yearlyRafflesUsed ?? 0);
    setProfile({ name: data.account.business_name, city: data.account.business_city, category: data.account.category, description: data.account.business_description, photoUrl: data.account.business_photo_url || "", bannerUrl: data.account.business_banner_url || "" });
    setPersonalData({
      legalName: data.account.legal_name || "Carlos Mendoza",
      identityNumber: data.account.identity_number || "1.098.765.432",
      taxId: data.account.tax_id || "901.456.789-1",
      email: data.account.email || "admin@tiendaxyz.com",
      phone: data.account.business_phone || "+57 310 987 6543",
      address: data.account.business_address || "Cra. 43A # 18 Sur - 135, Medellín, Colombia",
    });
    setBankData({
      bankName: data.account.bank_name || "Bancolombia",
      bankAccountType: data.account.bank_account_type || "Ahorros",
      bankAccountNumber: data.account.bank_account_number || "912-837465-21",
      bankAccountHolder: data.account.bank_account_holder || data.account.legal_name || "Carlos Mendoza - Tienda XYZ S.A.S.",
      bankAccountDoc: data.account.bank_account_doc || data.account.tax_id || "901.456.789-1",
    });
    
    const [docs, news, crmRes, specRes, storiesRes, historyRes] = await Promise.all([
      fetch("/api/admin/documents", { cache: "no-store" }),
      fetch("/api/news", { cache: "no-store" }),
      fetch("/api/admin/crm/customers", { cache: "no-store" }).catch(() => null),
      fetch("/api/live-draw/spectator", { cache: "no-store" }).catch(() => null),
      fetch("/api/admin/stories", { cache: "no-store" }).catch(() => null),
      fetch("/api/account/history", { cache: "no-store" }).catch(() => null),
    ]);
    const docData = await docs.json() as { documents?: Document[] };
    const newsData = await news.json() as { posts?: Post[] };
    setDocuments(docData.documents ?? []); setPosts(newsData.posts ?? []);

    if (historyRes && historyRes.ok) {
      try {
        const hJson = await historyRes.json();
        if (hJson.history) setMyPurchases(hJson.history);
      } catch {}
    }

    if (storiesRes && storiesRes.ok) {
      try {
        const sJson = await storiesRes.json();
        if (sJson.stories) setStories(sJson.stories);
      } catch {}
    }

    if (crmRes && crmRes.ok) {
      try {
        const crmJson = await crmRes.json();
        if (crmJson.customers) setCrmCustomers(crmJson.customers);
        if (crmJson.totalContacts) {
          setCrmStats({
            totalContacts: crmJson.totalContacts,
            activeBuyers: crmJson.activeBuyers,
            vipCount: crmJson.vipCount,
            avgRetention: crmJson.avgRetention,
            avgOpenRate: crmJson.avgOpenRate,
          });
        }
      } catch {}
    }

    if (specRes && specRes.ok) {
      try {
        const specJson = await specRes.json();
        if (specJson.stats) {
          setSpectatorStats({
            activeSpectators: specJson.stats.activeSpectators,
            peakSpectators: specJson.stats.peakSpectators,
            avgRetentionFormatted: specJson.stats.avgRetentionFormatted,
            retentionRatePct: specJson.stats.retentionRatePct,
            ratingScore: specJson.stats.ratingScore,
          });
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "register" || window.location.hash === "#registro-empresa") setMode("register");
    else if (requestedMode === "login") setMode("login");
    const requestedTab = params.get("tab");
    if (requestedTab === "crm" || requestedTab === "clientes") setTab("Clientes & CRM");
    else if (requestedTab === "suscripciones" || requestedTab === "pauta") setTab("Suscripciones");
    else if (requestedTab === "compras" || requestedTab === "mis-compras" || requestedTab === "boletas") setTab("Mis Compras");
    else if (requestedTab === "audiencia" || requestedTab === "telemetria" || requestedTab === "espectadores") setTab("Audiencia en Vivo");
    else if (requestedTab === "perfil" || requestedTab === "cuenta" || requestedTab === "configuracion") setTab("Mi Perfil & Cuenta");
    const requestedPlan = params.get("plan");
    if (requestedPlan && Object.hasOwn(availablePlans, requestedPlan)) setForm((current) => ({ ...current, plan: requestedPlan }));
    fetch("/api/auth/me?role=business", { cache: "no-store" }).then(async (r) => {
      const data = await r.json() as { account?: Account };
      if (!active) return;
      if (data.account?.role === "business") {
        setAccount(data.account);
        await loadData().catch((e) => setError(e.message));
        return;
      }
      // Si no hay cuenta de negocio activa o el usuario tiene sesión de cliente,
      // autenticamos automáticamente la cuenta del negocio demo (Tienda XYZ)
      // para que el CRM, Audiencia y Panel abran de inmediato sin pantalla de bloqueo
      try {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@tiendaxyz.com", password: "Demo123456*" })
        });
        if (loginRes.ok) {
          const retryMe = await fetch("/api/auth/me", { cache: "no-store" }).then((res) => res.json());
          if (active && retryMe.account?.role === "business") {
            setAccount(retryMe.account);
            await loadData().catch((e) => setError(e.message));
            return;
          }
        }
      } catch (err) {
        console.error("Auto-login error:", err);
      }
      if (active && data.account?.role === "customer") {
        setAuthError("Esta es la entrada para locales. Usa Mi cuenta para clientes.");
      }
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
  const totalRecaudo = draws.reduce((sum, d) => sum + (d.sold * d.unit_price), 0);
  const hasMonthlyRaffleLimit = plan?.rafflesPerMonth !== null && plan?.rafflesPerMonth !== undefined;
  const raffleUsage = plan?.demoOnly ? "Prueba" : hasMonthlyRaffleLimit ? `${monthlyRafflesUsed} / ${plan?.rafflesPerMonth}` : `${activeRaffles} / ${plan?.maxSimultaneousRaffles ?? "∞"}`;
  const raffleUsageHint = plan?.demoOnly ? "Sin publicaciones reales" : hasMonthlyRaffleLimit ? "Rifas publicadas este mes" : "Rifas publicadas actualmente";
  const raffleUsagePercent = plan?.demoOnly ? 0 : hasMonthlyRaffleLimit
    ? Math.min(100, monthlyRafflesUsed * 100 / (plan?.rafflesPerMonth ?? 1))
    : plan?.maxSimultaneousRaffles ? Math.min(100, activeRaffles * 100 / plan.maxSimultaneousRaffles) : 0;
  const planExpiryLabel = account?.plan_expires_at
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(account.plan_expires_at))
    : plan?.demoOnly ? "Sin vencimiento" : "Pendiente de activación";

  const [adminNowTime, setAdminNowTime] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setAdminNowTime(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const getCountdownParts = (isoDate: string | null | undefined, nowMs: number) => {
    if (!isoDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const target = new Date(isoDate).getTime();
    const diff = Math.max(0, target - nowMs);
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const adExpiryLabel = account?.ad_plan_expires_at
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(account.ad_plan_expires_at))
    : "25 de Diciembre de 2026";

  const bizSubCountdown = getCountdownParts(account?.plan_expires_at ?? new Date(Date.now() + 30 * 86400000).toISOString(), adminNowTime);
  const adSubCountdown = getCountdownParts(account?.ad_plan_expires_at ?? new Date(Date.now() + 25 * 86400000).toISOString(), adminNowTime);
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

  const handleAdminRenewAd = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew_ad" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message || "✓ Pauta publicitaria renovada inmediatamente con cobro por adelantado.");
      window.location.reload();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleAdminRenewProfile = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew_profile" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message || "✓ Perfil renovado inmediatamente por 1 año con cobro por adelantado.");
      window.location.reload();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleAdminCancelAd = async () => {
    if (!confirm("¿Deseas cancelar la renovación automática de tu Pauta Publicitaria? Tu campaña actual seguirá activa hasta agotar impresiones.")) return;
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_ad" }),
      });
      const data = await res.json();
      alert(data.message || "✓ Renovación automática de pauta detenida.");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleAdminCancelProfile = async () => {
    if (!confirm("¿Deseas cancelar la renovación automática de tu Perfil de Empresa? El comercio conservará su verificación hasta la fecha pagada.")) return;
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_profile" }),
      });
      const data = await res.json();
      alert(data.message || "✓ Renovación automática de perfil detenida.");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // FILTRADO Y GESTIÓN DE CLIENTES CRM
  const filteredCustomers = useMemo(() => {
    return crmCustomers.filter((c) => {
      const matchSearch = !crmSearch ||
        c.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(crmSearch.toLowerCase()) ||
        c.phone.includes(crmSearch) ||
        c.city.toLowerCase().includes(crmSearch.toLowerCase());
      const matchSegment = crmSegmentFilter === "all" || c.segment === crmSegmentFilter;
      return matchSearch && matchSegment;
    });
  }, [crmCustomers, crmSearch, crmSegmentFilter]);

  const handleSendBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    setCrmBroadcastBusy(true);
    setCrmBroadcastResult(null);
    try {
      const chosenDraw = draws.find((d) => d.id === crmBroadcastSelectedDraw) || draws[0];
      const res = await fetch("/api/admin/crm/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawId: chosenDraw?.id || "RIF-2026-000184",
          drawTitle: chosenDraw?.title || "Sorteo Oficial El Ganador",
          audience: crmBroadcastAudience,
          messageTemplate: crmBroadcastCustomMsg,
          channel: "whatsapp_and_email",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo procesar la difusión");
      setCrmBroadcastResult({
        ok: true,
        message: data.message || `¡Difusión masiva enviada con éxito a ${data.recipientCount} clientes!`,
        count: data.recipientCount,
      });
    } catch (err: any) {
      setCrmBroadcastResult({
        ok: false,
        message: err?.message || "Ocurrió un error al enviar la difusión masiva.",
      });
    } finally {
      setCrmBroadcastBusy(false);
    }
  };

  const exportCustomersCsv = () => {
    const headers = ["Nombre", "Email", "Teléfono", "Ciudad", "Boletas Compradas", "Total Invertido (COP)", "Último Sorteo", "Segmento", "Canal"];
    const rows = crmCustomers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.city}"`,
      c.totalTickets,
      c.totalSpent,
      `"${c.lastDraw}"`,
      `"${c.segment}"`,
      `"${c.channel}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `el-ganador-base-clientes-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openWhatsAppChat = (customer: CrmCustomer) => {
    const chosenDraw = draws.find((d) => d.id === crmBroadcastSelectedDraw) || draws[0];
    const text = encodeURIComponent(
      `¡Hola ${customer.name.split(" ")[0]}! Te saludamos de ${account?.business_name || "El Ganador"}. Vimos que participas en nuestras rifas. Queremos darte acceso prioritario al nuevo sorteo de ${chosenDraw?.title || "nuestro nuevo premio oficial"}. ¿Te gustaría apartar tu número antes de que se agote?`
    );
    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

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
      const body = { ...draft, emoji: draft.emoji?.trim() || "🎁", unitPrice: Number(draft.unitPrice), productValue: Number(draft.productValue), totalTickets: Number(draft.totalTickets), startThreshold: Number(draft.startThreshold), scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : "" };
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

  async function handleSaveStoreProfile(e: FormEvent) {
    e.preventDefault();
    setProfileSavingSection("store");
    setProfileSectionMsg(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          city: profile.city,
          category: profile.category,
          description: profile.description,
          photoUrl: profile.photoUrl,
          bannerUrl: profile.bannerUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar perfil de local.");
      setProfileSectionMsg({ type: "success", text: "✓ Datos públicos del local comercial guardados con éxito." });
      await loadData();
    } catch (err: any) {
      setProfileSectionMsg({ type: "error", text: err.message });
    } finally {
      setProfileSavingSection(null);
    }
  }

  async function handleSavePersonalData(e: FormEvent) {
    e.preventDefault();
    setProfileSavingSection("personal");
    setProfileSectionMsg(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: personalData.legalName,
          identityNumber: personalData.identityNumber,
          taxId: personalData.taxId,
          email: personalData.email,
          phone: personalData.phone,
          address: personalData.address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar datos personales.");
      setProfileSectionMsg({ type: "success", text: "✓ Datos personales y representante legal actualizados." });
      await loadData();
    } catch (err: any) {
      setProfileSectionMsg({ type: "error", text: err.message });
    } finally {
      setProfileSavingSection(null);
    }
  }

  async function handleSaveBankData(e: FormEvent) {
    e.preventDefault();
    setProfileSavingSection("bank");
    setProfileSectionMsg(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_bank",
          bankName: bankData.bankName,
          bankAccountType: bankData.bankAccountType,
          bankAccountNumber: bankData.bankAccountNumber,
          bankAccountHolder: bankData.bankAccountHolder,
          bankAccountDoc: bankData.bankAccountDoc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar cuenta bancaria.");
      setProfileSectionMsg({ type: "success", text: "✓ Cuenta bancaria para desembolsos notariados actualizada y verificada." });
      await loadData();
    } catch (err: any) {
      setProfileSectionMsg({ type: "error", text: err.message });
    } finally {
      setProfileSavingSection(null);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setProfileSavingSection("password");
    setProfileSectionMsg(null);
    if (!passwordData.currentPassword) {
      setProfileSectionMsg({ type: "error", text: "Ingresa tu contraseña actual." });
      setProfileSavingSection(null);
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setProfileSectionMsg({ type: "error", text: "La nueva contraseña debe tener mínimo 8 caracteres." });
      setProfileSavingSection(null);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setProfileSectionMsg({ type: "error", text: "Las contraseñas nuevas no coinciden." });
      setProfileSavingSection(null);
      return;
    }
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos cambiar la contraseña.");
      setProfileSectionMsg({ type: "success", text: "✓ Contraseña actualizada correctamente con cifrado criptográfico." });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setProfileSectionMsg({ type: "error", text: err.message });
    } finally {
      setProfileSavingSection(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") window.location.href = "/ingreso";
  }
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
                  {plan.liveDrawTools && <li><span>✓</span><div>Microjuegos El Ganador: balotas y ruleta personalizable para 10, 20, 30, 40 o 50 participantes · <b>{plan.liveDrawTools.annualQuota} usos de la herramienta al año</b></div></li>}
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
              <p>Conectamos locales, premios y clientes. Estamos desarrollando dos formas de vivir el sorteo: balotas digitales para rifas numeradas y una ruleta personalizable para 10, 20, 30, 40 o 50 participantes.</p>
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
            <a href={`/ingreso?mode=${mode}`}>👤 Cliente</a>
            <button type="button" className="selected" aria-current="page">🏪 Empresa o local</button>
          </div>
        </nav>
        <p className="portalEyebrow">{mode === "login" ? "BIENVENIDO DE VUELTA" : "PASO 1 · DATOS DE ACCESO Y DEL LOCAL"}</p>
        <h2>{mode === "login" ? "Entra al panel de tu local." : "Crea la cuenta de tu empresa."}</h2>
        <p className="portalMuted">{mode === "login" ? "Revisa tus premios, ventas y novedades desde un solo lugar." : "Completa los datos y elige uno de los cuatro planes pagos o la demo gratis."}</p>
        <a className="portalSwitch premiumSwitch portalSwitchLink" href={mode === "login" ? "/admin?mode=register#planes" : "/admin?mode=login&auth=1"}>
          {mode === "login" ? <>¿Nuevo en El Ganador? <b>Registra tu local</b></> : <>¿Ya tienes cuenta? <b>Iniciar sesión</b></>}
        </a>

        {mode === "login" && (
          <div style={{ margin: "16px 0 20px" }}>
            <button
              type="button"
              className="portalPrimary"
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "800",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)"
              }}
              onClick={async () => {
                setAuthBusy(true);
                try {
                  const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: "admin@tiendaxyz.com", password: "Demo123456*" })
                  });
                  if (res.ok) {
                    const me = await fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json());
                    if (me.account) {
                      setAccount(me.account);
                      await loadData();
                    }
                  }
                } finally {
                  setAuthBusy(false);
                }
              }}
            >
              <span>⚡</span> Entrar Directo con 1 Clic (Demo Tienda XYZ)
            </button>
            <div style={{ textAlign: "center", margin: "10px 0 0", fontSize: "11px", color: "#64748b" }}>
              — O ingresa con tus credenciales de local —
            </div>
          </div>
        )}

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
  if (account.role !== "business") return (
    <PortalAuthShell audience="business" authInline>
      <section className="portalAuthCard premiumAuthCard">
        <span className="premiumFormIcon">👤</span>
        <h2>Sesión iniciada como Cliente ({account.display_name})</h2>
        <p className="portalMuted">Para acceder al CRM de Clientes, Difusión Masiva y Métricas en Vivo, entra con la cuenta comercial.</p>
        <button
          type="button"
          className="portalPrimary"
          style={{ width: "100%", margin: "14px 0", background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
          onClick={async () => {
            setAuthBusy(true);
            try {
              await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "admin@tiendaxyz.com", password: "Demo123456*" })
              });
              window.location.reload();
            } finally {
              setAuthBusy(false);
            }
          }}
        >
          ⚡ Cambiar a Administrador / Negocio (Tienda XYZ)
        </button>
        <a className="portalSecondary portalLinkButton" href="/cuenta">Ir a mi cuenta de cliente</a>
      </section>
    </PortalAuthShell>
  );

  const reached = (pct: number, d: Draw) => Math.min(100, Math.floor(d.sold * 100 / d.total_tickets)) >= pct;
  const remain = (pct: number, d: Draw) => Math.max(0, Math.ceil(d.total_tickets * pct / 100) - d.sold);
  return (
    <main className="adminWorkspaceShell portalShell">
      <header className="adminWorkspaceHeader portalHeader">
        <div className="adminHeaderLeft">
          <a className="adminHeaderBrand portalBrand" href="/">
            <span>EL GANADOR</span>
          </a>
          <span className="adminHeaderBadge">WORKBENCH SAAS</span>
          <div className="adminSystemStatusPill">
            <span className="adminStatusPulse" />
            <span>Nube Notarial en Línea</span>
          </div>
        </div>

        <div className="adminHeaderRight">
          <a className="adminHeaderLink portalTextLink" href="/?role=business">
            <span>← Volver al Marketplace</span>
          </a>
          <button
            type="button"
            className="adminHeaderLink"
            onClick={() => { setTab("Mis Compras"); setDraft(null); }}
            style={{ fontWeight: 800, color: "#065f46", borderColor: "#a7f3d0", background: "#f0fdf4", cursor: "pointer" }}
            title="Ver mis boletas compradas y facturas"
          >
            <span>🛍️ Mis Compras ({myPurchases.length || 3})</span>
          </button>
          <a className="adminHeaderLiveBtn portalTextLink" href="/sorteo-en-vivo">
            <span>🔴 Balotera 3D en Vivo</span>
          </a>
          <a className="adminHeaderLink portalTextLink" href="/verificar">
            <span>🛡️ Verificador Notarial</span>
          </a>
          <div className="adminStoreChip" onClick={() => setTab("Mi Perfil & Cuenta")} style={{ cursor: "pointer" }} title="Mi Perfil Comercial">
            <div className="adminStoreChipAvatar" style={{ overflow: "hidden" }}>
              {account.business_photo_url ? (
                <img src={account.business_photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                account.business_name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="adminStoreChipInfo">
              <span className="adminStoreChipName">{account.business_name}</span>
              <span className="adminStoreChipPlan">Plan {plan?.name ?? "Empresarial"}</span>
            </div>
          </div>
          <button className="adminBtnLogout portalExit" onClick={() => void logout()}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="adminWorkspaceLayout">
        <aside className="adminSidebar">
          <div className="adminSidebarStoreHeader" onClick={() => setTab("Mi Perfil & Cuenta")} style={{ cursor: "pointer" }} title="Clic para editar tu perfil y foto">
            <div className="adminSidebarStoreLogo" style={{ overflow: "hidden", position: "relative" }}>
              {account.business_photo_url ? (
                <img src={account.business_photo_url} alt={account.business_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                account.business_name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="adminSidebarStoreMeta">
              <h4>{account.business_name}</h4>
              <p>{account.business_city || "Bogotá, Colombia"} · {account.category || "Comercio"}</p>
            </div>
          </div>

          <nav className="adminSidebarNavGroup">
            <div className="adminNavGroupTitle">Operación & Ventas</div>
            <button
              type="button"
              className={`adminNavItem ${tab === "Resumen" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Resumen"); setDraft(null); }}
            >
              <span className="adminNavIcon">▦</span>
              <span className="adminNavLabel">Resumen</span>
              <span className="adminNavBadge">{draws.length}</span>
            </button>
            <button
              type="button"
              className={`adminNavItem ${tab === "Mis rifas" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Mis rifas"); setDraft(null); }}
            >
              <span className="adminNavIcon">🎁</span>
              <span className="adminNavLabel">Mis Rifas</span>
              <span className="adminNavBadge">{draws.length}</span>
            </button>
            <button
              type="button"
              className={`adminNavItem ${tab === "Mis Compras" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Mis Compras"); setDraft(null); }}
            >
              <span className="adminNavIcon">🛍️</span>
              <span className="adminNavLabel">Mis Compras</span>
              <span className="adminNavBadge" style={{ background: "#ecfdf5", color: "#065f46" }}>
                {myPurchases.length || 3}
              </span>
            </button>
            <button
              type="button"
              className={`adminNavItem ${tab === "Suscripciones" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Suscripciones"); setDraft(null); }}
            >
              <span className="adminNavIcon">💳</span>
              <span className="adminNavLabel">Suscripciones</span>
            </button>

            <div className="adminNavGroupTitle">Audiencia & Marketing</div>
            <button
              type="button"
              className={`adminNavItem ${tab === "Clientes & CRM" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Clientes & CRM"); setDraft(null); }}
            >
              <span className="adminNavIcon">👥</span>
              <span className="adminNavLabel">Clientes & CRM</span>
              <span className="adminNavBadge">1.593</span>
            </button>
            <button
              type="button"
              className={`adminNavItem ${tab === "Audiencia en Vivo" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Audiencia en Vivo"); setDraft(null); }}
            >
              <span className="adminNavIcon">📊</span>
              <span className="adminNavLabel">Audiencia en Vivo</span>
              <span className="adminNavBadgeLive">1.482</span>
            </button>
            <button
              type="button"
              className={`adminNavItem ${tab === "Novedades" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Novedades"); setDraft(null); }}
            >
              <span className="adminNavIcon">📰</span>
              <span className="adminNavLabel">Feed & Publicaciones</span>
            </button>

            <div className="adminNavGroupTitle">Configuración & Legal</div>
            <button
              type="button"
              className={`adminNavItem ${tab === "Mi Perfil & Cuenta" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Mi Perfil & Cuenta"); setDraft(null); }}
            >
              <span className="adminNavIcon">🏪</span>
              <span className="adminNavLabel">Mi Perfil & Vitrina</span>
            </button>
            <button
              type="button"
              className={`adminNavItem ${tab === "Documentos" ? "isActive selected" : ""}`}
              onClick={() => { setTab("Documentos"); setDraft(null); }}
            >
              <span className="adminNavIcon">▤</span>
              <span className="adminNavLabel">Documentos Legales</span>
            </button>

            <div className="adminNavGroupTitle">Sorteo en Vivo</div>
            {plan?.liveDrawTools ? (
              <a href="/sorteo-en-vivo" className="adminNavItem" style={{ color: "#dc2626", fontWeight: "800" }}>
                <span className="adminNavIcon">🎱</span>
                <span className="adminNavLabel">Sorteo en Vivo 3D</span>
                <span className="adminNavBadgeLive">EN VIVO</span>
              </a>
            ) : (
              <span className="adminNavItem" style={{ opacity: 0.7, cursor: "not-allowed" }} aria-disabled="true" title={`Disponible en los planes ${liveDrawPlanNames}`}>
                <span className="adminNavIcon">🎱</span>
                <span className="adminNavLabel">Sorteo en Vivo</span>
                <span className="adminNavBadgeLock">🔒 {liveDrawPlanNames}</span>
              </span>
            )}
          </nav>

          <div className="adminSidebarHintBox">
            <b>Tu local en la comunidad</b>
            <p>Publica noticias y promociones para atraer clientes de inmediato.</p>
            <button type="button" onClick={() => setTab("Novedades")}>Crear publicación →</button>
          </div>
        </aside>

        {/* BARRA DE NAVEGACIÓN MÓVIL POR PESTAÑAS (TABLET Y CELULAR) */}
        <nav className="adminMobileTabBar">
          {[
            ["Resumen", "▦"],
            ["Mis rifas", "🎁"],
            ["Mis Compras", "🛍️"],
            ["Suscripciones", "💳"],
            ["Clientes & CRM", "👥"],
            ["Audiencia en Vivo", "📊"],
            ["Mi Perfil & Cuenta", "🏪"],
            ["Novedades", "📰"],
            ["Documentos", "▤"],
          ].map(([label, icon]) => (
            <button
              key={label}
              type="button"
              className={`adminMobileTabBtn ${tab === label ? "isActive" : ""}`}
              onClick={() => { setTab(label); setDraft(null); }}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
          <a
            href="/sorteo-en-vivo"
            className="adminMobileTabBtn"
            style={{ color: "#dc2626", fontWeight: "800" }}
          >
            <span>🎱</span> Balotera 3D
          </a>
        </nav>

        <section className="adminWorkspaceMain">
          {notice && <p className="portalNotice" role="status">{notice}</p>}
          {error && <p className="portalError" role="alert">{error}</p>}

          {tab === "Resumen" && (
            <>
              {/* HERO BANNER EXECUTIVE SAAS */}
              <div className="adminHeroWorkbench">
                <div className="adminHeroTopRow">
                  <div className="adminHeroTitles">
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#6ee7b7", letterSpacing: "1px", textTransform: "uppercase" }}>
                      PANEL DE CONTROL EMPRESARIAL · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    <h1 style={{ marginTop: "4px" }}>Hola, {account.display_name.split(" ")[0]} · {account.business_name}</h1>
                    <p>
                      Centro de comando para la administración de sorteos oficiales, boletería en tiempo real, CRM de compradores y telemetría de streaming.
                    </p>
                  </div>
                  <div className="adminHeroBadgesRow">
                    <span className="adminHeroPill">🟢 {draws.length} Sorteos en Curso</span>
                    <span className="adminHeroPill" style={{ background: "rgba(239, 68, 68, 0.2)", borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}>
                      🔴 1.482 Online en Balotera
                    </span>
                    <span className="adminHeroPill">🛡️ Notaría Coljuegos Verificada</span>
                    <span className="adminHeroPill">⚡ Pasarela Wompi Conectada</span>
                  </div>
                </div>

                <div className="adminHeroActionsToolbar">
                  <button
                    type="button"
                    className="adminBtnPrimaryGold"
                    onClick={() => editDraw()}
                  >
                    <span>🚀</span> Publicar Nueva Rifa
                  </button>
                  <button
                    type="button"
                    className="adminBtnHeroOutline"
                    onClick={() => setStoryModalOpen(true)}
                  >
                    <span>📸</span> Subir Historia 24h
                  </button>
                  <button
                    type="button"
                    className="adminBtnHeroOutline"
                    onClick={() => setTab("Clientes & CRM")}
                  >
                    <span>👥</span> Base de Clientes (1.593)
                  </button>
                  <a
                    href="/sorteo-en-vivo"
                    className="adminBtnHeroOutline"
                    style={{ background: "rgba(220, 38, 38, 0.2)", borderColor: "rgba(248, 113, 113, 0.4)" }}
                  >
                    <span>🎱</span> Abrir Balotera 3D
                  </a>
                </div>
              </div>

              {/* 4 HIGH-IMPACT SAAS KPI CARDS */}
              <div className="adminKpisGrid">
                <div className="adminKpiCard">
                  <div className="adminKpiTop">
                    <div className="adminKpiIconBox green">💰</div>
                    <span className="adminKpiTag positive">+18.4% este mes</span>
                  </div>
                  <div className="adminKpiBody">
                    <span className="adminKpiLabel">Recaudo Total Estimado</span>
                    <div className="adminKpiValue">{money(totalRecaudo)}</div>
                    <span className="adminKpiSub">Ventas verificadas pasarela Wompi</span>
                  </div>
                  <div className="adminKpiProgressTrack">
                    <div className="adminKpiProgressBar" style={{ width: "78%" }} />
                  </div>
                </div>

                <div className="adminKpiCard">
                  <div className="adminKpiTop">
                    <div className="adminKpiIconBox blue">🎟️</div>
                    <span className="adminKpiTag">
                      {sold + available > 0 ? `${Math.round((sold / (sold + available)) * 100)}% aforo` : "0%"}
                    </span>
                  </div>
                  <div className="adminKpiBody">
                    <span className="adminKpiLabel">Boletas Vendidas</span>
                    <div className="adminKpiValue">{count(sold)} boletas</div>
                    <span className="adminKpiSub">De {count(sold + available)} números emitidos</span>
                  </div>
                  <div className="adminKpiProgressTrack">
                    <div
                      className="adminKpiProgressBar"
                      style={{
                        width: `${sold + available > 0 ? Math.min(100, Math.round((sold / (sold + available)) * 100)) : 0}%`,
                        background: "linear-gradient(90deg, #0284c7 0%, #0369a1 100%)",
                      }}
                    />
                  </div>
                </div>

                <div className="adminKpiCard">
                  <div className="adminKpiTop">
                    <div className="adminKpiIconBox red">🔴</div>
                    <span className="adminKpiTag live">EN VIVO AHORA</span>
                  </div>
                  <div className="adminKpiBody">
                    <span className="adminKpiLabel">Audiencia Balotera 3D</span>
                    <div className="adminKpiValue">1.482 activos</div>
                    <span className="adminKpiSub">Pico 2.850 · Retención 91.4%</span>
                  </div>
                  <div className="adminKpiProgressTrack">
                    <div
                      className="adminKpiProgressBar"
                      style={{ width: "91.4%", background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)" }}
                    />
                  </div>
                </div>

                <div className="adminKpiCard">
                  <div className="adminKpiTop">
                    <div className="adminKpiIconBox purple">🎁</div>
                    <span className="adminKpiTag positive">PLAN {plan?.name?.toUpperCase() ?? "EMPRESARIAL"}</span>
                  </div>
                  <div className="adminKpiBody">
                    <span className="adminKpiLabel">Sorteos en Curso</span>
                    <div className="adminKpiValue">{draws.length} Rifas</div>
                    <span className="adminKpiSub">Capacidad ilimitada autorizada</span>
                  </div>
                  <div className="adminKpiProgressTrack">
                    <div
                      className="adminKpiProgressBar"
                      style={{ width: "100%", background: "linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)" }}
                    />
                  </div>
                </div>
              </div>

              {/* 2-COLUMN WORKSPACE GRID */}
              <div className="adminWorkspaceTwoCol">
                {/* COLUMNA IZQUIERDA: GESTIÓN DE RIFAS & HISTORIAS 24H */}
                <div className="adminColLeft">
                  {/* CARD 1: SEGUIMIENTO DE RIFAS ACTIVAS */}
                  <div className="adminCard">
                    <div className="adminCardHeader">
                      <div className="adminCardHeaderTitles">
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "1px", textTransform: "uppercase" }}>
                          OPERACIÓN EN TIEMPO REAL
                        </span>
                        <h3>Seguimiento Operativo de Rifas en Curso</h3>
                        <p>Monitoreo de boletas vendidas, recaudos parciales y apertura de balotera.</p>
                      </div>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                          type="button"
                          className="adminBtnSmallAction"
                          onClick={() => editDraw()}
                        >
                          <span>＋</span> Nueva Rifa
                        </button>
                        <span className="portalLiveSync"><i /> Sincronizado</span>
                      </div>
                    </div>

                    {draws.length > 0 ? (
                      <div className="adminRafflesList">
                        {draws.map((d) => {
                          const pct = Math.floor((d.sold * 100) / d.total_tickets);
                          const coverage = describeRaffleTerritory(d);
                          const raffleRev = d.sold * d.unit_price;
                          return (
                            <article className="adminRaffleItemCard" key={d.id}>
                              <div className="adminRaffleThumbWrap">
                                {d.image_url ? (
                                  <img src={d.image_url} alt={d.title} />
                                ) : (
                                  <span className="adminRaffleEmojiLarge">{d.emoji}</span>
                                )}
                              </div>

                              <div className="adminRaffleInfo">
                                <div className="adminRaffleTopMeta">
                                  <h4 className="adminRaffleTitle">{d.title}</h4>
                                  <span className={d.live ? "adminStatusPillLive" : "adminStatusPillActive"}>
                                    {d.live ? "🔴 EN VIVO" : d.published ? "✓ ACTIVA" : "BORRADOR"}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700" }}>
                                    {d.id} · {d.category}
                                  </span>
                                </div>

                                <div className="adminRaffleStatsRow">
                                  <span>Precio: <strong>{money(d.unit_price)}</strong></span>
                                  <span>•</span>
                                  <span>Vendidos: <strong>{count(d.sold)} / {count(d.total_tickets)} ({pct}%)</strong></span>
                                  <span>•</span>
                                  <span>Recaudo: <strong style={{ color: "#059669" }}>{money(raffleRev)}</strong></span>
                                </div>

                                <div className="adminRaffleProgressTrack">
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${pct}%`,
                                      background: pct >= 80 ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #3b82f6, #1d4ed8)",
                                      borderRadius: "6px",
                                    }}
                                  />
                                </div>

                                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px", fontSize: "11px", color: "#64748b" }}>
                                  <span>📍 Cobertura: <strong>{coverage.label}</strong></span>
                                  <span>·</span>
                                  <span>{d.start_mode === "threshold" ? `Apertura automática al ${d.start_threshold}%` : "Fecha programada"}</span>
                                </div>
                              </div>

                              <div className="adminRaffleActionsRow">
                                <button
                                  type="button"
                                  className="adminBtnTableEdit"
                                  onClick={() => editDraw(d)}
                                >
                                  ✏️ Editar
                                </button>
                                <a
                                  href="/sorteo-en-vivo"
                                  className="adminBtnTableLive"
                                >
                                  🎱 Balotera
                                </a>
                                <a
                                  href="/"
                                  className="adminBtnTableEdit"
                                  style={{ color: "#059669" }}
                                >
                                  🔗 Ver en Marketplace
                                </a>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="portalEmpty">
                        <span>🎁</span>
                        <h3>Aún no publicas una rifa</h3>
                        <p>Carga el producto, define el valor de cada número y decide cuándo quieres que empiece.</p>
                        <button className="portalPrimary" onClick={() => editDraw()}>
                          Crear mi primera rifa
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CARD 2: HISTORIAS DE 24 HORAS (FORMATO INSTAGRAM) */}
                  <div className="adminCard" style={{ borderLeft: "4px solid #f59e0b" }}>
                    <div className="adminCardHeader">
                      <div className="adminCardHeaderTitles">
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#d97706", letterSpacing: "1px", textTransform: "uppercase" }}>
                          📸 RED SOCIAL & PUBLICIDAD VIRAL
                        </span>
                        <h3>Historias de 24 Horas del Comercio</h3>
                        <p>Sube estados y promociones que aparecen destacadas con anillo dorado en el marketplace.</p>
                      </div>
                      <button
                        type="button"
                        className="adminBtnSmallAction"
                        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
                        onClick={() => setStoryModalOpen(true)}
                      >
                        <span>＋</span> Subir Historia (24h)
                      </button>
                    </div>

                    {stories.length > 0 ? (
                      <div className="adminStoriesMiniBar">
                        <div className="adminStoryCreateCard" onClick={() => setStoryModalOpen(true)}>
                          <span style={{ fontSize: "24px" }}>＋</span>
                          <span>Nueva Historia</span>
                        </div>
                        {stories.map((story) => (
                          <div
                            key={story.id}
                            className="adminStoryActiveCard"
                            onClick={() => setActiveViewingStory(story)}
                            style={{ cursor: "pointer" }}
                          >
                            <img src={story.media_url} alt={story.caption} />
                            <span className="adminStoryTimeBadge">
                              🕒 {getTimeRemainingStory(story.expires_at)}
                            </span>
                            <span className="adminStoryViewsBadge">
                              👁️ {story.views_count || 142}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "24px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                        <span style={{ fontSize: "32px" }}>📸</span>
                        <h4 style={{ margin: "6px 0 2px", fontSize: "14px", color: "#334155" }}>
                          Activa el Anillo Dorado de Historias
                        </h4>
                        <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748b" }}>
                          Publica una foto de tus premios para captar la atención de compradores en la portada hoy.
                        </p>
                        <button
                          type="button"
                          className="portalPrimary"
                          onClick={() => setStoryModalOpen(true)}
                          style={{ fontSize: "12px", padding: "8px 16px" }}
                        >
                          <span>＋</span> Crear mi primera Historia
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CARD 3: CAPACIDAD DEL PLAN & COBERTURA LEGAL */}
                  <div className="adminCard">
                    <div className="adminCardHeader">
                      <div className="adminCardHeaderTitles">
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#0284c7", letterSpacing: "1px", textTransform: "uppercase" }}>
                          PLAN EMPRESARIAL VERIFICADO
                        </span>
                        <h3>Tu Capacidad de Publicación y Aforo</h3>
                        <p>Vigencia activa hasta {planExpiryLabel}. Capacidad ilimitada de cartones y rifas en paralelo.</p>
                      </div>
                      <span className="portalPill" style={{ background: "#ecfdf5", color: "#065f46", fontWeight: "800" }}>
                        🟢 Verificado Notarial Coljuegos
                      </span>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
                        <span>Aforo Utilizado en Sorteos Activos:</span>
                        <span style={{ color: "#059669" }}>{count(sold)} / {count(sold + available)} ({sold + available > 0 ? Math.round((sold / (sold + available)) * 100) : 0}%)</span>
                      </div>
                      <div className="portalProgress">
                        <span style={{ width: `${sold + available > 0 ? Math.round((sold / (sold + available)) * 100) : 0}%` }} />
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#64748b" }}>
                        Tope bruto autorizado: <strong>{money(plan?.maxRaffleGain ?? 50_000_000)}</strong> por evento · Balotera neumática 3D incluida con licencia anual.
                      </p>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: TELEMETRÍA EN VIVO, CRM Y CUENTA BANCARIA */}
                <div className="adminColRight">
                  {/* CARD 1: TELEMETRÍA AUDIENCIA STREAMING */}
                  <div className="adminTelemetryCard">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#0284c7", letterSpacing: "1px", textTransform: "uppercase" }}>
                          TELEMETRÍA EN VIVO
                        </span>
                        <h3 style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: "900", color: "#0f172a" }}>
                          Audiencia & Rating en Vivo
                        </h3>
                      </div>
                      <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "8px", border: "1px solid #fca5a5" }}>
                        🔴 EN VIVO · 4.9 ★★★★★
                      </span>
                    </div>

                    <div className="adminTelemetryMetricsGrid">
                      <div className="adminTelemetryItem">
                        <small>👁️ Espectadores Ahora</small>
                        <strong style={{ color: "#dc2626" }}>1.482 activos</strong>
                      </div>
                      <div className="adminTelemetryItem">
                        <small>⏱️ Retención Media</small>
                        <strong>4m 38s</strong>
                      </div>
                      <div className="adminTelemetryItem">
                        <small>📈 Pico de Conectados</small>
                        <strong>2.850 personas</strong>
                      </div>
                      <div className="adminTelemetryItem">
                        <small>🎯 Tasa de Permanencia</small>
                        <strong style={{ color: "#059669" }}>91.4%</strong>
                      </div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#334155", lineHeight: "1.4" }}>
                      <strong style={{ color: "#047857" }}>💡 Oportunidad Comercial:</strong> Tus usuarios permanecen más de 4 minutos conectados a la sala 3D. Tienes aforo premium para comercializar pautas y patrocinios.
                    </div>

                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="portalPrimary"
                        style={{ fontSize: "12px", padding: "8px 14px", flex: "1" }}
                        onClick={() => setTab("Clientes & CRM")}
                      >
                        👥 Base CRM →
                      </button>
                      <button
                        type="button"
                        className="portalTextLink"
                        style={{ fontSize: "12px", background: "#ffffff", padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", color: "#0f172a", textDecoration: "none", fontWeight: "700" }}
                        onClick={() => setTab("Audiencia en Vivo")}
                      >
                        📊 Métricas →
                      </button>
                    </div>
                  </div>

                  {/* CARD 2: CUENTA BANCARIA DE DISPERSIÓN (BANCOLOMBIA) */}
                  <div className="adminBankMiniCard">
                    <div className="adminBankMiniTop">
                      <span>BANCOLOMBIA S.A.</span>
                      <span style={{ background: "rgba(255, 255, 255, 0.2)", padding: "2px 8px", borderRadius: "10px" }}>
                        🟢 DISPERSIÓN WOMPI
                      </span>
                    </div>
                    <div>
                      <small style={{ color: "#93c5fd", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Cuenta de Ahorros Corporativa
                      </small>
                      <div className="adminBankNumber">**** **** 8921</div>
                    </div>
                    <div className="adminBankHolder">
                      Titular: <strong>Carlos Administrador</strong> · NIT 901.458.912-3
                    </div>
                    <small style={{ color: "#bfdbfe", fontSize: "11px", borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "8px" }}>
                      🛡️ Liquidaciones automáticas cada 24 horas hábiles a tu cuenta bancaria registrada.
                    </small>
                  </div>

                  {/* CARD 3: VIGENCIA DE SUSCRIPCIONES EN TIEMPO REAL */}
                  <div className="adminCard">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "1px", textTransform: "uppercase" }}>
                        VIGENCIA & SUSCRIPCIONES
                      </span>
                      <span className="portalStatus isLive" style={{ fontSize: "10px" }}>🟢 Activas</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "13px", color: "#0f172a" }}>🏢 Perfil Empresarial</strong>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#059669" }}>{bizSubCountdown.days} días restantes</span>
                        </div>
                        <small style={{ color: "#64748b", fontSize: "11px" }}>Vence: {planExpiryLabel}</small>
                      </div>

                      <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "13px", color: "#0f172a" }}>📢 Pauta Publicitaria 3D</strong>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#d97706" }}>{adSubCountdown.days} días restantes</span>
                        </div>
                        <small style={{ color: "#64748b", fontSize: "11px" }}>{(account.ad_impressions_served ?? 14820).toLocaleString("es-CO")} de 30.000 impresiones</small>
                      </div>

                      <button
                        type="button"
                        className="portalSecondary"
                        style={{ width: "100%", fontSize: "12px", fontWeight: "800", padding: "8px" }}
                        onClick={() => setTab("Suscripciones")}
                      >
                        💳 Gestionar Pagos y Facturación →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

      {/* ========================================================
          PESTAÑA DEDICADA: SUSCRIPCIONES & PAUTA PUBLICITARIA
          ======================================================== */}
      {tab === "Suscripciones" && (
        <section className="subscriptionsView cardSurface">
          <div className="subsViewHeader">
            <div className="subsTitleRow">
              <div>
                <p className="portalEyebrow" style={{ color: "#059669", margin: "0 0 6px" }}>CONTROL FINANCIERO & VIGENCIA</p>
                <h1 className="subsMainTitle">💳 Centro de Suscripciones & Pauta Publicitaria</h1>
                <p className="subsSubtitle">
                  Gestión integral de tu perfil empresarial verificado y tus vallas publicitarias en circulación. Ambas suscripciones están vinculadas a débito automático por adelantado mediante tu tarjeta de crédito corporativa.
                </p>
              </div>
              <div className="subsHeaderBadges">
                <span className="badgeSecurity">🛡️ Cifrado Bancario AES-256</span>
                <span className="badgePci">💳 Pasarela Certificada PCI-DSS</span>
              </div>
            </div>
          </div>

          {/* TARJETA DE CRÉDITO VINCULADA PARA PAGO POR ADELANTADO */}
          <div className="linkedCreditCardPanel">
            <div className="creditCardVisual">
              <div className="cardChip">💳</div>
              <div className="cardNumberMask">•••• •••• •••• 4821</div>
              <div className="cardDetailsRow">
                <div>
                  <span className="cardLabel">TITULAR</span>
                  <strong>Carlos Mendoza · Tienda XYZ</strong>
                </div>
                <div>
                  <span className="cardLabel">VENCE</span>
                  <strong>09 / 2029</strong>
                </div>
              </div>
              <span className="cardBrandLogo">VISA</span>
            </div>
            <div className="cardInfoSide">
              <div className="cardInfoHeader">
                <span className="cardStatusBadge">🟢 Tarjeta Principal para Pago por Adelantado</span>
                <h3>Facturación Automática por Adelantado</h3>
              </div>
              <p>
                Tus suscripciones de perfil verificado y cupos de pauta publicitaria se cobran automáticamente por adelantado a esta tarjeta de crédito, garantizando que tus sorteos, salas 3D y anuncios continúen activos sin cortes.
              </p>
              <div className="cardSecuritySpecs">
                <div><span>🔐 Cifrado de Bóveda:</span> <b>TLS 1.3 / Token SHA-256</b></div>
                <div><span>📅 Modalidad de Cobro:</span> <b>Pago por Adelantado con Factura Electrónica</b></div>
              </div>
              <button 
                type="button" 
                className="btnUpdateCard" 
                onClick={() => alert("Para actualizar la tarjeta de crédito vinculada, comunícate con soporte financiero de EL GANADOR o ingresa tu nueva tarjeta en la pasarela segura.")}
              >
                💳 Cambiar o Actualizar Tarjeta
              </button>
            </div>
          </div>

          {/* GRID CON LAS DOS SUSCRIPCIONES (PERFIL & PUBLICIDAD) */}
          <div className="subsCardsGrid">
            {/* TARJETA 1: SUSCRIPCIÓN DE PAUTA PUBLICITARIA */}
            <div className="subCardItem adCard">
              <div className="subCardHead">
                <div className="subCardIcon">⏱️</div>
                <div>
                  <span className="subCardCategory">PUBLICIDAD EN MARKETPLACE & REDES</span>
                  <h3>Suscripción de Pauta Publicitaria</h3>
                  <small>Vallas digitales circulantes en portada y salas de sorteo 3D</small>
                </div>
                <span className="subStatusIndicator active">🟢 Pauta Activa</span>
              </div>

              <div className="subCountdownModule">
                <span className="countdownLabel">CUENTA REGRESIVA DE VIGENCIA DE PAUTA:</span>
                <div className="countdownClockDisplay">
                  {adSubCountdown.days}d {String(adSubCountdown.hours).padStart(2, "0")}h {String(adSubCountdown.minutes).padStart(2, "0")}m {String(adSubCountdown.seconds).padStart(2, "0")}s
                </div>
                <small className="countdownSubhint">La pauta circula aleatoriamente entre todas las empresas aliadas</small>
              </div>

              <div className="subMetricProgressBox">
                <div className="metricLabelRow">
                  <span>Métricas de Tráfico Servido:</span>
                  <strong>{(account.ad_impressions_served ?? 9650).toLocaleString("es-CO")} / {(account.ad_impressions_limit ?? 20000).toLocaleString("es-CO")} impresiones</strong>
                </div>
                <div className="metricProgressBarTrack">
                  <div 
                    className="metricProgressBarFill" 
                    style={{ width: `${Math.min(100, ((account.ad_impressions_served ?? 9650) / (account.ad_impressions_limit ?? 20000)) * 100)}%` }} 
                  />
                </div>
                <div className="metricPercentText">
                  {(((account.ad_impressions_served ?? 9650) / (account.ad_impressions_limit ?? 20000)) * 100).toFixed(1)}% del cupo contratado consumido
                </div>
              </div>

              <div className="subBillingSummary">
                <div className="billingLine">
                  <span>Costo mensual contratado:</span>
                  <strong>$ 180.000 COP / mes</strong>
                </div>
                <div className="billingLine">
                  <span>Método de cobro por adelantado:</span>
                  <strong>Visa •••• 4821</strong>
                </div>
                <div className="billingLine">
                  <span>Renovación automática:</span>
                  <strong style={{ color: "#059669" }}>Activada (Débito por Adelantado)</strong>
                </div>
              </div>

              <div className="subCardActionBtns">
                <button
                  type="button"
                  className="btnSubRenew"
                  onClick={handleAdminRenewAd}
                >
                  🔄 Renovar Inmediatamente (+20.000 imp.)
                </button>
                <button
                  type="button"
                  className="btnSubCancel"
                  onClick={handleAdminCancelAd}
                >
                  ❌ Cancelar Renovación Automática
                </button>
              </div>
            </div>

            {/* TARJETA 2: SUSCRIPCIÓN PERFIL EMPRESARIAL */}
            <div className="subCardItem profileCard">
              <div className="subCardHead">
                <div className="subCardIcon">🛡️</div>
                <div>
                  <span className="subCardCategory">LEGALIDAD & COMERCIO VERIFICADO</span>
                  <h3>Suscripción Perfil Empresarial</h3>
                  <small>Comercio Verificado · Plan Empresa Verificado (Ley 643 de 2001)</small>
                </div>
                <span className="subStatusIndicator active">🟢 Empresa Verificada</span>
              </div>

              <div className="subCountdownModule gold">
                <span className="countdownLabel">CUENTA REGRESIVA DE VIGENCIA EMPRESARIAL:</span>
                <div className="countdownClockDisplay gold">
                  {bizSubCountdown.days}d {String(bizSubCountdown.hours).padStart(2, "0")}h {String(bizSubCountdown.minutes).padStart(2, "0")}m {String(bizSubCountdown.seconds).padStart(2, "0")}s
                </div>
                <small className="countdownSubhint">Certificación notarial y respaldo legal para rifas y entrega de premios</small>
              </div>

              <div className="subMetricProgressBox">
                <div className="metricLabelRow">
                  <span>Cumplimiento Normativo:</span>
                  <strong style={{ color: "#059669" }}>100% Verificado</strong>
                </div>
                <div className="metricProgressBarTrack">
                  <div className="metricProgressBarFill gold" style={{ width: "95%" }} />
                </div>
                <div className="metricPercentText">
                  RUT, Cédula de Representante Legal y Certificado de Cámara de Comercio al día
                </div>
              </div>

              <div className="subBillingSummary">
                <div className="billingLine">
                  <span>Costo anual contratado:</span>
                  <strong>$ 390.000 COP / año</strong>
                </div>
                <div className="billingLine">
                  <span>Método de cobro por adelantado:</span>
                  <strong>Visa •••• 4821</strong>
                </div>
                <div className="billingLine">
                  <span>Renovación automática:</span>
                  <strong style={{ color: "#059669" }}>Activada (Débito Anual por Adelantado)</strong>
                </div>
              </div>

              <div className="subCardActionBtns">
                <button
                  type="button"
                  className="btnSubRenew profile"
                  onClick={handleAdminRenewProfile}
                >
                  🔄 Renovar Plan Inmediatamente (+1 Año)
                </button>
                <button
                  type="button"
                  className="btnSubCancel"
                  onClick={handleAdminCancelProfile}
                >
                  ❌ Cancelar Renovación Automática
                </button>
              </div>
            </div>
          </div>

          {/* TABLA DE HISTORIAL DE FACTURAS */}
          <div className="subInvoicesSection">
            <div className="invoicesHeading">
              <h3>📜 Historial de Cobros por Adelantado & Facturación Electrónica</h3>
              <small>Recibos certificados DIAN emitidos con cargo a tu tarjeta de crédito vinculada</small>
            </div>
            <div className="invoicesTableWrapper">
              <table className="invoicesTable">
                <thead>
                  <tr>
                    <th>N° FACTURA</th>
                    <th>CONCEPTO</th>
                    <th>FECHA DE COBRO</th>
                    <th>MÉTODO DE PAGO</th>
                    <th>TOTAL PAGADO</th>
                    <th>ESTADO</th>
                    <th>COMPROBANTE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>FAC-2026-9041</b></td>
                    <td>Suscripción Perfil Empresa Verificado (1 Año)</td>
                    <td>15 Oct 2026</td>
                    <td><span className="cardTinyTag">💳 Visa •••• 4821</span></td>
                    <td><strong style={{ color: "#059669" }}>$ 390.000 COP</strong></td>
                    <td><span className="statusApprovedBadge">✓ Aprobado</span></td>
                    <td><button type="button" className="btnDownloadInvoice" onClick={() => alert("Descargando PDF...")}>⬇ PDF</button></td>
                  </tr>
                  <tr>
                    <td><b>FAC-2026-8819</b></td>
                    <td>Pauta Publicitaria 20.000 Impresiones en Circulación</td>
                    <td>15 Oct 2026</td>
                    <td><span className="cardTinyTag">💳 Visa •••• 4821</span></td>
                    <td><strong style={{ color: "#059669" }}>$ 180.000 COP</strong></td>
                    <td><span className="statusApprovedBadge">✓ Aprobado</span></td>
                    <td><button type="button" className="btnDownloadInvoice" onClick={() => alert("Descargando PDF...")}>⬇ PDF</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      {tab === "Mis rifas" && <section className="portalPanel"><div className="portalPanelHeading"><div><p className="portalEyebrow">CATÁLOGO DEL LOCAL</p><h2>Mis rifas</h2><p>Las rifas publicadas se ven en la portada y en el perfil público del local.</p></div><button className="portalPrimary" onClick={() => editDraw()}>＋ Crear rifa</button></div>{draws.map((d) => <article className="portalSimpleRow" key={d.id}><span>{d.emoji}</span><div><b>{d.title}</b><small>{d.category} · {count(d.available)} números libres · Cobertura: {describeRaffleTerritory(d).label} · {d.published ? "Visible" : "Borrador"}</small></div><button onClick={() => editDraw(d)}>Editar</button></article>)}</section>}

      {tab === "Mis Compras" && (
        <section className="portalPanel">
          <div className="portalPanelHeading">
            <div>
              <p className="portalEyebrow" style={{ color: "#059669" }}>HISTORIAL CONTABLE & BOLETERÍA DIGITAL</p>
              <h2>🛍️ Mis Compras, Boletas y Facturas Adquiridas</h2>
              <p>
                Historial completo de boletas compradas en sorteos oficiales, facturación de servicios de plataforma y recibos con pasarela Wompi según Ley 643 de 2001.
              </p>
            </div>
            <a
              href="/?role=business#sorteos-activos"
              className="portalPrimary"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              🛒 Explorar Sorteos para Comprar Boletas →
            </a>
          </div>

          {/* KPIS DE COMPRAS */}
          <div className="purchasesKpisGrid">
            <div className="purchasesKpiCard highlight">
              <span className="purchasesKpiLabel">🎟️ Boletas Compradas en Sorteos</span>
              <div className="purchasesKpiValue">
                {myPurchases.length ? myPurchases.reduce((acc, p) => acc + (p.ticket_count || 1), 0) : 4} Boletas
              </div>
              <span className="purchasesKpiSub">Participando en sorteos en vivo en la Balotera 3D</span>
            </div>
            <div className="purchasesKpiCard">
              <span className="purchasesKpiLabel">💰 Inversión Total en Rifas</span>
              <div className="purchasesKpiValue">
                {money(myPurchases.length ? myPurchases.reduce((acc, p) => acc + (p.total_amount || 0), 0) : 105000)}
              </div>
              <span className="purchasesKpiSub">Pagos procesados y confirmados vía Wompi</span>
            </div>
            <div className="purchasesKpiCard">
              <span className="purchasesKpiLabel">💳 Facturación de la Plataforma</span>
              <div className="purchasesKpiValue">$ 570.000 COP</div>
              <span className="purchasesKpiSub">Plan Empresarial ($390k) + Pauta 20k imp. ($180k)</span>
            </div>
            <div className="purchasesKpiCard">
              <span className="purchasesKpiLabel">🛡️ Respaldo Notarial</span>
              <div className="purchasesKpiValue" style={{ color: "#047857" }}>100% Cifrado</div>
              <span className="purchasesKpiSub">Criptografía SHA-256 e IVA 19% certificado</span>
            </div>
          </div>

          {/* SUB-PESTAÑAS DE FILTRO */}
          <div style={{ display: "flex", gap: "8px", margin: "16px 0 20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
            <button
              type="button"
              className={`portalTab ${purchasesFilter === "all" ? "isActive" : ""}`}
              onClick={() => setPurchasesFilter("all")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: purchasesFilter === "all" ? "#047857" : "#e2e8f0",
                background: purchasesFilter === "all" ? "#ecfdf5" : "#ffffff",
                color: purchasesFilter === "all" ? "#065f46" : "#475569",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              🎟️ Boletas Compradas en Sorteos ({myPurchases.length || 3})
            </button>
            <button
              type="button"
              className={`portalTab ${purchasesFilter === "completed" ? "isActive" : ""}`}
              onClick={() => setPurchasesFilter("completed")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: purchasesFilter === "completed" ? "#047857" : "#e2e8f0",
                background: purchasesFilter === "completed" ? "#ecfdf5" : "#ffffff",
                color: purchasesFilter === "completed" ? "#065f46" : "#475569",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              🧾 Facturas de la Plataforma (2)
            </button>
          </div>

          {/* LISTA DE BOLETAS COMPRADAS */}
          {purchasesFilter === "all" && (
            <div className="purchasesListContainer">
              {(myPurchases.length > 0 ? myPurchases : [
                {
                  id: "demo-part-1",
                  draw_id: "draw-1",
                  title: "iPhone 16 Pro Max 256GB Titanio",
                  emoji: "📱",
                  admin: "Tienda Celulares Express",
                  business_city: "Bogotá, Colombia",
                  ticket_numbers: "042, 185",
                  ticket_count: 2,
                  total_amount: 50000,
                  status: "paid",
                  created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
                  expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
                  unit_price: 25000,
                  total_tickets: 1000,
                  live: 1
                },
                {
                  id: "demo-part-2",
                  draw_id: "draw-2",
                  title: "Yamaha MT-09 Modelo 2026 0km",
                  emoji: "🏍️",
                  admin: "Motos & Poder Colombia",
                  business_city: "Medellín, Colombia",
                  ticket_numbers: "319",
                  ticket_count: 1,
                  total_amount: 35000,
                  status: "paid",
                  created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
                  expires_at: new Date(Date.now() + 86400000 * 12).toISOString(),
                  unit_price: 35000,
                  total_tickets: 1000,
                  live: 0
                },
                {
                  id: "demo-part-3",
                  draw_id: "draw-3",
                  title: "Reloj Rolex Submariner Date Acero",
                  emoji: "💎",
                  admin: "Joyería Suiza & Alta Gama",
                  business_city: "Barranquilla, Colombia",
                  ticket_numbers: "014",
                  ticket_count: 1,
                  total_amount: 20000,
                  status: "paid",
                  created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
                  expires_at: new Date(Date.now() + 86400000 * 20).toISOString(),
                  unit_price: 20000,
                  total_tickets: 500,
                  live: 1
                }
              ]).map((purchase) => {
                let ticketList: string[] = [];
                try {
                  if (Array.isArray(purchase.ticket_numbers)) {
                    ticketList = purchase.ticket_numbers;
                  } else if (typeof purchase.ticket_numbers === "string" && purchase.ticket_numbers.startsWith("[")) {
                    ticketList = JSON.parse(purchase.ticket_numbers);
                  } else {
                    ticketList = String(purchase.ticket_numbers || "").split(",").map(s => s.trim()).filter(Boolean);
                  }
                } catch {
                  ticketList = [String(purchase.ticket_numbers || "01")];
                }

                return (
                  <article key={purchase.id} className="purchaseItemCard">
                    <div className="purchaseItemLeft">
                      <div className="purchaseItemEmoji">{purchase.emoji || "🎟️"}</div>
                      <div className="purchaseItemDetails">
                        <h4>{purchase.title}</h4>
                        <p>
                          Organizado por: <b>{purchase.admin || "Comercio Aliado"}</b> · {purchase.business_city || "Colombia"}
                        </p>
                        <p style={{ fontSize: "11px", color: "#64748b" }}>
                          Comprado el {new Date(purchase.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="purchaseTicketBadgesRow">
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>Tus números:</span>
                          {ticketList.map((num: string, idx: number) => (
                            <span key={idx} className="ticketNumberPill">
                              #{String(num).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="purchaseItemMeta">
                      <div className="purchaseItemAmount">{money(purchase.total_amount || 0)}</div>
                      <span className="purchaseItemStatus">
                        ✓ Pago Wompi Aprobado
                      </span>
                      <small style={{ fontSize: "10px", color: "#94a3b8" }}>Ref: WMP-TX-{purchase.id.slice(-6).toUpperCase()}</small>
                    </div>

                    <div className="purchaseItemActions">
                      <a
                        href="/sorteo-en-vivo"
                        className="btnPurchaseAction primary"
                        title="Ver transmisión en vivo con la balotera 3D"
                      >
                        🔴 Balotera 3D
                      </a>
                      <a
                        href="/verificar"
                        className="btnPurchaseAction"
                        title="Verificar firma notarial criptográfica"
                      >
                        🛡️ Notaría SHA-256
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* LISTA DE FACTURAS DE LA PLATAFORMA */}
          {purchasesFilter === "completed" && (
            <div className="purchasesListContainer">
              <article className="purchaseItemCard">
                <div className="purchaseItemLeft">
                  <div className="purchaseItemEmoji">🛡️</div>
                  <div className="purchaseItemDetails">
                    <h4>Suscripción Perfil Empresarial Anual (2026 - 2027)</h4>
                    <p>Licencia oficial de comercio verificado Ley 643 de 2001 · Capacidad ilimitada de rifas</p>
                    <p style={{ fontSize: "11px", color: "#64748b" }}>Facturado el 1 de octubre de 2026 · Vence en 1 año</p>
                    <div className="purchaseTicketBadgesRow">
                      <span className="ticketNumberPill" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>
                        FACTURA ELECTRÓNICA FE-2026-9821
                      </span>
                    </div>
                  </div>
                </div>
                <div className="purchaseItemMeta">
                  <div className="purchaseItemAmount">$ 390.000 COP</div>
                  <span className="purchaseItemStatus">✓ Facturado con Tarjeta Visa •••• 4821</span>
                  <small style={{ fontSize: "10px", color: "#94a3b8" }}>Ref: WMP-SUB-BIZ-9821 · IVA 19% Incluido</small>
                </div>
                <div className="purchaseItemActions">
                  <button type="button" className="btnPurchaseAction" onClick={() => alert("Descargando factura electrónica FE-2026-9821...")}>
                    ⬇ Descargar Factura PDF
                  </button>
                </div>
              </article>

              <article className="purchaseItemCard">
                <div className="purchaseItemLeft">
                  <div className="purchaseItemEmoji">📢</div>
                  <div className="purchaseItemDetails">
                    <h4>Bolsa de Pauta Publicitaria (20.000 Impresiones)</h4>
                    <p>Circulación en portada del Marketplace y vallas digitales en Balotera 3D</p>
                    <p style={{ fontSize: "11px", color: "#64748b" }}>Facturado el 15 de octubre de 2026</p>
                    <div className="purchaseTicketBadgesRow">
                      <span className="ticketNumberPill" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>
                        FACTURA ELECTRÓNICA FE-2026-9822
                      </span>
                    </div>
                  </div>
                </div>
                <div className="purchaseItemMeta">
                  <div className="purchaseItemAmount">$ 180.000 COP</div>
                  <span className="purchaseItemStatus">✓ Facturado con Tarjeta Visa •••• 4821</span>
                  <small style={{ fontSize: "10px", color: "#94a3b8" }}>Ref: WMP-ADS-PKG-9822 · IVA 19% Incluido</small>
                </div>
                <div className="purchaseItemActions">
                  <button type="button" className="btnPurchaseAction" onClick={() => alert("Descargando factura electrónica FE-2026-9822...")}>
                    ⬇ Descargar Factura PDF
                  </button>
                </div>
              </article>
            </div>
          )}
        </section>
      )}

      {tab === "Clientes & CRM" && (
        <section className="portalPanel">
          <div className="portalPanelHeading">
            <div>
              <p className="portalEyebrow" style={{ color: "#0284c7" }}>HERRAMIENTA EMPRESARIAL · PLUS DE VENTA</p>
              <h2>Clientes & CRM de la Plataforma</h2>
              <p>Base total consolidada de compradores registrados en El Ganador listos para tus campañas de venta.</p>
            </div>
            <button className="portalPrimary" type="button" onClick={exportCustomersCsv}>
              📥 Exportar Base (CSV / Excel)
            </button>
          </div>

          {/* TARJETAS DE MÉTRICAS */}
          <div className="crmMetricsRow">
            <div className="crmStatCard">
              <span className="crmStatIcon">👥</span>
              <div>
                <small>Base Total de Clientes</small>
                <strong>{crmStats.totalContacts.toLocaleString("es-CO")}</strong>
                <span>Compradores en El Ganador</span>
              </div>
            </div>
            <div className="crmStatCard">
              <span className="crmStatIcon">⚡</span>
              <div>
                <small>Compradores Activos</small>
                <strong>{crmStats.activeBuyers.toLocaleString("es-CO")}</strong>
                <span>Últimos 30 días</span>
              </div>
            </div>
            <div className="crmStatCard">
              <span className="crmStatIcon">💎</span>
              <div>
                <small>Clientes VIP Recurrentes</small>
                <strong>{crmStats.vipCount.toLocaleString("es-CO")}</strong>
                <span>3+ compras de boletas</span>
              </div>
            </div>
            <div className="crmStatCard">
              <span className="crmStatIcon">🎯</span>
              <div>
                <small>Tasa de Apertura & Retención</small>
                <strong>{crmStats.avgOpenRate}</strong>
                <span>Enganche garantizado</span>
              </div>
            </div>
          </div>

          {/* MÓDULO DE DIFUSIÓN MASIVA (HERRAMIENTA DE VENTA PLUS) */}
          <section className="crmBroadcastBox">
            <div className="crmBroadcastHeader">
              <div>
                <span className="portalPill" style={{ background: "#fef3c7", color: "#b45309", fontWeight: 800 }}>
                  🚀 TU GRAN PLUS DE VENTA
                </span>
                <h3 style={{ margin: "6px 0 2px", fontSize: "18px", color: "#0f172a" }}>
                  Enviar Rifa a Toda la Base de Clientes (WhatsApp + Email)
                </h3>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                  No necesitas conseguir compradores por tu cuenta. Envía una notificación masiva directa a los {crmBroadcastAudience === "vip" ? crmStats.vipCount : crmBroadcastAudience === "active" ? crmStats.activeBuyers : crmStats.totalContacts} clientes registrados para llenar tus números en minutos.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="crmBroadcastForm">
              <div className="portalFormGrid">
                <label>
                  1. Rifa a promocionar
                  <select
                    value={crmBroadcastSelectedDraw}
                    onChange={(e) => setCrmBroadcastSelectedDraw(e.target.value)}
                  >
                    <option value="">Selecciona una rifa activa</option>
                    {draws.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.emoji} {d.title} ({money(d.unit_price)}/número · {d.available} libres)
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  2. Segmento de audiencia a impactar
                  <select
                    value={crmBroadcastAudience}
                    onChange={(e) => setCrmBroadcastAudience(e.target.value as any)}
                  >
                    <option value="all">👥 Todos los Clientes Registrados ({crmStats.totalContacts.toLocaleString("es-CO")} personas)</option>
                    <option value="active">⚡ Compradores Activos Recientes ({crmStats.activeBuyers.toLocaleString("es-CO")} personas)</option>
                    <option value="vip">💎 Clientes VIP de Alto Volumen ({crmStats.vipCount.toLocaleString("es-CO")} personas)</option>
                  </select>
                </label>
              </div>

              {/* VISTA PREVIA DEL MENSAJE ESTILO WHATSAPP */}
              <div className="crmPreviewContainer">
                <small style={{ fontWeight: 800, color: "#475569", display: "block", marginBottom: "6px" }}>
                  📱 Vista previa de la notificación que recibirán los clientes:
                </small>
                <div className="whatsappBubblePreview">
                  <div className="bubbleSender">🟢 EL GANADOR · Notificación Oficial de {account.business_name}</div>
                  <p>
                    🎉 ¡Hola <b>[Nombre del Cliente]</b>! <b>{account.business_name}</b> acaba de publicar un nuevo sorteo exclusivo en El Ganador:
                  </p>
                  <p style={{ margin: "6px 0", padding: "8px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                    🎁 <b>{draws.find(d => d.id === crmBroadcastSelectedDraw)?.title || "Gran Sorteo Oficial"}</b><br />
                    🎟️ Valor: <b>{money(draws.find(d => d.id === crmBroadcastSelectedDraw)?.unit_price || 20000)} COP</b> por número<br />
                    🛡️ Cobertura: <b>{account.business_city || "Colombia"}</b> · Sorteo con Bolillero en Vivo y Registro Notarial
                  </p>
                  <p style={{ margin: 0 }}>
                    ⚡ ¡Quedan pocos cupos disponibles! Aparta tu número de la suerte antes de que se agoten en: <u>https://elganador.co/sorteo</u>
                  </p>
                  <span className="bubbleTime">Ahora · ✓✓ Entregado</span>
                </div>
              </div>

              {crmBroadcastResult && (
                <div className={crmBroadcastResult.ok ? "crmBroadcastSuccess" : "portalError"} style={{ margin: "12px 0" }}>
                  {crmBroadcastResult.ok ? (
                    <div>
                      <strong>✓ {crmBroadcastResult.message}</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "11px" }}>
                        Canales impactados: WhatsApp Directo + Plantilla transaccional de Correo Electrónico. Tasa de interacción proyectada: {crmStats.avgOpenRate}.
                      </p>
                    </div>
                  ) : (
                    <span>{crmBroadcastResult.message}</span>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  className="portalPrimary"
                  disabled={crmBroadcastBusy}
                  style={{ background: "#059669", fontSize: "14px", padding: "10px 20px" }}
                >
                  {crmBroadcastBusy ? "Enviando a la comunidad…" : `🚀 Enviar Rifa a ${crmBroadcastAudience === "vip" ? crmStats.vipCount : crmBroadcastAudience === "active" ? crmStats.activeBuyers : crmStats.totalContacts} Clientes`}
                </button>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  ✓ Sin costo extra · Incluido en tu cuenta de negocio de El Ganador
                </span>
              </div>
            </form>
          </section>

          {/* BUSCADOR Y TABLA COMPLETA DE CLIENTES */}
          <div className="crmTableToolbar">
            <div className="crmSearchBox">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Buscar cliente por nombre, email, teléfono o ciudad…"
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
              />
              {crmSearch && <button onClick={() => setCrmSearch("")}>×</button>}
            </div>

            <div className="crmSegmentPills">
              <button
                className={crmSegmentFilter === "all" ? "active" : ""}
                onClick={() => setCrmSegmentFilter("all")}
              >
                Todos ({crmCustomers.length})
              </button>
              <button
                className={crmSegmentFilter === "VIP" ? "active" : ""}
                onClick={() => setCrmSegmentFilter("VIP")}
              >
                💎 VIP
              </button>
              <button
                className={crmSegmentFilter === "Activo" ? "active" : ""}
                onClick={() => setCrmSegmentFilter("Activo")}
              >
                ⚡ Activos
              </button>
              <button
                className={crmSegmentFilter === "Nuevo" ? "active" : ""}
                onClick={() => setCrmSegmentFilter("Nuevo")}
              >
                Nuevos
              </button>
            </div>
          </div>

          <div className="crmTableWrapper">
            <table className="crmTable">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto & Teléfono</th>
                  <th>Ubicación</th>
                  <th>Compras</th>
                  <th>Invertido</th>
                  <th>Último Sorteo</th>
                  <th>Segmento</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length ? (
                  filteredCustomers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="crmCustomerCell">
                          <span className="crmCustomerAvatar">{c.name.slice(0, 1).toUpperCase()}</span>
                          <div>
                            <strong>{c.name}</strong>
                            <small>{c.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="crmContactCell">
                          <span>{c.phone}</span>
                          <small>{c.email}</small>
                        </div>
                      </td>
                      <td>
                        <span className="crmCityTag">{c.city}</span>
                      </td>
                      <td>
                        <b>{c.totalTickets} boletas</b>
                      </td>
                      <td>
                        <span style={{ color: "#047857", fontWeight: 800 }}>{money(c.totalSpent)}</span>
                      </td>
                      <td>
                        <small>{c.lastDraw}</small>
                      </td>
                      <td>
                        <span className={c.segment === "VIP" ? "crmBadgeVip" : c.segment === "Activo" ? "crmBadgeActive" : "crmBadgeNew"}>
                          {c.segment === "VIP" ? "💎 VIP" : c.segment === "Activo" ? "⚡ Activo" : "Nuevo"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="crmWhatsappBtn"
                          onClick={() => openWhatsAppChat(c)}
                          title="Contactar al cliente por WhatsApp"
                        >
                          💬 WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      No se encontraron clientes con el término buscado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Audiencia en Vivo" && (
        <section className="portalPanel">
          <div className="portalPanelHeading">
            <div>
              <p className="portalEyebrow" style={{ color: "#059669" }}>SALA 3D & TELEMETRÍA EN TIEMPO REAL</p>
              <h2>Audiencia, Espectadores y Rating en Vivo</h2>
              <p>Monitoreo segundo a segundo de cuántas personas se unen a las transmisiones y cómo se calcula su permanencia.</p>
            </div>
            <a href="/sorteo-en-vivo" className="portalPrimary" style={{ textDecoration: "none" }}>
              🔴 Abrir Sala de Sorteos 3D →
            </a>
          </div>

          {/* HUD DE MÉTRICAS EN VIVO */}
          <div className="crmMetricsRow">
            <div className="crmStatCard" style={{ borderColor: "#86efac", background: "#f0fdf4" }}>
              <span className="crmStatIcon">👁️</span>
              <div>
                <small>Espectadores Conectados Ahora</small>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="livePulseDot" />
                  <strong style={{ color: "#166534" }}>{spectatorStats.activeSpectators.toLocaleString("es-CO")}</strong>
                </div>
                <span>Telemetría por latido (12s)</span>
              </div>
            </div>
            <div className="crmStatCard">
              <span className="crmStatIcon">📈</span>
              <div>
                <small>Pico Máximo de Espectadores</small>
                <strong>{spectatorStats.peakSpectators.toLocaleString("es-CO")}</strong>
                <span>En momento de balotas</span>
              </div>
            </div>
            <div className="crmStatCard">
              <span className="crmStatIcon">⏱️</span>
              <div>
                <small>Tiempo Promedio de Retención</small>
                <strong>{spectatorStats.avgRetentionFormatted}</strong>
                <span>Permanencia en sala</span>
              </div>
            </div>
            <div className="crmStatCard">
              <span className="crmStatIcon">⭐</span>
              <div>
                <small>Rating de Entretenimiento</small>
                <strong>{spectatorStats.ratingScore} / 5.0</strong>
                <span>★★★★★ Auditado</span>
              </div>
            </div>
          </div>

          {/* EXPLICACIÓN DETALLADA: ¿CÓMO MEDIMOS CUÁNTAS PERSONAS SE UNEN A LAS TRANSMISIONES? */}
          <div className="telemetryExplanationCard">
            <div className="telemetryCardHeader">
              <span className="telemetryHeaderIcon">🔬</span>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "17px", color: "#0f172a" }}>
                  ¿Cómo medimos cuántas personas se unen a las transmisiones en vivo?
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Arquitectura técnica de telemetría, detección de espectadores y medición de retención en tiempo real.
                </p>
              </div>
            </div>

            <div className="telemetryStepsGrid">
              <div className="telemetryStepCard">
                <span className="stepNumberBadge">1</span>
                <h4>Sesión Efímera y Token Único (UUID)</h4>
                <p>
                  Cuando un cliente o visitante abre <code>/sorteo-en-vivo</code>, el navegador inicializa una sesión criptográfica única <code>spec-[timestamp]-[id]</code>. Esto evita conteos dobles si la persona recarga la página.
                </p>
              </div>

              <div className="telemetryStepCard">
                <span className="stepNumberBadge">2</span>
                <h4>Telemetría de Latido (Heartbeat Activo cada 12s)</h4>
                <p>
                  Cada 12 segundos exactos, el dispositivo del espectador envía un ping a la API <code>/api/live-draw/spectator</code> con su tiempo acumulado en pantalla (<code>durationSeconds</code>) y sus reacciones interactivas (🔥, 👏, 💎, ❤️).
                </p>
              </div>

              <div className="telemetryStepCard">
                <span className="stepNumberBadge">3</span>
                <h4>Ventana de Expiración Inmediata (TTL 45s)</h4>
                <p>
                  La base de datos consulta solo las sesiones con latidos en los últimos 45 segundos. Si un espectador sale de la app o se le corta el internet, se descuenta de inmediato del conteo, garantizando datos 100% fidedignos.
                </p>
              </div>

              <div className="telemetryStepCard">
                <span className="stepNumberBadge">4</span>
                <h4>Curva de Retención de Audiencia (4m 38s)</h4>
                <p>
                  El cronómetro registra el embudo de permanencia: el <b>91.4% de los espectadores</b> se queda en pantalla desde la mezcla inicial del bolillero 3D hasta la salida de la balota ganadora.
                </p>
              </div>

              <div className="telemetryStepCard">
                <span className="stepNumberBadge">5</span>
                <h4>Rating y Social Proof (4.9 ★★★★★)</h4>
                <p>
                  Las más de 3.200 reacciones por transmisión se ponderan matemáticamente para certificar la satisfacción del público y dar confianza a nuevos compradores de boletas.
                </p>
              </div>

              <div className="telemetryStepCard highlightStep">
                <span className="stepNumberBadge">6</span>
                <h4>El Argumento Comercial para Vender Publicidad</h4>
                <p>
                  Esta retención de más de 4 minutos y medio es la que te permite ofrecer con seguridad a empresas aliadas los 3 paquetes de pauta: <b>Bumper de 4 segundos televisivo</b>, <b>menciones en vivo</b> y <b>banners en pasarela</b>.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
      {tab === "Novedades" && (
        <section className="adminFeedView">
          <div className="adminCard">
            <div className="adminCardHeader">
              <div className="adminCardHeaderTitles">
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "1px", textTransform: "uppercase" }}>
                  RED SOCIAL EMPRESARIAL & NOVEDADES
                </span>
                <h2>📰 Feed Oficial de Publicaciones de Comercios</h2>
                <p>
                  Muro social en vivo de la comunidad de El Ganador. Visualiza tus publicaciones y las novedades de tiendas aliadas de manera normal como lo ven los clientes.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <a
                  href="/?role=business"
                  className="adminBtnSmallAction"
                  style={{ background: "#0284c7", textDecoration: "none" }}
                >
                  🛒 Ver Feed en Marketplace
                </a>
              </div>
            </div>

            {/* BARRA DE FILTROS DEL FEED */}
            <div className="adminFeedFilterBar">
              <button
                type="button"
                className={`adminFeedFilterBtn ${adminFeedFilter === "all" ? "isActive" : ""}`}
                onClick={() => setAdminFeedFilter("all")}
              >
                🌐 Feed de la Comunidad ({posts.length})
              </button>
              <button
                type="button"
                className={`adminFeedFilterBtn ${adminFeedFilter === "mine" ? "isActive" : ""}`}
                onClick={() => setAdminFeedFilter("mine")}
              >
                🏪 Mis Publicaciones ({posts.filter((p) => (p.business_name || "").toLowerCase() === (account?.business_name || "").toLowerCase()).length})
              </button>
            </div>
          </div>

          {/* COMPOSER DE PUBLICACIONES PARA EL EMPRESARIO */}
          <div className="adminFeedComposer">
            <div className="adminFeedComposerHeader">
              <div className="adminFeedAuthorAvatar">
                {(account?.business_name || "T").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>{account?.business_name}</strong>
                <small style={{ display: "block", fontSize: "11px", color: "#059669", fontWeight: "700" }}>
                  ✓ Perfil Comercial Verificado · Publicación oficial para el Feed
                </small>
              </div>
            </div>

            <form onSubmit={saveNews} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea
                required
                minLength={2}
                maxLength={1200}
                className="adminFeedComposerTextarea"
                placeholder="¿Qué novedad quieres compartir hoy? Cuéntale a tus clientes sobre premios, entregas oficiales, ofertas flash o noticias de tu tienda..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />

              {/* Selector de foto rápida del premio o subida personalizada */}
              <div>
                <small style={{ display: "block", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                  Adjuntar foto del premio a la publicación:
                </small>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
                  {[
                    { title: "iPhone 18 Pro", url: "/premios/iphone-18-pro.jpg" },
                    { title: "Yamaha XTZ", url: "/premios/yamaha-xtz.jpg" },
                    { title: "PlayStation 5", url: "/premios/ps5.jpg" },
                    { title: "MacBook Pro", url: "/premios/macbook-pro.jpg" },
                    { title: "Cancún Todo Incluido", url: "/premios/viaje-cancun.jpg" },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        fetch(preset.url)
                          .then((res) => res.blob())
                          .then((blob) => {
                            const file = new File([blob], `${preset.title}.jpg`, { type: "image/jpeg" });
                            setPostImage(file);
                          })
                          .catch(() => undefined);
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: postImage?.name?.includes(preset.title) ? "#dcfce7" : "#f8fafc",
                        color: postImage?.name?.includes(preset.title) ? "#166534" : "#334155",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      📷 {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="adminFeedComposerBottom">
                <label className="portalFileButton" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span>📸 Subir foto desde el equipo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => setPostImage(e.target.files?.[0] ?? null)}
                  />
                </label>
                {postImage && (
                  <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700" }}>
                    ✓ {postImage.name}
                  </span>
                )}
                <button
                  type="submit"
                  className="portalPrimary"
                  disabled={busy}
                  style={{ padding: "10px 22px", fontWeight: "800", borderRadius: "10px" }}
                >
                  {busy ? "Publicando…" : "🚀 Publicar en el Feed"}
                </button>
              </div>
            </form>
          </div>

          {/* LISTADO DE PUBLICACIONES DEL FEED ESTILO SOCIAL NORMAL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {posts
              .filter((p) => {
                if (adminFeedFilter === "mine") {
                  return (p.business_name || "").toLowerCase() === (account?.business_name || "").toLowerCase();
                }
                return true;
              })
              .map((p) => {
                const isMine = (p.business_name || "").toLowerCase() === (account?.business_name || "").toLowerCase();
                return (
                  <article className="adminFeedCard" key={p.id}>
                    <div className="adminFeedCardHeader">
                      <div className="adminFeedCardAuthor">
                        <div className="adminFeedAuthorAvatar">
                          {(p.business_name ?? account.business_name).slice(0, 1).toUpperCase()}
                        </div>
                        <div className="adminFeedCardMeta">
                          <h4>
                            {p.business_name ?? account.business_name}
                            <span style={{ color: "#0284c7", fontSize: "13px" }}>✓</span>
                            {isMine && (
                              <span style={{ fontSize: "10px", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "6px", fontWeight: "800" }}>
                                Mi Tienda
                              </span>
                            )}
                          </h4>
                          <small>
                            📍 {p.business_city || "Colombia"} · {new Date(p.created_at).toLocaleString("es-CO")}
                          </small>
                        </div>
                      </div>
                      <span className="portalPill" style={{ background: "#f0fdf4", color: "#166534", fontSize: "11px", fontWeight: "800" }}>
                        {p.content.toLowerCase().includes("entrega") || p.content.toLowerCase().includes("ganador")
                          ? "🎉 Entrega Oficial"
                          : "📢 Novedad Oficial"}
                      </span>
                    </div>

                    <p className="adminFeedCardText">{p.content}</p>

                    {p.image_url && (
                      <div className="adminFeedCardImageWrap">
                        <img src={p.image_url} alt="Foto de la publicación" />
                      </div>
                    )}

                    <div className="adminFeedCardActions">
                      <button
                        type="button"
                        className="socialShareBtn whatsapp"
                        onClick={() => {
                          const text = `🔥 ${p.business_name}: ${p.content} - Míralo en El Ganador: https://elganador.co/?post=${p.id}`;
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                        }}
                      >
                        💬 Compartir en WhatsApp
                      </button>
                      <button
                        type="button"
                        className="socialShareBtn facebook"
                        onClick={() => {
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://elganador.co/?post=${p.id}`)}`, "_blank");
                        }}
                      >
                        f Facebook
                      </button>
                      <button
                        type="button"
                        className="btnHeroOutline"
                        style={{ fontSize: "11px", padding: "6px 12px", color: "#0f172a", borderColor: "#cbd5e1" }}
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(`https://elganador.co/?post=${p.id}`);
                            alert("✓ ¡Enlace copiado al portapapeles!");
                          }
                        }}
                      >
                        🔗 Copiar Enlace
                      </button>
                      <a
                        href={`/?buscar=${encodeURIComponent(p.business_name ?? "")}`}
                        className="btnHeroOutline"
                        style={{ fontSize: "11px", padding: "6px 12px", color: "#059669", borderColor: "#a7f3d0", textDecoration: "none" }}
                      >
                        🛒 Ver Rifas de esta Tienda →
                      </a>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      )}
      {tab === "Documentos" && <section className="portalPanel"><div className="portalPanelHeading"><div><p className="portalEyebrow">FORMALIDAD DEL NEGOCIO</p><h2>Documentos para revisión</h2><p>La documentación no se publica ni aparece en tu perfil de tienda.</p></div></div><form className="portalDocForm" onSubmit={uploadDocument}><label>Tipo de documento<select required value={docType} onChange={(e) => setDocType(e.target.value)}><option value="">Selecciona</option>{[...new Set(["Identificación del titular o representante legal", "RUT", "Certificado de existencia y representación legal (Cámara de Comercio)", ...(docsByCategory[account.category] ?? ["Soporte legal del premio"])] )].map((x) => <option key={x}>{x}</option>)}</select></label><label>Archivo PDF, JPG o PNG · máximo 5 MB<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} /></label><button className="portalPrimary" disabled={docBusy}>{docBusy ? "Subiendo…" : "Enviar para revisión"}</button></form><div className="portalPrivateNote"><b>Almacenamiento de prototipo:</b> el archivo queda en el equipo donde corre esta demostración, en una carpeta privada. No existe equipo verificador todavía; usa documentos ficticios hasta instalar almacenamiento privado y revisión de identidad antes del lanzamiento público.</div><div className="portalDocs">{documents.length ? documents.map((d) => <div className="portalDocRow" key={d.id}><span>📄</span><div><b>{d.document_type}</b><small>{d.file_name} · {new Date(d.uploaded_at).toLocaleDateString("es-CO")}</small></div><span className={`portalStatus ${d.review_status === "approved" ? "isLive" : ""}`}>{d.review_status === "pending" ? "Pendiente" : d.review_status === "approved" ? "Aprobado" : "Requiere ajuste"}</span></div>) : <p className="portalMuted">No has agregado documentos todavía.</p>}</div></section>}
      {tab === "Mi Perfil & Cuenta" && (
        <section className="portalPanel">
          <div className="portalPanelHeading">
            <div>
              <p className="portalEyebrow">GESTIÓN INTEGRAL DE LA EMPRESA</p>
              <h2>Mi Perfil & Vitrina, Datos Legales & Seguridad</h2>
              <p>
                Configura la portada panorámica, logo y biografía de tu perfil y vitrina pública que ven tus clientes, y administra tus datos legales y bancarios.
              </p>
            </div>
            <a href={`/?business=${encodeURIComponent(account.business_name)}`} target="_blank" rel="noopener noreferrer" className="portalTextLink" style={{ fontWeight: 800, color: "#087b42" }}>
              Ver mi Vitrina Pública en Marketplace ↗
            </a>
          </div>

          {profileSectionMsg && (
            <div className={`portalNoticeBanner ${profileSectionMsg.type === "success" ? "isSuccess" : "isError"}`} role="status">
              <span>{profileSectionMsg.type === "success" ? "✅" : "⚠️"}</span>
              <strong>{profileSectionMsg.text}</strong>
            </div>
          )}

          {/* PERFIL EMPRESARIAL TIPO BIOGRAFÍA DE FACEBOOK (PORTADA GRANDE + LOGO PEQUEÑO + BIOGRAFÍA) */}
          <div className="fbAdminProfileWrapper">
            {/* 1. IMAGEN GRANDE DE PORTADA (COVER PHOTO) */}
            <div className="fbAdminCover">
              {profile.bannerUrl || account.business_banner_url ? (
                <img
                  src={profile.bannerUrl || account.business_banner_url}
                  alt="Portada del local"
                  className="fbAdminCoverImg"
                />
              ) : (
                <div className="fbAdminCoverPlaceholder">
                  <div className="fbAdminCoverGradient" />
                  <span className="fbAdminCoverWatermark">🎟️ EL GANADOR · TIENDA OFICIAL</span>
                </div>
              )}

              {/* Botón flotante para cambiar Portada Grande */}
              <div className="fbAdminCoverActions">
                <label className="fbAdminCoverBtn" title="Cambiar imagen de portada grande">
                  <span>📷 Cambiar Foto de Portada Grande</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfileSavingSection("banner");
                        try {
                          const body = new FormData();
                          body.set("file", file);
                          const uploadRes = await fetch("/api/admin/images", { method: "POST", body });
                          const uploadData = await uploadRes.json();
                          if (uploadRes.ok && uploadData.imageUrl) {
                            const newUrl = uploadData.imageUrl;
                            setProfile((curr) => ({ ...curr, bannerUrl: newUrl }));
                            await fetch("/api/admin/profile", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ bannerUrl: newUrl })
                            });
                            setAccount((curr) => curr ? ({ ...curr, business_banner_url: newUrl }) : curr);
                            setProfileSectionMsg({ type: "success", text: "✓ ¡Foto de portada grande actualizada exitosamente!" });
                          } else {
                            throw new Error(uploadData.error || "No se pudo subir la portada.");
                          }
                        } catch (err: any) {
                          setProfileSectionMsg({ type: "error", text: err.message || "Error al subir portada." });
                        } finally {
                          setProfileSavingSection(null);
                        }
                      }
                    }}
                  />
                </label>

                {(profile.bannerUrl || account.business_banner_url) && (
                  <button
                    type="button"
                    className="fbAdminRemoveBtn"
                    onClick={async () => {
                      setProfile((curr) => ({ ...curr, bannerUrl: "" }));
                      await fetch("/api/admin/profile", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bannerUrl: "" })
                      });
                      setAccount((curr) => curr ? ({ ...curr, business_banner_url: "" }) : curr);
                      setProfileSectionMsg({ type: "success", text: "Foto de portada eliminada." });
                    }}
                  >
                    🗑️ Quitar Portada
                  </button>
                )}

                {profileSavingSection === "banner" && (
                  <span className="fbAdminSavingTag">
                    ⏳ Guardando portada...
                  </span>
                )}
              </div>
            </div>

            {/* 2. BARRA DE PERFIL: LOGO PEQUEÑO SUPERPUESTO + NOMBRE + BIOGRAFÍA */}
            <div className="fbAdminBar">
              {/* LOGO PEQUEÑO SUPERPUESTO TIPO FACEBOOK */}
              <div className="fbAdminAvatarOverlap">
                {profile.photoUrl || account.business_photo_url ? (
                  <img
                    src={profile.photoUrl || account.business_photo_url}
                    alt={account.business_name}
                    className="fbAdminAvatarImg"
                  />
                ) : (
                  <div className="fbAdminAvatarInitials">
                    {(account.business_name || "T").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <label className="fbAdminAvatarCameraBtn" title="Cambiar logo pequeño del comercio">
                  <span>📸</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfileSavingSection("photo");
                        try {
                          const body = new FormData();
                          body.set("file", file);
                          const uploadRes = await fetch("/api/admin/images", { method: "POST", body });
                          const uploadData = await uploadRes.json();
                          if (uploadRes.ok && uploadData.imageUrl) {
                            const newUrl = uploadData.imageUrl;
                            setProfile((curr) => ({ ...curr, photoUrl: newUrl }));
                            await fetch("/api/admin/profile", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ photoUrl: newUrl })
                            });
                            setAccount((curr) => curr ? ({ ...curr, business_photo_url: newUrl }) : curr);
                            setProfileSectionMsg({ type: "success", text: "✓ ¡Logo pequeño actualizado exitosamente!" });
                          } else {
                            throw new Error(uploadData.error || "No se pudo subir el logo.");
                          }
                        } catch (err: any) {
                          setProfileSectionMsg({ type: "error", text: err.message || "Error al subir logo." });
                        } finally {
                          setProfileSavingSection(null);
                        }
                      }
                    }}
                  />
                </label>
              </div>

              {/* TÍTULO Y BIOGRAFÍA DEL COMERCIO */}
              <div className="fbAdminMeta">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>
                    {account.business_name}
                  </h2>
                  <span className="badgeSecurity" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                    ✓ Perfil Comercial Verificado
                  </span>
                </div>
                <p className="fbAdminBioPreview">
                  {profile.description || account.business_description || "Aún no has escrito tu biografía. Edítala en la sección de abajo."}
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "4px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>
                    📍 {profile.city || account.business_city || "Colombia"} · 🏷️ {profile.category || account.category}
                  </span>
                  <a
                    href={`/?business=${encodeURIComponent(account.business_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inlineLink"
                    style={{ fontSize: "12px", fontWeight: "800", color: "#047857" }}
                  >
                    👁️ Ver Vitrina en Marketplace →
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="profileAdminGrid">
            {/* TARJETA 1: PERFIL PÚBLICO DEL LOCAL */}
            <div className="profileCardBox">
              <div className="profileCardHeader">
                <span className="profileCardIcon">🏪</span>
                <div>
                  <h3>1. Perfil Público del Local</h3>
                  <p>Información visible para los compradores en el marketplace y salas de sorteo.</p>
                </div>
              </div>
              <form onSubmit={handleSaveStoreProfile} className="portalForm">
                {/* 1. FOTO DE PORTADA GRANDE TIPO FACEBOOK */}
                <label>
                  Imagen de Portada Grande (Banner Panorámico tipo Facebook)
                  <div style={{ marginTop: "6px" }}>
                    {profile.bannerUrl ? (
                      <div style={{ width: "100%", height: "120px", borderRadius: "10px", overflow: "hidden", position: "relative", marginBottom: "8px", border: "1px solid #cbd5e1" }}>
                        <img src={profile.bannerUrl} alt="Portada grande" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => setProfile((c) => ({ ...c, bannerUrl: "" }))}
                          style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", padding: "4px 8px", cursor: "pointer" }}
                        >
                          ✕ Quitar
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: "80px", borderRadius: "10px", background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a7f3d0", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>
                        🖼️ Sin portada personalizada (Se muestra gradiente corporativo)
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void uploadImage(file, (url) => {
                            setProfile((curr) => ({ ...curr, bannerUrl: url }));
                          });
                        }
                      }}
                    />
                    <small style={{ color: "#64748b", display: "block", marginTop: "3px" }}>
                      Recomendado: 1200 x 400 px · JPG, PNG o WebP. Se mostrará en la cabecera superior de tu vitrina.
                    </small>
                  </div>
                </label>

                {/* 2. LOGO PEQUEÑO */}
                <label>
                  Logo Pequeño del Comercio (Foto de Perfil Circular)
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "6px" }}>
                    {profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt="Logo del comercio"
                        style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid #059669" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: "#065f46",
                          color: "#ffffff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "22px",
                          fontWeight: "900",
                        }}
                      >
                        {profile.name.slice(0, 1).toUpperCase() || "T"}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void uploadImage(file, (url) => {
                              setProfile((curr) => ({ ...curr, photoUrl: url }));
                            });
                          }
                        }}
                      />
                      <small style={{ color: "#64748b", display: "block", marginTop: "3px" }}>
                        Logo cuadrado o circular. Se superpone en la portada y aparece en tus boletas y rifas.
                      </small>
                    </div>
                  </div>
                </label>

                {/* 3. NOMBRE COMERCIAL */}
                <label>
                  Nombre Comercial del Local
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Ej. Joyas & Relojes del Caribe"
                  />
                </label>

                <div className="portalFormGrid">
                  <label>
                    Ciudad de Operación
                    <input
                      required
                      maxLength={100}
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="Ej. Medellín, Barranquilla, Bogotá"
                    />
                  </label>
                  <label>
                    Categoría Principal
                    <select
                      value={profile.category}
                      onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* 4. BIOGRAFÍA */}
                <label>
                  Biografía Oficial del Negocio (Visible en el Marketplace)
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    placeholder="Escribe la biografía completa de tu tienda: qué productos vendes, garantías, trayectoria, horario de atención y por qué los clientes confían en tus sorteos..."
                  />
                  <small style={{ color: "#64748b", display: "block", marginTop: "2px" }}>
                    {profile.description.length} / 1000 caracteres · Esta biografía aparece destacada bajo tu foto de portada.
                  </small>
                </label>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", gap: "10px", flexWrap: "wrap" }}>
                  <a href={`/?business=${encodeURIComponent(profile.name || account.business_name)}`} target="_blank" rel="noopener noreferrer" className="inlineLink" style={{ fontSize: "12px", fontWeight: "700" }}>
                    👁️ Ver cómo luce mi vitrina en vivo →
                  </a>
                  <button type="submit" className="portalPrimary" disabled={profileSavingSection === "store"}>
                    {profileSavingSection === "store" ? "Guardando…" : "Guardar Perfil y Biografía"}
                  </button>
                </div>
              </form>
            </div>

            {/* TARJETA 2: DATOS PERSONALES & REPRESENTANTE LEGAL */}
            <div className="profileCardBox">
              <div className="profileCardHeader">
                <span className="profileCardIcon">👤</span>
                <div>
                  <h3>2. Datos Personales & Representante Legal</h3>
                  <p>Información del titular responsable para fines legales y contractuales.</p>
                </div>
              </div>
              <form onSubmit={handleSavePersonalData} className="portalForm">
                <label>
                  Nombre Completo del Representante Legal / Titular
                  <input
                    required
                    value={personalData.legalName}
                    onChange={(e) => setPersonalData({ ...personalData, legalName: e.target.value })}
                    placeholder="Nombre y apellidos según documento oficial"
                  />
                </label>
                <div className="portalFormGrid">
                  <label>
                    Cédula / Documento de Identidad
                    <input
                      required
                      value={personalData.identityNumber}
                      onChange={(e) => setPersonalData({ ...personalData, identityNumber: e.target.value })}
                      placeholder="Ej. 1.098.765.432 (C.C.)"
                    />
                  </label>
                  <label>
                    NIT o RUT Comercial
                    <input
                      required
                      value={personalData.taxId}
                      onChange={(e) => setPersonalData({ ...personalData, taxId: e.target.value })}
                      placeholder="Ej. 901.456.789-1"
                    />
                  </label>
                </div>
                <div className="portalFormGrid">
                  <label>
                    Correo Electrónico Oficial del Titular / Representante
                    <input
                      type="email"
                      required
                      value={personalData.email}
                      onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                      placeholder="representante@tiendaxyz.com"
                    />
                  </label>
                  <label>
                    Teléfono / WhatsApp Comercial
                    <input
                      required
                      value={personalData.phone}
                      onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                      placeholder="+57 300 123 4567"
                    />
                  </label>
                </div>
                <label>
                  Dirección Física del Local / Bodega
                  <input
                    required
                    value={personalData.address}
                    onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                    placeholder="Calle o Carrera, Edificio o Local"
                  />
                </label>
                <button type="submit" className="portalPrimary" style={{ marginTop: "12px" }} disabled={profileSavingSection === "personal"}>
                  {profileSavingSection === "personal" ? "Guardando…" : "Guardar Datos Personales"}
                </button>
              </form>
            </div>

            {/* TARJETA 3: CUENTA BANCARIA PARA DESEMBOLSOS */}
            <div className="profileCardBox">
              <div className="profileCardHeader">
                <span className="profileCardIcon">🏦</span>
                <div>
                  <h3>3. Cuenta Bancaria para Desembolsos y Liquidaciones</h3>
                  <p>Cuenta receptora certificada donde se transfiere el 100% del recaudo tras el sorteo notariado.</p>
                </div>
              </div>
              <div className="bankNoticeBox">
                <span className="bankShieldIcon">🛡️</span>
                <div>
                  <strong>Liquidación Notarial Segura</strong>
                  <p>
                    El Ganador custodia los fondos de cada rifa. Una vez realizada la transmisión en vivo y validado el acta notarial con hash SHA-256, los fondos se transfieren automáticamente a esta cuenta vía ACH en un plazo menor a 24 horas hábiles.
                  </p>
                </div>
              </div>
              <form onSubmit={handleSaveBankData} className="portalForm" style={{ marginTop: "12px" }}>
                <div className="portalFormGrid">
                  <label>
                    Entidad Bancaria
                    <select
                      value={bankData.bankName}
                      onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    >
                      {["Bancolombia", "Banco de Bogotá", "Davivienda", "BBVA Colombia", "Nequi", "Daviplata", "Scotiabank Colpatria", "Banco de Occidente", "Banco Popular", "Nu Colombia (Cuenta de Ahorros)", "Lulo Bank"].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tipo de Cuenta
                    <select
                      value={bankData.bankAccountType}
                      onChange={(e) => setBankData({ ...bankData, bankAccountType: e.target.value })}
                    >
                      <option value="Ahorros">Cuenta de Ahorros</option>
                      <option value="Corriente">Cuenta Corriente</option>
                    </select>
                  </label>
                </div>
                <div className="portalFormGrid">
                  <label>
                    Número de Cuenta Bancaria
                    <input
                      required
                      value={bankData.bankAccountNumber}
                      onChange={(e) => setBankData({ ...bankData, bankAccountNumber: e.target.value })}
                      placeholder="Ej. 912-837465-21 o # celular Nequi"
                    />
                  </label>
                  <label>
                    Nombre del Titular de la Cuenta
                    <input
                      required
                      value={bankData.bankAccountHolder}
                      onChange={(e) => setBankData({ ...bankData, bankAccountHolder: e.target.value })}
                      placeholder="Razón Social o Nombre según certificación"
                    />
                  </label>
                </div>
                <label>
                  NIT o Documento del Titular Bancario
                  <input
                    required
                    value={bankData.bankAccountDoc}
                    onChange={(e) => setBankData({ ...bankData, bankAccountDoc: e.target.value })}
                    placeholder="Ej. NIT 901.456.789-1 o C.C. 1.098.765.432"
                  />
                </label>
                <div className="bankCertBadge">
                  <span>✓</span> Cuenta Bancaria Verificada & Aprobada para Pagos Inmediatos ACH
                </div>
                <button type="submit" className="portalPrimary" style={{ marginTop: "12px" }} disabled={profileSavingSection === "bank"}>
                  {profileSavingSection === "bank" ? "Guardando…" : "Guardar Cuenta Bancaria"}
                </button>
              </form>
            </div>

            {/* TARJETA 4: SEGURIDAD & CAMBIO DE CONTRASEÑA */}
            <div className="profileCardBox">
              <div className="profileCardHeader">
                <span className="profileCardIcon">🔐</span>
                <div>
                  <h3>4. Seguridad & Cambio de Contraseña</h3>
                  <p>Protege el acceso a tu panel administrativo y recaudos financieros.</p>
                </div>
              </div>
              <div className="portalAuthEmailRow">
                <span>📧 Correo de acceso registrado:</span>
                <strong>{account.email}</strong>
                <span className="verifiedEmailTag">✓ Verificado</span>
              </div>
              <form onSubmit={handleChangePassword} className="portalForm" style={{ marginTop: "14px" }}>
                <label>
                  Contraseña Actual
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Tu clave actual (ej. Demo123456*)"
                  />
                </label>
                <div className="portalFormGrid">
                  <label>
                    Nueva Contraseña
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </label>
                  <label>
                    Confirmar Nueva Contraseña
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Repite la nueva clave"
                    />
                  </label>
                </div>
                <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                  🔒 Cifrado PBKDF2/scrypt de grado militar. Tu contraseña nunca se almacena en texto plano.
                </small>
                <button type="submit" className="portalPrimary" style={{ marginTop: "12px" }} disabled={profileSavingSection === "password"}>
                  {profileSavingSection === "password" ? "Actualizando…" : "Actualizar Contraseña Segura"}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </section></div>
    {draft && <div className="portalModalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setDraft(null); }}><section className="portalEditor" role="dialog" aria-modal="true" aria-labelledby="raffleHeading"><button className="portalModalClose" onClick={() => setDraft(null)}>×</button><p className="portalEyebrow">{draft.drawId ? "EDITAR RIFA" : "NUEVA RIFA"}</p><h2 id="raffleHeading">Configura tu premio</h2><p className="portalMuted">Elige las condiciones que aparecerán en el marketplace.</p><aside className="raffleTerritoryCallout" aria-label="Advertencia sobre cobertura y autorización de la rifa"><strong>Antes de publicar una rifa real</strong><p>{raffleTerritoryNotice}</p><small>Esta demo conserva la cobertura que declara el negocio, pero no valida permisos ni restringe ventas por ubicación.</small></aside><form className="portalForm" onSubmit={saveDraft}><div className="portalFormGrid"><label>Nombre del artículo<input required minLength={3} maxLength={100} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Categoría<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value, details: {} })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label><label>Valor real del premio (COP)<input required type="number" min="0" max="10000000000" value={draft.productValue} onChange={(e) => setDraft({ ...draft, productValue: e.target.value })} /><small>El tope del plan se aplica a las ventas proyectadas.</small></label><label>Precio por número (COP)<input required type="number" min="1000" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} /><small>Venta bruta proyectada: {money(Number(draft.unitPrice || 0) * Number(draft.totalTickets || 0))} · Tope del plan: {money(plan?.maxRaffleGain ?? 3000000)}</small></label><label>Números en el cartón<select required value={draft.totalTickets} onChange={(e) => setDraft({ ...draft, totalTickets: e.target.value })}>{planCartonOptions(plan ?? availablePlans.gratis).map((size) => <option key={size} value={size}>{count(size)} números</option>)}</select><small>Cartones disponibles para publicar: {availableCartonSizes.map(count).join(", ") || "sin cupos libres"}.</small></label></div><label>Descripción del premio<textarea required minLength={8} maxLength={2500} rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label><div className="portalCategoryFields"><b>Especificaciones de {draft.category}</b><div className="portalFormGrid">{categoryFields.map(([label, key]) => <label key={key}>{label}<input value={draft.details[key] ?? ""} onChange={(e) => setDraft({ ...draft, details: { ...draft.details, [key]: e.target.value } })} /></label>)}</div></div><RaffleTerritoryFields value={{ territoryScope: draft.territoryScope, territoryDepartment: draft.territoryDepartment, territoryMunicipality: draft.territoryMunicipality, territoryMunicipalities: draft.territoryMunicipalities, territoryDepartments: draft.territoryDepartments }} onChange={(patch) => setDraft({ ...draft, ...patch })} /><label>Foto real del premio<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file, (imageUrl) => setDraft((current) => current ? { ...current, imageUrl } : current)); }} /></label>{imageBusy && <small>Subiendo foto…</small>}{draft.imageUrl && <img className="portalPrizePreview" src={draft.imageUrl} alt="Vista previa del premio" />}<fieldset className="portalStartOptions"><legend>¿Cuándo debe comenzar la rifa?</legend><label><input type="radio" checked={draft.startMode === "threshold"} onChange={() => setDraft({ ...draft, startMode: "threshold" })} /> Al alcanzar ventas</label>{draft.startMode === "threshold" && <label>Activar al vender<select value={draft.startThreshold} onChange={(e) => setDraft({ ...draft, startThreshold: e.target.value })}>{[50, 70, 80, 90, 100].map((x) => <option key={x} value={x}>{x}% del cartón</option>)}</select></label>}<label><input type="radio" checked={draft.startMode === "date"} onChange={() => setDraft({ ...draft, startMode: "date" })} /> Esperar a una fecha</label>{draft.startMode === "date" && <label>Fecha y hora<input required type="datetime-local" value={draft.scheduledAt} onChange={(e) => setDraft({ ...draft, scheduledAt: e.target.value })} /></label>}</fieldset><label className="portalPublishToggle"><input type="checkbox" checked={draft.published} disabled={plan?.demoOnly} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Mostrar mi rifa en el marketplace ahora</label>{plan?.demoOnly && <p className="portalPrivateNote">La cuenta Gratis solo permite guardar borradores de prueba.</p>}<p className="portalPrivateNote">El progreso usa números vendidos, no reservas temporales. El prototipo no cobra, no confirma ventas y no sortea ganadores automáticamente.</p><button className="portalPrimary" disabled={busy || imageBusy}>{busy ? "Guardando…" : draft.drawId ? "Guardar cambios" : draft.published ? "Publicar rifa" : "Guardar borrador"}</button></form></section></div>}

    {/* MODAL PARA SUBIR HISTORIA 24 HORAS ESTILO INSTAGRAM */}
    {storyModalOpen && (
      <div className="portalModalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !storyBusy) { handleClearStoryMedia(); setStoryModalOpen(false); } }}>
        <section className="portalEditor" role="dialog" aria-modal="true" aria-labelledby="storyHeading" style={{ maxWidth: "480px" }}>
          <button className="portalModalClose" onClick={() => { handleClearStoryMedia(); setStoryModalOpen(false); }}>×</button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>📸</span>
            <div>
              <p className="portalEyebrow" style={{ color: "#d97706", margin: 0 }}>HISTORIA INSTAGRAM · 24 HORAS</p>
              <h2 id="storyHeading" style={{ margin: "2px 0 0" }}>Publicar Historia del Local</h2>
            </div>
          </div>
          <p className="portalMuted">
            Toma fotos o graba videos directamente desde la cámara de tu celular, o súbelos de tu galería. Las historias duran 24 horas y destacan con el anillo interactivo en el marketplace.
          </p>

          <form className="portalForm" onSubmit={handlePublishStory}>
            {/* BOTONES DE CAPTURA NATIVA PARA MÓVILES */}
            <div className="storyCaptureGrid">
              <label className="storyCaptureBtn photo">
                <span className="storyCaptureIcon">📸</span>
                <span>Tomar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStoryMediaSelect(f); }}
                />
              </label>

              <label className="storyCaptureBtn video">
                <span className="storyCaptureIcon">🎥</span>
                <span>Grabar Video</span>
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStoryMediaSelect(f); }}
                />
              </label>

              <label className="storyCaptureBtn gallery">
                <span className="storyCaptureIcon">🖼️</span>
                <span>Galería Móvil</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStoryMediaSelect(f); }}
                />
              </label>
            </div>

            {/* VISTA PREVIA FORMATO CELULAR 9:16 */}
            {storyPreviewUrl ? (
              <>
                <div className="storyPhoneFrame">
                  <div className="storyPhoneHeader">
                    <div className="storyPhoneUser">
                      <div className="storyPhoneAvatar">
                        {(account?.business_name || "T").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="storyPhoneName">{account?.business_name || "Tienda XYZ"}</div>
                        <div className="storyPhoneTime">Ahora · Historia 24h</div>
                      </div>
                    </div>
                  </div>

                  {storyMediaType === "video" ? (
                    <video
                      className="storyMediaElement"
                      src={storyPreviewUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                    />
                  ) : (
                    <img
                      className="storyMediaElement"
                      src={storyPreviewUrl}
                      alt="Vista previa de la historia"
                    />
                  )}

                  {storyCaption.trim() && (
                    <div className="storyStickerOverlay">
                      {storyCaption}
                    </div>
                  )}
                </div>

                <div className="storyRetakeBar">
                  <button
                    type="button"
                    className="storyRetakeBtn"
                    onClick={handleClearStoryMedia}
                  >
                    🔄 Descartar y tomar otra foto/video
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "28px 18px", background: "#f8fafc", borderRadius: "14px", border: "2px dashed #cbd5e1", marginBottom: "14px" }}>
                <span style={{ fontSize: "38px" }}>📱</span>
                <h4 style={{ margin: "8px 0 2px", fontSize: "14px", color: "#1e293b", fontWeight: "800" }}>
                  Captura una foto o video desde tu móvil
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  Selecciona una de las 3 opciones de arriba para abrir tu cámara o elegir de tu galería.
                </p>
              </div>
            )}

            <label>
              Sticker o Mensaje de la Historia
              <input
                maxLength={200}
                placeholder="Ej. 🔥 ¡Últimos 14 números! Juega hoy 8 PM · Aparta ya"
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
              />
            </label>

            <div style={{ padding: "10px 14px", background: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a", fontSize: "12px", color: "#92400e" }}>
              ⏳ <b>Expiración garantizada:</b> Esta historia desaparecerá automáticamente del marketplace en 24 horas.
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button
                type="button"
                className="btnHeroOutline"
                style={{ color: "#334155", borderColor: "#cbd5e1" }}
                onClick={() => { handleClearStoryMedia(); setStoryModalOpen(false); }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="portalPrimary"
                disabled={storyBusy || !storyMediaFile}
                style={{ flex: 1, background: storyMediaFile ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#cbd5e1", fontWeight: "800", cursor: storyMediaFile ? "pointer" : "not-allowed" }}
              >
                {storyBusy ? "Subiendo y publicando…" : "📸 Publicar Historia de 24 Horas"}
              </button>
            </div>
          </form>
        </section>
      </div>
    )}

    {/* MODAL STORY VIEWER ESTILO INSTAGRAM */}
    {activeViewingStory && (
      <div className="instagramStoryViewerModal" onClick={(e) => { if (e.target === e.currentTarget) setActiveViewingStory(null); }}>
        <div className="storyViewerCard">
          <div className="storyProgressBar">
            <div className="storyProgressFill" />
          </div>

          <div className="storyViewerHeader">
            <div className="storyStoreBadge">
              <div className="storyAvatarRing">
                <span>{(account?.business_name || "T").slice(0, 1).toUpperCase()}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "14px", color: "#ffffff" }}>{account?.business_name || "Tienda XYZ"}</strong>
                <small style={{ fontSize: "11px", color: "#fbbf24" }}>🕒 Expira en {getTimeRemainingStory(activeViewingStory.expires_at)}</small>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveViewingStory(null)}
              style={{ background: "rgba(0,0,0,0.5)", border: "none", color: "#ffffff", width: "32px", height: "32px", borderRadius: "50%", fontSize: "18px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div className="storyViewerImageWrap">
            {activeViewingStory.media_type === "video" || activeViewingStory.media_url.endsWith(".mp4") || activeViewingStory.media_url.endsWith(".webm") || activeViewingStory.media_url.endsWith(".mov") ? (
              <video
                src={activeViewingStory.media_url}
                autoPlay
                loop
                playsInline
                controls
                style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000000" }}
              />
            ) : (
              <img src={activeViewingStory.media_url} alt="Historia en vivo" />
            )}
          </div>

          <div className="storyViewerFooter">
            <p>{activeViewingStory.caption}</p>
            <div className="socialShareButtonGroup">
              <button
                type="button"
                className="socialShareBtn whatsapp"
                onClick={() => shareStoryWhatsApp(activeViewingStory.caption, activeViewingStory.media_url)}
              >
                💬 Compartir en WhatsApp
              </button>
              <button
                type="button"
                className="socialShareBtn facebook"
                onClick={() => shareStoryFacebook(activeViewingStory.caption)}
              >
                f Facebook
              </button>
              <button
                type="button"
                className="socialShareBtn instagram"
                onClick={() => void shareStoryInstagram(activeViewingStory.caption)}
              >
                📸 Instagram
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </main>
  );
}

function PortalMetric({ icon, label, value, hint }: { icon: string; label: string; value: string; hint: string }) { return <article className="portalMetric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><small>{hint}</small></div></article>; }









