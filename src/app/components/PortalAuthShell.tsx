"use client";

import { useEffect, useState, type ReactNode } from "react";
import { raffleTerritoryNotice } from "../../lib/plans";
import BrandMark from "./BrandMark";

type Props = { audience: "client" | "business"; children: ReactNode; wideAuthPanel?: boolean; authMode?: "login" | "register"; authInline?: boolean; belowContent?: ReactNode | ((actions: { openAuth: () => void }) => ReactNode) };
type PortalInfo = { id: string; label: string; content: ReactNode };

const prizeGalleryItems = [
  { key: "phone", label: "Tecnología", detail: "Dispositivos y gadgets" },
  { key: "car", label: "Carros", detail: "Modelos para cada sueño" },
  { key: "motorcycle", label: "Motos", detail: "Aventura sobre ruedas" },
  { key: "jewelry", label: "Joyería", detail: "Detalles que brillan" },
  { key: "wearables", label: "Accesorios tech", detail: "Tecnología para llevar" },
  { key: "gifts", label: "Sorpresas", detail: "Detalles para disfrutar" },
  { key: "house", label: "Casas", detail: "Espacios para nuevos comienzos" },
  { key: "bags", label: "Bolsos", detail: "Estilo y funcionalidad" },
  { key: "shoes", label: "Calzado", detail: "Opciones para cada paso" },
  { key: "home", label: "Hogar", detail: "Muebles y decoración" },
  { key: "travel", label: "Viajes", detail: "Experiencias para recordar" },
  { key: "bicycle", label: "Bicicletas", detail: "Aventura al aire libre" },
  { key: "watch", label: "Relojes de alta gama", detail: "Diseño y precisión" },
  { key: "dresses", label: "Vestidos de dama", detail: "Estilo para cada ocasión" },
  { key: "womenShoes", label: "Zapatos y sandalias", detail: "Moda femenina" },
  { key: "eyewear", label: "Gafas dama y hombre", detail: "Estilo para todos" },
] as const;

