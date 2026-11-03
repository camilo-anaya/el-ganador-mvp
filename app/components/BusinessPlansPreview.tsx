import { describeCartons, describeRaffleCapacity, plans } from "../../lib/plans";
import RaffleTerritoryNotice from "./RaffleTerritoryNotice";

const planIds = ["basico", "pro", "premium", "empresarial"] as const;
const money = (value: number) => new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
}).format(value);

function LotteryBallIcon({ gradientId }: { gradientId: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={gradientId} cx="29%" cy="23%" r="78%">
          <stop offset="0" stopColor="#636b73" />
          <stop offset=".28" stopColor="#272d33" />
          <stop offset=".72" stopColor="#090c0f" />
          <stop offset="1" stopColor="#020304" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="33" r="26" fill={`url(#${gradientId})`} stroke="#15191d" strokeWidth="1.5" />
      <ellipse cx="23" cy="19" rx="9" ry="4" fill="#fff" opacity=".24" transform="rotate(-35 23 19)" />
      <path d="M15 27c2-8 7-13 14-16" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2" opacity=".22" />
      <circle cx="33" cy="35" r="11.2" fill="#fbfbf7" stroke="#d8d9d5" strokeWidth="1" />
      <text x="33" y="39" fill="#16191c" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" textAnchor="middle">8</text>
    </svg>
  );
}

function PrizeWheelIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M28 9 32 2l4 7-4 3z" fill="#b48728" stroke="#7a5a18" strokeWidth="1" />
      <circle cx="32" cy="35" r="26" fill="#173b2a" stroke="#9f7621" strokeWidth="2" />
      <circle cx="32" cy="35" r="22" fill="#f3dfaa" stroke="#e0bd60" strokeWidth="1.5" />
      <path d="M32 35 32 17 A18 18 0 0 1 44.7 22.3Z" fill="#c93c3c" stroke="#fff0c3" strokeWidth=".8" />
      <path d="M32 35 44.7 22.3 A18 18 0 0 1 50 35Z" fill="#f0c44b" stroke="#fff0c3" strokeWidth=".8" />
      <path d="M32 35 50 35 A18 18 0 0 1 44.7 47.7Z" fill="#287750" stroke="#fff0c3" strokeWidth=".8" />
      <path d="M32 35 44.7 47.7 A18 18 0 0 1 32 53Z" fill="#356a9c" stroke="#fff0c3" strokeWidth=".8" />
      <path d="M32 35 32 53 A18 18 0 0 1 19.3 47.7Z" fill="#d79937" stroke="#fff0c3" strokeWidth=".8" />
      <path d="M32 35 19.3 47.7 A18 18 0 0 1 14 35Z" fill="#c93c3c" stroke="#fff0c3" strokeWidth=".8" />
      <path d="M32 35 14 35 A18 18 0 0 1 19.3 22.3Z" fill="#287750" stroke="#fff0c3" strokeWidth=".8" />
      <path d="M32 35 19.3 22.3 A18 18 0 0 1 32 17Z" fill="#f0c44b" stroke="#fff0c3" strokeWidth=".8" />
      <circle cx="32" cy="35" r="5.4" fill="#fff8df" stroke="#9f7621" strokeWidth="1.6" />
      <circle cx="32" cy="35" r="1.7" fill="#9f7621" />
    </svg>
  );
}

