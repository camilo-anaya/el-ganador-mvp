const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let page = fs.readFileSync(pageFile, 'utf8');

// 1. REEMPLAZAR ClosingSoonDrawCard COMPLETO con botón de compra que tiene el precio y acción juntos
const closingSoonTargetStart = 'function ClosingSoonDrawCard({ draw, onOpen, onBusiness, occupied, progress }: {';
const closingSoonTargetEnd = 'function DrawCard({ draw, isFollowing, onFollow, onOpen, onBusiness, occupied, progress, isUpcoming }: {';

const idxCSStart = page.indexOf(closingSoonTargetStart);
const idxCSEnd = page.indexOf(closingSoonTargetEnd);

if (idxCSStart === -1 || idxCSEnd === -1) {
  console.error("ERROR: No se encontró ClosingSoonDrawCard o DrawCard");
  process.exit(1);
}

const newClosingSoonDrawCard = `function ClosingSoonDrawCard({ draw, onOpen, onBusiness, occupied, progress }: {
  draw: Draw;
  onOpen: (draw: Draw) => void;
  onBusiness: (admin: string) => void;
  occupied: (draw: Draw) => number;
  progress: (draw: Draw) => number;
}) {
  const closingInfo = getClosingTime(draw.id);
  const rawClock = closingInfo.split("·")[1]?.trim() || "Cierra hoy";
  const match = rawClock.match(/(\\d\\dh\\s*\\d\\dm)/);
  const closingClock = match ? \`Cierra en \${match[1]}\` : rawClock.replace("Cierra venta en", "Cierra").replace("Cierra venta", "Cierra hoy");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(draw.followers || 2180);
  const [copied, setCopied] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1));
  };

  const triggerDoubleTapHeart = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  const shareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = \`\${window.location.origin}/?draw=\${draw.id}\`;
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
        }
      } catch {}
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const cityLabel = draw.business_city
    ? (draw.business_city.toLowerCase().includes("colombia") ? draw.business_city : \`\${draw.business_city}, Colombia\`)
    : "Colombia";

  const cleanDescription = useMemo(() => {
    const raw = draw.description || "Últimas boletas disponibles antes del cierre de venta oficial ante notario público de Colombia.";
    if (raw.toLowerCase().startsWith(draw.title.toLowerCase())) {
      return raw.slice(draw.title.length).replace(/^[\\s—\\-:.,]+/, "").trim();
    }
    return raw;
  }, [draw.description, draw.title]);

  return (
    <article className="igSocialPostCard closingSoonCard3D">
      {/* 1. HEADER: AUTOR Y TEMPORIZADOR DE CIERRE 100% VISIBLE */}
      <header className="igPostHeader">
        <div className="igHeaderAuthor" onClick={() => onBusiness(draw.admin)}>
          <div className="igAvatarRing urgent">
            <span className="igAvatarInner">
              {draw.business_photo_url ? (
                <img src={draw.business_photo_url} alt={draw.admin} className="igAvatarImg" />
              ) : (
                <span className="igAvatarEmoji">{draw.emoji || "🔥"}</span>
              )}
            </span>
          </div>
          <div className="igAuthorMeta">
            <div className="igAuthorRow">
              <strong className="igAuthorName">{draw.admin}</strong>
              <span className="igVerifiedBadge urgent" title="Comercio Verificado ante Notaría">✓</span>
            </div>
            <div className="igSubtitleRow">
              <span className="igLocationText">📍 {cityLabel}</span>
              <span className="igDot">•</span>
              <span className="igLegalPill">🛡️ Ley 643</span>
            </div>
          </div>
        </div>

        <div className="igHeaderRight">
          <span className="igStatusPill urgent" title={\`Cierre oficial: \${closingInfo}\`}>
            <span className="instaLivePulseDot" /> ⚡ {closingClock}
          </span>
        </div>
      </header>

      {/* 2. MEDIA HERO PANTALLA COMPLETA BORDE A BORDE */}
      <div 
        className="igPostMedia"
        onClick={() => onOpen(draw)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          triggerDoubleTapHeart();
        }}
      >
        <img src={getDrawImage(draw)} alt={draw.title} loading="lazy" />
        
        {/* Double-tap Heart Pop Animation */}
        {showHeartAnim && (
          <div className="igBigHeartPulse">
            ❤️
          </div>
        )}
      </div>

      {/* 3. BARRA DE COMPRA DIRECTA: PRECIO DE BOLETA + BOTÓN APARTAR NÚMERO JUNTOS */}
      <div className="igShoppableBanner">
        <button
          type="button"
          className="igShopCtaButton urgent"
          onClick={() => onOpen(draw)}
          title="Toca para apartar tu número"
        >
          <div className="igCtaPriceSide">
            <span className="igCtaPriceLabel">VALOR BOLETA</span>
            <strong className="igCtaPriceValue">💰 {money(draw.unit_price)} <small>COP</small></strong>
          </div>
          <div className="igCtaButtonSide">
            <span className="igCtaActionText">⚡ Apartar Número</span>
            <span className="igCtaArrow">→</span>
          </div>
        </button>
      </div>

      {/* 4. ACTION BAR: SOLO LIKES Y COMPARTIR LINK */}
      <div className="igActionBar">
        <div className="igActionGroupLeft">
          <button
            type="button"
            className={\`igActionIconBtn igLikeBtnOnly \${liked ? "isLiked" : ""}\`}
            onClick={toggleLike}
            title={liked ? "Ya no me gusta" : "Me gusta"}
          >
            <svg viewBox="0 0 24 24" className="igSvgIcon" fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "currentColor"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="igLikeText">{liked ? "Te gusta" : "Me gusta"}</span>
          </button>
        </div>

        <div className="igActionGroupRight">
          <button
            type="button"
            className={\`igActionSharePill \${copied ? "isCopied" : ""}\`}
            onClick={shareLink}
            title="Copiar enlace oficial del sorteo"
          >
            <svg viewBox="0 0 24 24" className="igShareSvg" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>{copied ? "✓ ¡Enlace copiado!" : "Compartir Link"}</span>
          </button>
        </div>
      </div>

      {/* 5. SOCIAL PROOF / LIKES ROW */}
      <div className="igLikesRow">
        <div className="igLikesAvatarStack">
          <span className="igMiniAv">👤</span>
          <span className="igMiniAv">👤</span>
        </div>
        <span className="igLikesText">
          Les gusta a <strong>andres_s</strong> y <strong>{count(likeCount)} personas más</strong>
        </span>
      </div>

      {/* 6. CAPTION ROW: SIN HASHTAGS */}
      <div className="igCaptionRow">
        <p className="igCaptionText">
          <strong className="igCaptionAuthor" onClick={() => onBusiness(draw.admin)}>{draw.admin}</strong>
          {" "}
          <span className="igCaptionTitle">{draw.title}</span>
          {" — "}
          <span className="igCaptionDesc">
            {isExpanded ? cleanDescription : (
              <>
                {cleanDescription.slice(0, 95)}
                {cleanDescription.length > 95 && (
                  <button type="button" className="igMoreBtn" onClick={() => setIsExpanded(true)}>
                    ... más
                  </button>
                )}
              </>
            )}
          </span>
        </p>
      </div>

      {/* 7. PROGRESS TRACK */}
      <div className="igProgressBox">
        <div className="igProgressTextRow">
          <span>🎟️ <b>{count(draw.available)}</b> boletas restantes</span>
          <span className="igProgressPct urgent">{progress(draw)}% vendido</span>
        </div>
        <div className="igProgressTrack">
          <div 
            className="igProgressBar urgent" 
            style={{ width: \`\${progress(draw)}%\` }} 
          />
        </div>
      </div>

      {/* 8. TIMESTAMP & REGULATORY SUBTITLE */}
      <footer className="igPostFooter">
        <time className="igTimestamp">HACE 12 MINUTOS · BOGOTÁ, COLOMBIA · LEY 643 DE 2001</time>
      </footer>
    </article>
  );
}

`;

