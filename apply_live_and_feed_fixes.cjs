const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let code = fs.readFileSync(pageFile, 'utf8');

// =============================================================================
// 1. SALAS DE SORTEO EN VIVO: REMOVER BOTÓN COMPRAR Y PONER VENTA CERRADA
// =============================================================================
const oldLiveActions = `<div className="liveRoomActions">
                          <a
                            href={\`/sorteo-en-vivo?draw=\${encodeURIComponent(d.id)}\`}
                            className="btnEnterRoom"
                          >
                            🔴 Entrar a Sala {index + 1} →
                          </a>
                          <button
                            type="button"
                            className="btnQuickBuy"
                            onClick={() => openDraw(d)}
                            title="Ver cartón y comprar números"
                          >
                            🎟️ Comprar
                          </button>
                        </div>`;

const newLiveActions = `<div className="liveRoomActions liveOnlyActions">
                          <div className="liveGameStatusNotice">
                            <span className="liveGameLockIcon">🔒</span>
                            <span className="liveGameLockText">Balota en Juego · Venta Cerrada</span>
                          </div>
                          <a
                            href={\`/sorteo-en-vivo?draw=\${encodeURIComponent(d.id)}\`}
                            className="btnEnterRoomMaster"
                            title="Ingresar a la sala 3D oficial en vivo como espectador"
                          >
                            🔴 Entrar a Sala {index + 1} en Vivo (Espectador) →
                          </a>
                        </div>`;

code = code.replace(oldLiveActions, newLiveActions);

// Update liveRoomSpecs in multipleLiveRoomsSection
code = code.replace(
  `<strong>{progress(d)}% vendido</strong>`,
  `<strong style={{ color: "#ef4444" }}>🔒 Venta Cerrada</strong>`
);

// Update DrawCard when draw.live is true
const oldDrawCardCta = `<div className="igShoppableBanner">
        <button
          type="button"
          className={\`igShopCtaButton \${draw.live ? "liveRoomCta" : ""}\`}
          onClick={() => onOpen(draw)}
          title="Toca para apartar tu número"
        >
          <div className="igCtaPriceSide">
            <span className="igCtaPriceLabel">VALOR BOLETA</span>
            <strong className="igCtaPriceValue">💰 {money(draw.unit_price)} <small>COP</small></strong>
          </div>
          <div className="igCtaButtonSide">
            <span className="igCtaActionText">
              {draw.live ? "🔴 Entrar a Sala 3D" : "🎟️ Apartar Número"}
            </span>
            <span className="igCtaArrow">→</span>
          </div>
        </button>
      </div>`;

const newDrawCardCta = `<div className="igShoppableBanner">
        {draw.live ? (
          <a
            href={\`/sorteo-en-vivo?draw=\${encodeURIComponent(draw.id)}\`}
            className="igShopCtaButton liveRoomCta"
            style={{ textDecoration: "none" }}
            title="Sorteo en vivo con balota en juego: ingresar como espectador"
          >
            <div className="igCtaPriceSide" style={{ background: "rgba(220, 38, 38, 0.22)" }}>
              <span className="igCtaPriceLabel" style={{ color: "#fca5a5" }}>BALOTA EN JUEGO</span>
              <strong className="igCtaPriceValue" style={{ color: "#ef4444" }}>🔒 VENTA CERRADA</strong>
            </div>
            <div className="igCtaButtonSide" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
              <span className="igCtaActionText">🔴 Entrar a Sala 3D (Espectador)</span>
              <span className="igCtaArrow">→</span>
            </div>
          </a>
        ) : (
          <button
            type="button"
            className="igShopCtaButton"
            onClick={() => onOpen(draw)}
            title="Toca para apartar tu número"
          >
            <div className="igCtaPriceSide">
              <span className="igCtaPriceLabel">VALOR BOLETA</span>
              <strong className="igCtaPriceValue">💰 {money(draw.unit_price)} <small>COP</small></strong>
            </div>
            <div className="igCtaButtonSide">
              <span className="igCtaActionText">🎟️ Apartar Número</span>
              <span className="igCtaArrow">→</span>
            </div>
          </button>
        )}
      </div>`;

code = code.replace(oldDrawCardCta, newDrawCardCta);

// =============================================================================
// 2. NEWSPOSTMEDIA: QUITAR ONTOUCHSTART / ONTOUCHEND QUE BLOQUEAN EL DESLIZAR
// =============================================================================
const oldMediaTouch = `  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        setActiveIdx((prev) => (prev + 1) % images.length);
      } else {
        setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
  };`;

code = code.replace(oldMediaTouch, '// Touch swipe delegado al scroll horizontal nativo de la pasarela');
code = code.replace('onTouchStart={handleTouchStart}\n        onTouchEnd={handleTouchEnd}', '');
code = code.replace('const touchStartX = useRef<number | null>(null);', '');

// =============================================================================
// 3. NEWSFEED: AÑADIR FLECHAS DE NAVEGACIÓN Y REF PARA DESLIZAR FLUIDO
// =============================================================================
const oldNewsFeedDef = `function NewsFeed({ onBusiness, onOpenPublish }: { onBusiness: (name: string) => void; onOpenPublish?: (tab?: "raffle" | "story") => void }) {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);`;