const portalInfoItems: PortalInfo[] = [
  {
    id: "about",
    label: "Quiénes somos",
    content: <p>El Ganador es una marca y solución digital desarrollada por Solvio, empresa creadora de software. Diseñamos tecnología para conectar personas y negocios, abrir oportunidades y ofrecer alternativas que respondan a necesidades reales.</p>,
  },
  {
    id: "mission",
    label: "Misión",
    content: <p>Desarrollar tecnología innovadora y de pensamiento libre que conecte personas, empresas y oportunidades, y ayude a resolver desafíos mediante soluciones de software útiles y accesibles.</p>,
  },
  {
    id: "vision",
    label: "Visión",
    content: <p>Construir tecnología con propósito, capaz de abrir nuevos caminos y acercarnos a un futuro más conectado, dinámico y lleno de posibilidades.</p>,
  },
  {
    id: "terms",
    label: "Términos y condiciones",
    content: <>
      <p>Este borrador explica las reglas de uso de El Ganador para clientes y negocios: registro con información veraz, cuidado de las cuentas, publicación responsable de contenidos, condiciones de participación, atención de reclamaciones y medidas ante usos fraudulentos.</p>
      <h3>Marco normativo de las rifas</h3>
      <p>Este resumen identifica las principales normas aplicables a las rifas en Colombia. Debe leerse junto con sus modificaciones y con las instrucciones de la autoridad competente:</p>
      <ul className="premiumLegalSourceList">
        <li><a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=4168" target="_blank" rel="noreferrer">Ley 643 de 2001, especialmente artículos 27 a 30 ↗</a></li>
        <li><a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=72893" target="_blank" rel="noreferrer">Decreto 1068 de 2015, régimen reglamentario de rifas ↗</a></li>
        <li><a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=256696" target="_blank" rel="noreferrer">Decreto 1486 de 2024, que actualiza reglas para gestores, operadores y rifas sistematizadas ↗</a></li>
        <li><a href="https://www.coljuegos.gov.co/documentos/200334/normatividad/" target="_blank" rel="noreferrer">Acuerdo CNJSA 821 de 2025 y documentos técnicos oficiales para rifas ↗</a></li>
        <li><a href="https://www.coljuegos.gov.co/publicaciones/307293/conozca-resolucion-no-20260005674-por-la-cual-se-modifica-la-resolucion-no-20250018494-del-22-de-agosto-de-2025-por-medio-de-la-cual-se-fijan/" target="_blank" rel="noreferrer">Resolución 20260005674 de 2026, requisitos para operadores tecnológicos ↗</a></li>
      </ul>
      <h3>Autoridad competente y autorización</h3>
      <p>{raffleTerritoryNotice}</p>
      <p>La Ley 643 de 2001 y el Decreto 1486 de 2024 exigen que la persona gestora registre cada rifa ante un operador autorizado para el trámite de aprobación. Un plan comercial o una cuenta de negocio no reemplazan estos requisitos.</p>
      <p>El Decreto 1486 de 2024 prohíbe las rifas permanentes y define ese carácter como realizar rifas en más de dos fechas al mes por gestor. El límite regulatorio de fechas de sorteo aplica con independencia del número de espacios o rifas simultáneas que ofrezca un plan.</p>
      <h3>Planes, comisiones y derechos de explotación</h3>
      <p>Los precios y la comisión de plataforma son condiciones comerciales del software, no licencias regulatorias. La Ley 643 de 2001 y el Decreto 1486 de 2024 establecen derechos de explotación del 14% de los ingresos brutos: al autorizarse la rifa se calculan sobre el 100% del valor de las boletas emitidas y, después del sorteo, se ajustan al valor de la boletería vendida. Estos derechos, garantías y demás obligaciones legales son distintos de la comisión de plataforma.</p>
      <p>El prototipo actual no procesa pagos ni realiza rifas reales. Las fichas de rifas reales deberán mostrar los datos de autorización que correspondan. Estas condiciones deben revisarse con asesoría jurídica antes de publicarse como contrato definitivo.</p>
      <a href="https://www.coljuegos.gov.co/publicaciones/300638" target="_blank" rel="noreferrer">Consultar competencias y trámites oficiales de rifas ↗</a>
      <div className="premiumInfoNotice"><b>Documento preliminar.</b> Debe revisarse y completarse antes de publicarse como contrato o solicitar la aceptación de usuarios.</div>
    </>,
  },
  {
    id: "privacy",
    label: "Privacidad y datos personales",
    content: <>
      <p>Esta sección debe explicar quién es responsable del tratamiento, qué datos se recopilan, para qué se utilizan, durante cuánto tiempo se conservan y si se comparten con proveedores necesarios para el servicio.</p>
      <h3>Derechos y consultas</h3>
      <p>La política definitiva deberá indicar los canales para solicitar acceso, actualización, corrección o supresión de datos, así como la forma de revocar autorizaciones cuando corresponda.</p>
      <div className="premiumInfoNotice"><b>Versión preliminar:</b> la demo aún no publica una política completa. Solvio debe completar sus datos de contacto, finalidades, proveedores, plazos y procedimientos antes de recopilar información real.</div>
    </>,
  },
  {
    id: "verification",
    label: "Verificación de datos",
    content: <>
      <p>Para revisar una cuenta de negocio, podemos solicitar documentos que acrediten la identidad del titular y los datos del local. Los requisitos pueden variar entre persona natural y persona jurídica; por ejemplo, identificación, RUT/NIT y documentos de existencia o representación cuando correspondan.</p>
      <h3>Uso y revisión de documentos</h3>
      <p>Los documentos enviados no forman parte del perfil público. En esta demostración quedan privados y pendientes de revisión manual; no existe conexión automática de verificación con Coljuegos ni con otras autoridades.</p>
      <p>Antes de operar, Solvio deberá publicar una política de tratamiento de datos completa que identifique al responsable, finalidades, canales de consulta, derechos de los titulares y plazos de conservación aplicables.</p>
      <div className="premiumInfoNotice"><b>Importante:</b> esta explicación describe la demo y no sustituye una política de privacidad ni una validación legal definitiva.</div>
    </>,
  },
];