// 2. REEMPLAZAR DrawCard COMPLETO con botón de compra unificado con precio
const drawCardTargetEnd = 'function NewsPostMedia({ post }: { post: PublicPost }) {';
const idxDCEnd = page.indexOf(drawCardTargetEnd);

if (idxDCEnd === -1) {
  console.error("ERROR: No se encontró NewsPostMedia");
  process.exit(1);
}

const newDrawCard = `function DrawCard({ draw, isFollowing, onFollow, onOpen, onBusiness, occupied, progress, isUpcoming }: {
  draw: Draw;
  isFollowing: boolean;
  onFollow: (admin: string) => void;
  onOpen: (draw: Draw) => void;
  onBusiness: (admin: string) => void;
  occupied: (draw: Draw) => number;
  progress: (draw: Draw) => number;
  isUpcoming?: boolean;
}) {
  const [liked, setLiked] = useState(isFollowing);
  const [likeCount, setLikeCount] = useState(draw.followers || 1420);
  const [copied, setCopied] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1));
    onFollow(draw.admin);
  };

  const triggerDoubleTapHeart = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
      onFollow(draw.admin);
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  const shareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = \`\${window.location.origin}/?draw=\${draw.id}\`;
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
        }
      } catch {}
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const territory = describeRaffleTerritory(draw);
  const cityLabel = draw.business_city
    ? (draw.business_city.toLowerCase().includes("colombia") ? draw.business_city : \`\${draw.business_city}, Colombia\`)
    : "Colombia";

  const cleanDescription = useMemo(() => {
    const raw = draw.description || "Participa por este espectacular premio certificado con transmisión y balotas notariales.";
    if (raw.toLowerCase().startsWith(draw.title.toLowerCase())) {
      return raw.slice(draw.title.length).replace(/^[\\s—\\-:.,]+/, "").trim();
    }
    return raw;
  }, [draw.description, draw.title]);

  return (
    <article className={\`igSocialPostCard \${isUpcoming ? "upcomingProductCard" : "darkBroadcastCard"}\`}>
      {/* 1. HEADER: AUTOR Y ESTADO */}
      <header className="igPostHeader">
        <div className="igHeaderAuthor" onClick={() => onBusiness(draw.admin)}>
          <div className="igAvatarRing">
            <span className="igAvatarInner">
              {draw.business_photo_url ? (
                <img src={draw.business_photo_url} alt={draw.admin} className="igAvatarImg" />
              ) : (
                <span className="igAvatarEmoji">{draw.emoji || "🏪"}</span>
              )}
            </span>
          </div>
          <div className="igAuthorMeta">
            <div className="igAuthorRow">
              <strong className="igAuthorName">{draw.admin}</strong>
              <span className="igVerifiedBadge" title="Comercio Verificado ante Notaría">✓</span>
            </div>
            <div className="igSubtitleRow">
              <span className="igLocationText">📍 {cityLabel}</span>
              <span className="igDot">•</span>
              <span className="igLegalPill">{territory.label}</span>
            </div>
          </div>
        </div>

        <div className="igHeaderRight">
          {draw.live ? (
            <span className="igStatusPill live">
              <span className="instaLivePulseDot" /> EN VIVO
            </span>
          ) : isUpcoming ? (
            <span className="igStatusPill upcoming">📅 PRÓXIMO</span>
          ) : (
            <span className="igStatusPill today">⚡ JUEGA HOY</span>
          )}
        </div>
      </header>

      {/* 2. MEDIA HERO PANTALLA COMPLETA BORDE A BORDE */}
      <div 
        className="igPostMedia"
        onClick={() => onOpen(draw)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          triggerDoubleTapHeart();
        }}
      >
        <img src={getDrawImage(draw)} alt={draw.title} loading="lazy" />
        
        {/* Double-tap Heart Pop Animation */}
        {showHeartAnim && (
          <div className="igBigHeartPulse">
            ❤️
          </div>
        )}
      </div>

      {/* 3. BARRA DE COMPRA DIRECTA: PRECIO DE BOLETA + BOTÓN APARTAR NÚMERO JUNTOS */}
      <div className="igShoppableBanner">
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
      </div>

      {/* 4. ACTION BAR: SOLO LIKES Y COMPARTIR LINK */}
      <div className="igActionBar">
        <div className="igActionGroupLeft">
          <button
            type="button"
            className={\`igActionIconBtn igLikeBtnOnly \${liked ? "isLiked" : ""}\`}
            onClick={toggleLike}
            title={liked ? "Ya no me gusta" : "Me gusta"}
          >
            <svg viewBox="0 0 24 24" className="igSvgIcon" fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "currentColor"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="igLikeText">{liked ? "Te gusta" : "Me gusta"}</span>
          </button>
        </div>

        <div className="igActionGroupRight">
          <button
            type="button"
            className={\`igActionSharePill \${copied ? "isCopied" : ""}\`}
            onClick={shareLink}
            title="Copiar enlace oficial del sorteo"
          >
            <svg viewBox="0 0 24 24" className="igShareSvg" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>{copied ? "✓ ¡Enlace copiado!" : "Compartir Link"}</span>
          </button>
        </div>
      </div>

      {/* 5. SOCIAL PROOF / LIKES ROW */}
      <div className="igLikesRow">
        <div className="igLikesAvatarStack">
          <span className="igMiniAv">👤</span>
          <span className="igMiniAv">👤</span>
        </div>
        <span className="igLikesText">
          Les gusta a <strong>carlos_m</strong> y <strong>{count(likeCount)} personas más</strong>
        </span>
      </div>

      {/* 6. CAPTION ROW: SIN HASHTAGS */}
      <div className="igCaptionRow">
        <p className="igCaptionText">
          <strong className="igCaptionAuthor" onClick={() => onBusiness(draw.admin)}>{draw.admin}</strong>
          {" "}
          <span className="igCaptionTitle">{draw.title}</span>
          {" — "}
          <span className="igCaptionDesc">
            {isExpanded ? cleanDescription : (
              <>
                {cleanDescription.slice(0, 95)}
                {cleanDescription.length > 95 && (
                  <button type="button" className="igMoreBtn" onClick={() => setIsExpanded(true)}>
                    ... más
                  </button>
                )}
              </>
            )}
          </span>
        </p>
      </div>

      {/* 7. PROGRESS TRACK */}
      <div className="igProgressBox">
        <div className="igProgressTextRow">
          <span>🎟️ <b>{count(occupied(draw))}</b> de <b>{count(draw.total_tickets)}</b> boletas ocupadas</span>
          <span className="igProgressPct">{progress(draw)}% vendido</span>
        </div>
        <div className="igProgressTrack">
          <div 
            className="igProgressBar" 
            style={{ width: \`\${progress(draw)}%\` }} 
          />
        </div>
      </div>

      {/* 8. TIMESTAMP & REGULATORY SUBTITLE */}
      <footer className="igPostFooter">
        <time className="igTimestamp">HACE 15 MINUTOS · BOGOTÁ, COLOMBIA · LEY 643 DE 2001</time>
      </footer>
    </article>
  );
}

`;

