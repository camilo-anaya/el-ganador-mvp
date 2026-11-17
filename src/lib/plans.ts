export const plans = {
  gratis: {
    name: "Gratis",
    tagline: "Prueba el panel sin publicar rifas reales.",
    rafflesPerMonth: null,
    rafflesPerYear: null,
    maxSimultaneousRaffles: 0,
    cartonSizes: [100],
    maxTicketsPerDraw: 100,
    maxRaffleGain: 0,
    commissionPercent: 0,
    subscriptionPrice: 0,
    subscriptionPeriod: "sin costo",
    panelAccess: "Limitado",
    businessProfile: false,
    crm: false,
    rouletteDrawsPerYear: null,
    liveDrawTools: null,
    demoOnly: true,
    features: ["Acceso limitado al panel de demostración", "Perfil de prueba; sin publicación ni ventas de rifas reales"],
  },
  basico: {
    name: "Básico",
    tagline: "Abre tu tienda y mantén hasta tres rifas publicadas.",
    rafflesPerMonth: null,
    rafflesPerYear: null,
    maxSimultaneousRaffles: 3,
    cartonSizes: [100, 100, 100],
    maxTicketsPerDraw: 100,
    maxRaffleGain: 3_500_000,
    commissionPercent: 10,
    subscriptionPrice: 60_000,
    subscriptionPeriod: "al mes",
    panelAccess: "Básico",
    businessProfile: true,
    crm: false,
    rouletteDrawsPerYear: null,
    liveDrawTools: null,
    demoOnly: false,
    features: [],
  },
  pro: {
    name: "Pro",
    tagline: "Gestiona hasta cinco rifas publicadas y fideliza clientes.",
    rafflesPerMonth: null,
    rafflesPerYear: null,
    maxSimultaneousRaffles: 5,
    cartonSizes: [100, 100, 100, 200, 200],
    maxTicketsPerDraw: 200,
    maxRaffleGain: 7_000_000,
    commissionPercent: 9,
    subscriptionPrice: 850_000,
    subscriptionPeriod: "al año",
    panelAccess: "Profesional",
    businessProfile: true,
    crm: true,
    rouletteDrawsPerYear: null,
    liveDrawTools: null,
    demoOnly: false,
    features: [],
  },
  premium: {
    name: "Premium",
    tagline: "Más capacidad y herramientas propias para vivir el sorteo.",
    rafflesPerMonth: null,
    rafflesPerYear: null,
    maxSimultaneousRaffles: 10,
    cartonSizes: [100, 100, 100, 100, 200, 200, 200, 200, 300, 300],
    maxTicketsPerDraw: 300,
    maxRaffleGain: 30_000_000,
    commissionPercent: 8,
    subscriptionPrice: 2_000_000,
    subscriptionPeriod: "al año",
    panelAccess: "Profesional",
    businessProfile: true,
    crm: true,
    rouletteDrawsPerYear: 40,
    liveDrawTools: { annualQuota: 40, modes: ["balotas", "ruleta"], wheelPlayerOptions: [10, 20, 30, 40, 50] },
    demoOnly: false,
    features: [],
  },
  empresarial: {
    name: "Empresarial",
    tagline: "Más capacidad de catálogo para negocios de alto volumen.",
    rafflesPerMonth: null,
    rafflesPerYear: null,
    maxSimultaneousRaffles: null,
    cartonSizes: null,
    maxTicketsPerDraw: 1_000,
    maxRaffleGain: 100_000_000,
    commissionPercent: 5,
    subscriptionPrice: 4_000_000,
    subscriptionPeriod: "al año",
    panelAccess: "Profesional",
    businessProfile: true,
    crm: true,
    rouletteDrawsPerYear: 80,
    liveDrawTools: { annualQuota: 80, modes: ["balotas", "ruleta"], wheelPlayerOptions: [10, 20, 30, 40, 50] },
    demoOnly: false,
    features: [],
  },
} as const;