export default function PortalAuthShell({ audience, children, wideAuthPanel = false, authMode = "register", authInline = false, belowContent }: Props) {
  const business = audience === "business";
  const [activeInfo, setActiveInfo] = useState<PortalInfo | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const hasPlans = Boolean(belowContent);
  const renderedBelowContent = typeof belowContent === "function"
    ? belowContent({ openAuth: () => authInline ? document.getElementById("registro-empresa")?.scrollIntoView({ behavior: "smooth", block: "start" }) : setAuthOpen(true) })
    : belowContent;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("auth") === "1") {
      setAuthOpen(true);
      url.searchParams.delete("auth");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    if (!activeInfo && !authOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveInfo(null);
        setAuthOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeInfo, authOpen]);

  return (
    <main className={`premiumEntry ${business ? "businessEntry" : "customerEntry"} ${wideAuthPanel ? "businessRegisterEntry" : ""}`}>
      <header className="premiumEntryHeader">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a className="premiumBrand" href="/" aria-label="El Ganador, inicio">EL GANADOR</a>
          <span style={{ fontSize: "8.5px", padding: "2px 6px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "6px", color: "#6ee7b7", fontWeight: "900", letterSpacing: "0.5px" }}>OFICIAL</span>
        </div>
        <nav className="premiumMainNav" aria-label="Navegación principal">
          <a href="/">← Explorar sorteos</a>
          <a href="/sorteo-en-vivo">🔴 Sorteos en vivo</a>
          <a href="/verificar">🛡️ Verificador</a>
          <a href="#como-funciona">Cómo participar</a>
          <a href={hasPlans ? "#planes" : "/admin?mode=register#planes"}>Para negocios</a>
        </nav>
        <a href="/" className="premiumMobileBackLink">
          ← Volver al Feed
        </a>
        {authInline
          ? <nav className="premiumEntryAuthLinks" aria-label="Registro e ingreso">
              <a href={business ? "/ingreso?mode=register&role=business#planes" : "/ingreso?mode=register"}>Regístrate</a>
              <span aria-hidden="true">/</span>
              <a href={business ? "/ingreso?mode=login&role=business" : "/ingreso?mode=login"}>Inicia sesión</a>
            </nav>
          : <nav className="premiumEntryAuthLinks" aria-label="Registro e ingreso">
              <a href={business ? (authMode === "register" ? "#planes" : "/ingreso?mode=register&role=business#planes") : "/ingreso?mode=register"}>Regístrate</a>
              <span aria-hidden="true">/</span>
              <a href={business ? "/ingreso?mode=login&role=business" : "/ingreso?mode=login"}>Inicia sesión</a>
            </nav>}
      </header>

      <section className="premiumHeadline">
        <span className="premiumStoryBadge premiumHeadlineBadge"><span aria-hidden="true">✦</span> {business ? "TU NEGOCIO, EN EL CENTRO" : "UN MERCADO DE POSIBILIDADES"}</span>
        <h1>{business ? <>Haz crecer tu local.<em> Comparte la emoción.</em></> : <>Descubre tu próxima <em>oportunidad de ganar.</em></>}</h1>
        <p>{business ? "Un espacio sencillo para presentar tus premios, conectar con clientes y seguir cada rifa." : "Regístrate gratis para explorar premios, conocer tiendas y consultar tus participaciones cuando quieras."}</p>
      </section>

      <div className={`premiumEntryGrid ${authInline ? "hasInlineAuth" : ""}`}>
        <section className="premiumStory">
          <div className="premiumStoryContent">
            <div className="premiumLogoBand">
              <div className="premiumLogoStage">
                <div className="premiumStageHalo" />
                <BrandMark className="premiumHeroLogo" />
                <span className="premiumSpark premiumSparkOne">✦</span>
                <span className="premiumSpark premiumSparkTwo">✧</span>
              </div>
            </div>

            {!authInline && (
              <>
            <div className="premiumGalleryDivider" aria-hidden="true" />
            <section className="premiumPrizeGallery" aria-labelledby="premiumPrizeGalleryHeading">
              <header className="premiumPrizeGalleryHeader">
                <p className="premiumPurposeEyebrow">DESCUBRE NUEVOS PREMIOS</p>
                <h2 id="premiumPrizeGalleryHeading">La emoción siempre trae algo nuevo</h2>
                <p>Tecnología, vehículos, joyería, accesorios y muchas más sorpresas.</p>
              </header>
              <div className="premiumPrizeMarquee" role="region" aria-label="Galería animada de premios ilustrativos">
                <div className="premiumPrizeTrack">
                  {[0, 1].map((copy) => (
                    <div className="premiumPrizeGroup" key={copy} aria-hidden={copy === 1}>
                      {prizeGalleryItems.map((item) => (
                        <article className="premiumPrizeCard" key={item.key}>
                          <div className={`premiumPrizePhoto premiumPrizePhoto--${item.key}`} role="img" aria-label={`${item.label}, imagen ilustrativa`} />
                          <div className="premiumPrizeCaption"><b>{item.label}</b><span>{item.detail}</span></div>
                        </article>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <p className="premiumPrizeGalleryNote">Imágenes ilustrativas. Consulta los premios disponibles en cada rifa.</p>
            </section>
              </>
            )}

            <div className="premiumPerks" id="como-funciona">
              <div><span>01</span><b>{business ? "Publica" : "Regístrate"}</b><small>{business ? "Tu primera rifa" : "Crea tu cuenta"}</small></div>
              <div><span>02</span><b>{business ? "Conecta" : "Explora"}</b><small>{business ? "Con nuevos clientes" : "Tiendas y premios"}</small></div>
              <div><span>03</span><b>{business ? "Crece" : "Participa"}</b><small>{business ? "Desde tu panel" : "Con tu cartón digital"}</small></div>
            </div>



          </div>
        </section>

        {authInline && business && authMode === "register" && renderedBelowContent && <div className="premiumEntryBelow premiumPreAuthPlans" id="planes">{renderedBelowContent}</div>}
        {authInline && <section className="premiumAuthPanel premiumInlinePanel"><div className="premiumAuthPanelInner">{children}</div></section>}
      </div>

      {renderedBelowContent && !(authInline && business && authMode === "register") && <div className="premiumEntryBelow" id={hasPlans ? "planes" : undefined}>{renderedBelowContent}</div>}

      <section className="premiumAbout" id="sobre-el-ganador" aria-labelledby="premiumAboutHeading">
        <header className="premiumAboutHeader">
          <p className="premiumPurposeEyebrow">SOLVIO · EMPRESA MATRIZ</p>
          <h2 id="premiumAboutHeading">Quiénes somos</h2>
          <p className="premiumAboutTagline">Tecnología para conectar ideas y oportunidades</p>
          <p>El Ganador es una marca y solución digital desarrollada por Solvio, una empresa de tecnología que transforma ideas en software para conectar personas, impulsar negocios y crear nuevas oportunidades. Trabajamos con innovación, creatividad y pensamiento libre para resolver desafíos y acercarnos a un futuro más conectado.</p>
        </header>
        <div className="premiumAboutColumns">
          <article><h3>Misión</h3><p>Desarrollar tecnología innovadora que conecte personas, empresas y oportunidades, y que ayude a resolver desafíos con soluciones de software útiles y accesibles.</p></article>
          <article><h3>Visión</h3><p>Construir tecnología con propósito, capaz de abrir nuevos caminos y acercarnos a un futuro más conectado, dinámico y lleno de posibilidades.</p></article>
        </div>
      </section>

      <nav className="premiumLegalStrip" id="informacion-legal" aria-label="Información legal">
        <span className="premiumLegalLabel">Información legal</span>
        <div>
          {portalInfoItems.filter((item) => ["terms", "privacy", "verification"].includes(item.id)).map((item) => (
            <button key={item.id} type="button" className="premiumLegalLink" onClick={() => setActiveInfo(item)} aria-haspopup="dialog">{item.label}<b aria-hidden="true">↗</b></button>
          ))}
        </div>
      </nav>

      {activeInfo && (
        <div className="premiumInfoBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveInfo(null); }}>
          <section className="premiumInfoDialog" role="dialog" aria-modal="true" aria-labelledby={`premiumInfoTitle-${activeInfo.id}`}>
            <button className="premiumInfoClose" type="button" autoFocus aria-label={`Cerrar ${activeInfo.label}`} onClick={() => setActiveInfo(null)}>×</button>
            <p className="premiumPurposeEyebrow">SOLVIO · EL GANADOR</p>
            <h2 id={`premiumInfoTitle-${activeInfo.id}`}>{activeInfo.label}</h2>
            <div className="premiumInfoContent">{activeInfo.content}</div>
          </section>
        </div>
      )}

      {!authInline && authOpen && (
        <div className="premiumAuthBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
          <section className={`premiumAuthDialog ${wideAuthPanel ? "isBusinessRegister" : ""}`} role="dialog" aria-modal="true" aria-labelledby="premiumAuthDialogTitle">
            <button className="premiumInfoClose" type="button" autoFocus aria-label="Cerrar registro" onClick={() => setAuthOpen(false)}>×</button>
            <p className="premiumPurposeEyebrow">EL GANADOR · {business ? "PORTAL PARA NEGOCIOS" : "TU CUENTA"}</p>
            <h2 id="premiumAuthDialogTitle">Acceso a El Ganador</h2>
            <div className="premiumAuthPanel premiumModalAuthPanel">
              <div className="premiumAuthPanelInner">
                {children}
                <div className="premiumSecurityLine"><span>◈</span> Acceso protegido <i /> Experiencia adaptable a móvil y escritorio</div>
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className="premiumEntryFooter">
        <span>EL GANADOR</span>
        <span>Un punto de encuentro para tiendas, premios y personas.</span>
        <nav className="premiumFooterLinks" aria-label="Información institucional">
          <a href="#sobre-el-ganador">Solvio</a>
          <a href="#informacion-legal">Legal</a>
        </nav>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