page = page.slice(0, idxCSStart) + newClosingSoonDrawCard + newDrawCard + page.slice(idxDCEnd);
console.log("ClosingSoonDrawCard y DrawCard reemplazados con precio integrado al botón!");

// 3. ACTUALIZAR ENCABEZADO DE A PUNTO DE COMENZAR (MÁS COMPACTO Y CON LETRAS PEQUEÑAS)
const oldClosingSoonHeader = `<section className="closingSoonSection3D">
              <div className="closingSoonHeader3D">
                <div className="closingSoonLeft3D">
                  <span className="amberPulseIcon" />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <p className="eyebrow" style={{ color: "#fbbf24", margin: 0, fontWeight: "900", letterSpacing: "0.8px", fontSize: "10px" }}>⚡ ÚLTIMA HORA</p><span className="amberBadgePill" style={{ fontSize: "9.5px", padding: "2px 7px" }}>⏳ Juegan Hoy</span>
                      <span className="mobilePasarelaBadge dark">👉 Desliza</span>
                    </div>
                    <h2 style={{ fontSize: "17px", margin: "2px 0", color: "#ffffff", fontWeight: "950", letterSpacing: "-0.4px" }}>
                      A Punto de Comenzar
                    </h2>
                    <p style={{ margin: 0, color: "#cbd5e1", fontSize: "11.5px", lineHeight: "1.3" }}>
                      Sorteos que cierran hoy con balotera oficial 3D.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btnAllUrgentMaster"
                  onClick={() => setScreen("raffles")}
                  style={{ padding: "6px 12px", fontSize: "11px" }}
                >
                  ⚡ Ver Hoy →
                </button>
              </div>`;