export default function BusinessPlansPreview() {
  return (
    <section className="businessPricingSection businessPricingPublic" aria-labelledby="publicBusinessPlansHeading">
      <header className="businessPricingHeader">
        <div>
          <p className="portalEyebrow">PLANES PARA NEGOCIOS</p>
          <h2 id="publicBusinessPlansHeading">Elige cómo hacer crecer tu local</h2>
          <p>Compara precios, capacidad y herramientas. Selecciona un plan para continuar con el registro de tu negocio.</p>
        </div>
        <span className="businessPricingBadge">4 planes pagos · valores en COP</span>
      </header>

      <div className="businessTrialCard">
        <div>
          <p className="portalEyebrow">PRUEBA GRATUITA · DEMO DEL PANEL</p>
          <strong>Conoce El Ganador sin costo</strong>
          <p>Prepara borradores y explora el panel. La demo no permite publicar rifas reales ni recibir ventas.</p>
        </div>
        <a className="businessDemoLink" href="/admin?mode=register&plan=gratis#planes">Ver demo gratis <span aria-hidden="true">→</span></a>
      </div>

      <div className="businessPricingCards">
        {planIds.map((planId) => {
          const plan = plans[planId];
          return (
            <article key={planId} className="businessPricingCard">
              <div className="businessPricingIdentity">
                <div className="businessPricingCardTop"><span>{plan.name}</span></div>
                <p className="businessPricingTagline">{plan.tagline}</p>
                <div className="businessPricingPrice">
                  <strong>{money(plan.subscriptionPrice)}</strong>
                  <span>{plan.subscriptionPeriod}</span>
                </div>
              </div>
              <ul>
                <li><span aria-hidden="true">✓</span><div><b>{describeRaffleCapacity(plan)}</b></div></li>
                <li><span aria-hidden="true">✓</span><div>{describeCartons(plan.cartonSizes, plan.maxTicketsPerDraw)}</div></li>
                <li><span aria-hidden="true">✓</span><div>Tope de venta bruta: <b>{money(plan.maxRaffleGain)} por rifa</b></div></li>
                <li><span aria-hidden="true">✓</span><div>Comisión de plataforma por cada rifa jugada: <b>{plan.commissionPercent}%</b></div></li>
                <li><span aria-hidden="true">✓</span><div>Panel <b>{plan.panelAccess.toLowerCase()}</b> · perfil empresarial</div></li>
                <li><span aria-hidden="true">✓</span><div>Tienda online con productos, fotos y descripciones</div></li>
                <li><span aria-hidden="true">✓</span><div>Vinculación de cuenta preferida y redes sociales</div></li>
                <li><span aria-hidden="true">✓</span><div>Comparte el enlace de tu rifa</div></li>
                <li><span aria-hidden="true">✓</span><div>{planId === "basico" ? "Soporte por chat" : "Soporte prioritario por chat 24/7"}</div></li>
                {plan.crm && <>
                  <li><span aria-hidden="true">✓</span><div>CRM y base de datos de clientes</div></li>
                  <li><span aria-hidden="true">✓</span><div>Ofertas por WhatsApp, correo y notificaciones desde El Ganador</div></li>
                </>}
                {plan.liveDrawTools && <li><span aria-hidden="true">✓</span><div>Balotas y ruleta personalizable para 10, 20, 30 o 50 participantes · <b>{plan.liveDrawTools.annualQuota} usos al año</b></div></li>}
                {plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span><div>{feature}</div></li>)}
              </ul>
              <a className="businessPlanSelectButton" href={`/admin?mode=register&plan=${planId}#planes`}>
                Elegir {plan.name} <span aria-hidden="true">→</span>
              </a>
            </article>
          );
        })}
      </div>

      <RaffleTerritoryNotice />

      <section className="businessTechPromo" aria-labelledby="publicDrawToolsHeading">
        <div className="businessTechMark" aria-hidden="true">
          <span className="businessTechSymbol"><LotteryBallIcon gradientId="business-ball-main" /></span><b className="businessTechPlus">+</b><span className="businessTechSymbol"><PrizeWheelIcon /></span>
        </div>
        <div className="businessTechCopy">
          <p className="portalEyebrow">TECNOLOGÍA PROPIA · EL PLUS DE EL GANADOR</p>
          <h3 id="publicDrawToolsHeading">Balotas digitales y ruleta giratoria estilo carrusel.</h3>
          <p>Dos maneras de vivir el sorteo: balotas para rifas numeradas y una ruleta visual, personalizable para grupos de 10, 20, 30 o 50 participantes.</p>
          <div className="businessTechModes"><span><LotteryBallIcon gradientId="business-ball-mode" /> Sorteo con balotas</span><span><PrizeWheelIcon /> Ruleta personalizable</span></div>
          <small>Incluido en Premium con {plans.premium.liveDrawTools?.annualQuota} usos al año y Empresarial con {plans.empresarial.liveDrawTools?.annualQuota} usos al año.</small>
        </div>
        <a className="businessTechLink" href="/sorteo-en-vivo">Ver la demo <span aria-hidden="true">↗</span></a>
        <p className="businessTechDisclosure">La demo muestra la experiencia visual; el motor verificable para sorteos reales aún requiere integración y validaciones.</p>
      </section>

      <section className="businessSocialStrip" aria-labelledby="businessSocialHeading">
        <div className="businessSocialIntro">
          <p className="portalEyebrow">MÁS ALCANCE PARA CADA RIFA</p>
          <h3 id="businessSocialHeading">Comparte la emoción en tus redes</h3>
        </div>
        <ul className="businessSocialList" aria-label="Redes para compartir las rifas">
          <li>
            <span className="businessSocialIcon facebook" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" /></svg></span>
            <span>Facebook</span>
          </li>
          <li>
            <span className="businessSocialIcon instagram" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="businessSocialDot" cx="17.7" cy="6.8" r="1" /></svg></span>
            <span>Instagram</span>
          </li>
          <li>
            <span className="businessSocialIcon xSocial" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18.9 3H22l-6.8 7.8L23.2 21h-6.3l-4.9-6.4L6.4 21H3.2l7.3-8.4L2.8 3h6.5l4.4 5.9L18.9 3Zm-1.1 16h1.7L8.3 4.9H6.5L17.8 19Z" /></svg></span>
            <span>X</span>
          </li>
          <li>
            <span className="businessSocialIcon tiktok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M15.2 3h-3.3v12.1a2.7 2.7 0 1 1-2.3-2.7v-3.4a6 6 0 1 0 5.6 6V9.2a8 8 0 0 0 4.5 1.4V7.3c-2.4-.1-4.3-1.9-4.5-4.3Z" /></svg></span>
            <span>TikTok</span>
          </li>
        </ul>
      </section>

    </section>
  );
}