export const raffleTerritoryNotice = "El Ganador opera dentro del marco legal colombiano. Cada rifa real debe contar con el registro y la autorización aplicables a su cobertura y operar mediante el operador autorizado correspondiente. La cobertura elegida indica el alcance previsto y no reemplaza los trámites de esa rifa. No solicitamos ciudad ni GPS al comprador; el organizador debe mantener la oferta y las ventas dentro del alcance autorizado y consultar sus dudas con el operador o la autoridad competente.";

export const planLegalNotice = `${raffleTerritoryNotice} Los cupos simultáneos del plan no amplían el límite legal de dos fechas de rifa por gestor al mes. Los derechos de explotación son del 14% de los ingresos brutos: se calculan al autorizarse sobre el valor total de las boletas emitidas y se ajustan después del sorteo a la boletería vendida. Son distintos del precio del plan y de la comisión de plataforma.`;

export type PlanId = keyof typeof plans;
export type PlanDefinition = (typeof plans)[PlanId];

const legacyPlanIds: Record<string, PlanId> = {
  inicio: "gratis",
  crecimiento: "basico",
  negocio: "pro",
};

export function getPlan(value: string) {
  const planId = legacyPlanIds[value] ?? value;
  return plans[planId as PlanId] ?? plans.gratis;
}

export function getCurrentBogotaMonthStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? String(now.getUTCFullYear());
  const month = parts.find((part) => part.type === "month")?.value ?? String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01T05:00:00.000Z`;
}

export function getCurrentBogotaYearStart(now = new Date()) {
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric" })
    .formatToParts(now).find((part) => part.type === "year")?.value ?? String(now.getUTCFullYear());
  return `${year}-01-01T05:00:00.000Z`;
}

export function describeCartons(cartonSizes: readonly number[] | null, maxTicketsPerDraw: number) {
  if (!cartonSizes) return `Cartones de 100 a ${maxTicketsPerDraw.toLocaleString("es-CO")} números`;
  const counts = new Map<number, number>();
  cartonSizes.forEach((size) => counts.set(size, (counts.get(size) ?? 0) + 1));
  return [...counts.entries()].map(([size, quantity]) => `${quantity} de ${size} números`).join(" · ");
}

export function describeRaffleCapacity(plan: PlanDefinition) {
  if (plan.demoOnly) return "Prueba gratuita · no publica rifas reales";
  if (plan.rafflesPerMonth !== null) {
    return `${plan.rafflesPerMonth} rifa nueva al mes · ${plan.maxSimultaneousRaffles} publicada a la vez`;
  }
  if (plan.maxSimultaneousRaffles === null) return "Publicaciones simultáneas sin límite del plan";
  return `Hasta ${plan.maxSimultaneousRaffles} rifas publicadas a la vez`;
}

export function planCartonOptions(plan: PlanDefinition) {
  if (plan.cartonSizes) return [...new Set(plan.cartonSizes)];
  return Array.from({ length: Math.floor(plan.maxTicketsPerDraw / 100) }, (_, index) => (index + 1) * 100);
}

export function advancePlanExpiry(planId: string, currentExpiry: string | null | undefined, now = new Date()) {
  if (!Object.hasOwn(plans, planId)) return null;
  const plan = plans[planId as PlanId];
  if (plan.demoOnly) return null;
  const months = plan.subscriptionPeriod === "al mes" ? 1 : plan.subscriptionPeriod === "al año" ? 12 : 0;
  if (!months) return null;

  const parsedExpiry = currentExpiry ? new Date(currentExpiry) : null;
  const base = parsedExpiry && Number.isFinite(parsedExpiry.getTime()) && parsedExpiry > now ? parsedExpiry : now;
  const day = base.getUTCDate();
  const next = new Date(base);
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const lastDayOfMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDayOfMonth));
  return next.toISOString();
}