const newClosingSoonHeader = `<section className="closingSoonSection3D">
              <div className="closingSoonHeader3D compactHeaderBar">
                <div className="compactTitleLeft">
                  <div className="compactEyebrowRow">
                    <span className="compactEyebrow amber">⚡ ÚLTIMA HORA</span>
                    <span className="compactBadge amber">⏳ Juegan Hoy</span>
                    <span className="mobilePasarelaBadge dark">👉 Desliza</span>
                  </div>
                  <h2 className="compactHeading">A Punto de Comenzar</h2>
                  <p className="compactSubtext">Cierran hoy ante notaría oficial.</p>
                </div>
                <button
                  type="button"
                  className="btnCompactSeeAll urgent"
                  onClick={() => setScreen("raffles")}
                >
                  Ver Todos ({closingSoonDraws.length}) →
                </button>
              </div>`;

if (page.includes(oldClosingSoonHeader)) {
  page = page.replace(oldClosingSoonHeader, newClosingSoonHeader);
  console.log("Encabezado A Punto de Comenzar compactado!");
} else {
  console.warn("No se encontró exact match de oldClosingSoonHeader, aplicando reemplazo por regex...");
  page = page.replace(/<section className="closingSoonSection3D">[\s\S]*?<div className="closingSoonGrid3D">/, newClosingSoonHeader + '\n\n              <div className="closingSoonGrid3D">');
}