const newNewsFeedDef = `function NewsFeed({ onBusiness, onOpenPublish }: { onBusiness: (name: string) => void; onOpenPublish?: (tab?: "raffle" | "story") => void }) {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const feedRailRef = useRef<HTMLDivElement | null>(null);
  const [currentPostIdx, setCurrentPostIdx] = useState(0);

  const scrollFeed = (direction: "left" | "right") => {
    if (!feedRailRef.current) return;
    const scrollAmount = feedRailRef.current.clientWidth || 360;
    feedRailRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  const handleFeedScroll = () => {
    if (!feedRailRef.current) return;
    const scrollLeft = feedRailRef.current.scrollLeft;
    const width = feedRailRef.current.clientWidth || 1;
    const idx = Math.round(scrollLeft / width);
    setCurrentPostIdx(idx);
  };`;

code = code.replace(oldNewsFeedDef, newNewsFeedDef);

// Update NewsFeed Header bar to include feed navigation buttons and post counter
const oldNewsHeaderBar = `<div className="compactBarMeta">
            <span className="compactEyebrow" style={{ color: "#34d399" }}>📰 COMERCIOS</span>
            <span className="compactBadge">📸 Novedades & Entregas</span>
          </div>`;

const newNewsHeaderBar = `<div className="compactBarMeta">
            <span className="compactEyebrow" style={{ color: "#34d399" }}>📰 COMERCIOS</span>
            <span className="compactBadge">📸 {posts.length > 0 ? \`Publicación \${currentPostIdx + 1} de \${posts.length}\` : "Novedades"}</span>
            <span className="mobilePasarelaBadge">👉 Desliza a los lados</span>
          </div>`;

code = code.replace(oldNewsHeaderBar, newNewsHeaderBar);

// Add navigation buttons in compactBarRight of Feed Comercios
const oldBarRight = `<div className="compactBarRight" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {onOpenPublish && (`;

const newBarRight = `<div className="compactBarRight" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <div className="pasarelaNavButtonsRow">
            <button
              type="button"
              className="btnFeedNav"
              onClick={() => scrollFeed("left")}
              aria-label="Publicación anterior"
              title="Anterior publicación"
            >
              ‹
            </button>
            <button
              type="button"
              className="btnFeedNav"
              onClick={() => scrollFeed("right")}
              aria-label="Siguiente publicación"
              title="Siguiente publicación"
            >
              ›
            </button>
          </div>
          {onOpenPublish && (`;

code = code.replace(oldBarRight, newBarRight);

// Attach ref and onScroll to newsGrid
code = code.replace(
  '<div className="newsGrid">',
  '<div className="newsGrid" ref={feedRailRef} onScroll={handleFeedScroll}>'
);

fs.writeFileSync(pageFile, code, 'utf8');
console.log("Updated app/page.tsx with live room lock & feed slider improvements!");

// =============================================================================
// 4. GLOBALS.CSS: CSS PARA SCROLL-SNAP MANDATORY Y CONTROLES DEL FEED
// =============================================================================
const cssFile = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssFile, 'utf8');

const additionalCss = `

/* =============================================================================
   MEJORAS PASARELA FEED DE COMERCIOS & BLOQUEO COMPRA EN VIVO
   ============================================================================= */
.newsGrid {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scroll-snap-type: x mandatory !important;
  scroll-behavior: smooth !important;
  -webkit-overflow-scrolling: touch !important;
  gap: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  width: 100vw !important;
  max-width: 100vw !important;
  scrollbar-width: none !important;
  touch-action: pan-x pan-y !important;
}

.newsGrid::-webkit-scrollbar {
  display: none !important;
}

.newsSocialPostCard {
  flex: 0 0 100vw !important;
  width: 100vw !important;
  min-width: 100vw !important;
  max-width: 100vw !important;
  scroll-snap-align: start !important;
  scroll-snap-stop: always !important;
  box-sizing: border-box !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  margin: 0 !important;
  touch-action: pan-x pan-y !important;
}

.newsSlideViewport {
  touch-action: manipulation !important;
}

/* Botones de navegación en barra compacta de Feed Comercios */
.pasarelaNavButtonsRow {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.btnFeedNav {
  width: 26px !important;
  height: 26px !important;
  border-radius: 6px !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  padding: 0 0 2px 0 !important;
}

.btnFeedNav:hover {
  background: rgba(16, 185, 129, 0.25) !important;
  border-color: rgba(16, 185, 129, 0.5) !important;
  color: #34d399 !important;
}

/* Salas de Sorteo en Vivo - Bloqueo de compra y aviso notarial */
.liveOnlyActions {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  width: 100% !important;
}

.liveGameStatusNotice {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  background: rgba(239, 68, 68, 0.12) !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
  border-radius: 8px !important;
  padding: 6px 10px !important;
  color: #f87171 !important;
  font-size: 11.5px !important;
  font-weight: 800 !important;
}

.btnEnterRoomMaster {
  width: 100% !important;
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%) !important;
  color: #ffffff !important;
  padding: 10px 14px !important;
  border-radius: 10px !important;
  font-size: 13px !important;
  font-weight: 800 !important;
  text-decoration: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4) !important;
  transition: transform 0.2s ease !important;
}

.btnEnterRoomMaster:hover {
  transform: scale(1.02) !important;
}
`;

fs.writeFileSync(cssFile, css + additionalCss, 'utf8');
console.log("Appended feed and live styles to globals.css");