// 4. ACTUALIZAR ENCABEZADO DE PRÓXIMOS SORTEOS (FRANJA REDUCIDA Y TÍTULO COMPACTO)
const oldProximosSorteosHeader = `<section className="marketSection fullMarket">
              <div className="sectionTitle">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                    <p className="eyebrow" style={{ color: "#059669", margin: 0 }}>🎟️ TENDENCIAS</p>
                    <span className="mobilePasarelaBadge">👉 Desliza a los lados</span>
                  </div>
                  <h2>Sorteos Activos</h2>
                  <p>Desliza para ver los premios disponibles o entra al catálogo completo.</p>
                </div>
                <button type="button" className="textButton" onClick={() => setScreen("raffles")}>Explorar catálogo completo ({matchingDraws.length}) →</button>
              </div>`;

const newProximosSorteosHeader = `<section className="marketSection fullMarket">
              <div className="sectionTitle compactSectionBar">
                <div className="compactTitleLeft">
                  <div className="compactEyebrowRow">
                    <span className="compactEyebrow green">🎟️ EN VENTA</span>
                    <span className="mobilePasarelaBadge">👉 Desliza</span>
                  </div>
                  <h2 className="compactHeading">Próximos Sorteos</h2>
                </div>
                <button
                  type="button"
                  className="btnCompactCatalog"
                  onClick={() => setScreen("raffles")}
                >
                  Ver Catálogo ({matchingDraws.length}) →
                </button>
              </div>`;

if (page.includes(oldProximosSorteosHeader)) {
  page = page.replace(oldProximosSorteosHeader, newProximosSorteosHeader);
  console.log("Encabezado Próximos Sorteos compactado!");
} else {
  console.warn("Regex para oldProximosSorteosHeader...");
  page = page.replace(/<section className="marketSection fullMarket">\s*<div className="sectionTitle">[\s\S]*?<\/div>/, newProximosSorteosHeader);
}

// 5. REUBICAR Feed Comercios justo después de A Punto de Comenzar
// Primero extraemos el bloque NewsFeed y su llamada en home
// Queremos el orden:
// 1. closingSoonSection3D
// 2. NewsFeed (Feed Comercios - donde las tiendas publican fotos reales, entregas y próximos eventos)
// 3. marketSection fullMarket (Próximos Sorteos)
// 4. sponsorPasarelaSection (Marcas Aliadas)
// 5. enginePromo (Sala 3D)
// 6. bizServicesSection (Pauta Comercial)

// Verifiquemos si podemos reorganizar las secciones de Home
const newsFeedCall = `{view === "home" && <NewsFeed onBusiness={openBusiness} onOpenPublish={(tab) => openPublishModal(tab || "raffle")} />}`;

// Quitamos NewsFeed de su posición actual
if (page.includes(newsFeedCall)) {
  page = page.replace(newsFeedCall, "");
  // Y lo insertamos justo después de closingSoonSection3D
  const closingSectionClosingTag = '</section>\n          )}';
  const posCS = page.indexOf(closingSectionClosingTag);
  if (posCS !== -1) {
    page = page.slice(0, posCS + closingSectionClosingTag.length) + '\n\n          ' + newsFeedCall + page.slice(posCS + closingSectionClosingTag.length);
    console.log("Feed Comercios reubicado justo después de A Punto de Comenzar!");
  }
}

// 6. REDISEÑAR LAS TARJETAS EN NewsFeed PARA QUE SEAN PUBLICACIONES ORDENADAS Y COMPLETAS
const oldNewsCardBlock = `<article className="newsCard newsCardBlocks" key={post.id} id={post.id} data-post-id={post.id}>
                <div className="newsCardBlocksRow">
                  {/* BLOQUE IZQUIERDO: MEDIOS / FOTO */}
                  <div className="newsCardMediaBlock">
                    <NewsPostMedia post={post} />
                  </div>

                  {/* BLOQUE DERECHO: INFORMACIÓN Y ACCIONES EN BLOQUES LADO A LADO */}
                  <div className="newsCardInfoBlock">
                    <div className="newsByline">
                      <span className="newsAvatar">{post.business_name.slice(0, 1)}</span>
                      <div className="newsBylineText">
                        <button type="button" onClick={() => onBusiness(post.business_name)}>{post.business_name}</button>
                        <small>{post.business_city || "Colombia"} · {post.category}</small>
                      </div>
                    </div>

                    <div className="postRaffleSpecsBar">
                      <span className="postSpecPill tickets">🎟️ {count(post.ticket_count || 100)} Núm.</span>
                      <span className="postSpecPill price">💰 {money(post.ticket_price || 25000)}</span>
                      <span className="postSpecPill mechanic">{post.mechanic === "ruleta" ? "🎰 Ruleta" : "🎱 Balotera"}</span>
                    </div>

                    <p className="newsPostText">{post.content}</p>

                    <div className="newsCardActionsRow">
                      <button
                        type="button"
                        className={\`btnCopyUniqueLink \${copiedId === post.id ? "copied" : ""}\`}
                        onClick={() => handleCopyLink(post.id, uniqueUrl)}
                        title="Copiar enlace único"
                      >
                        {copiedId === post.id ? "✓ ¡Copiado!" : "🔗 Copiar Link"}
                      </button>
                      <button
                        type="button"
                        className="newsStoreLinkBtn"
                        onClick={() => onBusiness(post.business_name)}
                      >
                        🏪 Ver Tienda →
                      </button>
                    </div>
                  </div>
                </div>
              </article>`;

const newNewsSocialCard = `<article className="newsSocialPostCard" key={post.id} id={post.id} data-post-id={post.id}>
                {/* 1. CABECERA DEL COMERCIO */}
                <header className="newsSocialHeader">
                  <div className="newsSocialAuthor" onClick={() => onBusiness(post.business_name)}>
                    <span className="newsSocialAvatar">{post.business_name.slice(0, 1).toUpperCase()}</span>
                    <div className="newsSocialMeta">
                      <div className="newsSocialNameRow">
                        <strong>{post.business_name}</strong>
                        <span className="newsSocialVerified">✓</span>
                      </div>
                      <small className="newsSocialSubline">
                        📍 {post.business_city || "Colombia"} · {post.category}
                      </small>
                    </div>
                  </div>
                  <span className="newsSocialTypeBadge">
                    {post.content.toLowerCase().includes("entrega") || post.content.toLowerCase().includes("ganador")
                      ? "🎉 Entrega Oficial"
                      : "📢 Novedad de Tienda"}
                  </span>
                </header>

                {/* 2. MENSAJE COMPLETO DEL COMERCIO */}
                <p className="newsSocialText">{post.content}</p>

                {/* 3. FOTO PRINCIPAL GENEROSA */}
                <div className="newsSocialPhotoWrap">
                  <NewsPostMedia post={post} />
                </div>

                {/* 4. ESPECIFICACIONES DEL SORTEO SI APLICA */}
                {(post.ticket_price || post.ticket_count) && (
                  <div className="newsSocialSpecsRow">
                    <span className="newsSocialSpecPill">🎟️ <b>{count(post.ticket_count || 50)}</b> Números</span>
                    <span className="newsSocialSpecPill price">💰 <b>{money(post.ticket_price || 25000)}</b></span>
                    <span className="newsSocialSpecPill">{post.mechanic === "ruleta" ? "🎰 Ruleta 3D" : "🎱 Balotera 3D"}</span>
                  </div>
                )}

                {/* 5. ACCIONES LIMPIAS: COPIAR LINK Y VER TIENDA */}
                <footer className="newsSocialActionsBar">
                  <button
                    type="button"
                    className={\`btnNewsSocialCopy \${copiedId === post.id ? "isCopied" : ""}\`}
                    onClick={() => handleCopyLink(post.id, uniqueUrl)}
                  >
                    {copiedId === post.id ? "✓ ¡Enlace Copiado!" : "🔗 Copiar Link"}
                  </button>
                  <button
                    type="button"
                    className="btnNewsSocialStore"
                    onClick={() => onBusiness(post.business_name)}
                  >
                    🏪 Ver Tienda Oficial →
                  </button>
                </footer>
              </article>`;

if (page.includes(oldNewsCardBlock)) {
  page = page.replace(oldNewsCardBlock, newNewsSocialCard);
  console.log("Tarjetas de NewsFeed actualizadas a formato vertical social!");
} else {
  console.warn("Regex para oldNewsCardBlock...");
  page = page.replace(/<article className="newsCard newsCardBlocks"[\s\S]*?<\/article>/g, newNewsSocialCard);
}

fs.writeFileSync(pageFile, page, 'utf8');
console.log("¡app/page.tsx actualizado exitosamente!");
