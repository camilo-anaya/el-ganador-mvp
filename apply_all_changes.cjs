const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let page = fs.readFileSync(pageFile, 'utf8');

// 1. REEMPLAZAR ClosingSoonDrawCard COMPLETO
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

      {/* 2. MEDIA HERO PANTALLA COMPLETA */}
      <div 
        className="igPostMedia"
        onClick={() => onOpen(draw)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          triggerDoubleTapHeart();
        }}
      >
        <img src={getDrawImage(draw)} alt={draw.title} loading="lazy" />
        
        {/* Floating Shoppable Tag */}
        <div
          className="igShoppableTag"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(draw);
          }}
          title="Toca para apartar tus boletas"
        >
          <span className="igTagBagIcon">🏷️</span>
          <span className="igTagPrice">{money(draw.unit_price)}</span>
          <span className="igTagUnit">COP</span>
        </div>

        {/* Double-tap Heart Pop Animation */}
        {showHeartAnim && (
          <div className="igBigHeartPulse">
            ❤️
          </div>
        )}
      </div>

      {/* 3. ACTION BAR: SOLO LIKES Y COMPARTIR LINK (SIN COMENTARIOS, SIN REDES SOCIALES) */}
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

      {/* 4. SHOPPABLE CALL TO ACTION BANNER */}
      <div className="igShoppableBanner">
        <button
          type="button"
          className="igShopCtaButton urgent"
          onClick={() => onOpen(draw)}
        >
          <span className="igCtaIcon">⚡</span>
          <span className="igCtaText">Apartar Boletas de Última Hora</span>
          <span className="igCtaArrow">→</span>
        </button>
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

// 2. REEMPLAZAR DrawCard COMPLETO
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

      {/* 2. MEDIA HERO PANTALLA COMPLETA */}
      <div 
        className="igPostMedia"
        onClick={() => onOpen(draw)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          triggerDoubleTapHeart();
        }}
      >
        <img src={getDrawImage(draw)} alt={draw.title} loading="lazy" />
        
        {/* Floating Shoppable Tag */}
        <div
          className="igShoppableTag"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(draw);
          }}
          title="Toca para comprar boletas"
        >
          <span className="igTagBagIcon">🏷️</span>
          <span className="igTagPrice">{money(draw.unit_price)}</span>
          <span className="igTagUnit">COP</span>
        </div>

        {/* Double-tap Heart Pop Animation */}
        {showHeartAnim && (
          <div className="igBigHeartPulse">
            ❤️
          </div>
        )}
      </div>

      {/* 3. ACTION BAR: SOLO LIKES Y COMPARTIR LINK */}
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

      {/* 4. SHOPPABLE CALL TO ACTION BANNER */}
      <div className="igShoppableBanner">
        <button
          type="button"
          className={\`igShopCtaButton \${draw.live ? "liveRoomCta" : ""}\`}
          onClick={() => onOpen(draw)}
        >
          <span className="igCtaIcon">{draw.live ? "🔴" : "🎟️"}</span>
          <span className="igCtaText">
            {draw.live ? "Entrar a Sala 3D en Vivo" : "Comprar Boletas"}
          </span>
          <span className="igCtaArrow">→</span>
        </button>
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

// Reemplazar ambas funciones
page = page.slice(0, idxCSStart) + newClosingSoonDrawCard + newDrawCard + page.slice(idxDCEnd);
console.log("ClosingSoonDrawCard y DrawCard reemplazados con éxito!");

// 3. REEMPLAZAR BOTONES DE REDES SOCIALES EN businessPostCard (Perfil de local)
const oldBusinessPostShare = `<div className="socialShareButtonGroup">
                        <a 
                          href={\`https://api.whatsapp.com/send?text=\${encodeURIComponent(\`🔥 Novedad de \${post.business_name}: \${post.content} \\nEntra a ver sus sorteos oficiales en El Ganador: https://savings-feedback-oliver-neck.trycloudflare.com/?local=\${encodeURIComponent(post.business_name)}\`)}\`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="socialShareBtn whatsapp"
                        >
                          <span>💬</span> WhatsApp
                        </a>
                        <a 
                          href={\`https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(\`https://savings-feedback-oliver-neck.trycloudflare.com/?local=\${encodeURIComponent(post.business_name)}\`)}\`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="socialShareBtn facebook"
                        >
                          <span>📘</span> Facebook
                        </a>
                        <button 
                          type="button" 
                          onClick={() => {
                            navigator.clipboard.writeText(\`🔥 Novedad de \${post.business_name}: \${post.content} - Sorteos en https://savings-feedback-oliver-neck.trycloudflare.com/?local=\${encodeURIComponent(post.business_name)}\`);
                            alert("¡Texto copiado para Instagram! Pégalo en tu publicación o historia.");
                            window.open("https://instagram.com", "_blank");
                          }} 
                          className="socialShareBtn instagram"
                        >
                          <span>📸</span> Instagram
                        </button>
                      </div>`;

const newBusinessPostShare = `<div className="businessPostShareRow">
                        <button
                          type="button"
                          className="btnShareDirectLink"
                          onClick={() => {
                            const postUrl = typeof window !== "undefined"
                              ? \`\${window.location.origin}/?local=\${encodeURIComponent(post.business_name)}\`
                              : \`https://elganador.co/?local=\${encodeURIComponent(post.business_name)}\`;
                            try {
                              if (navigator.clipboard) navigator.clipboard.writeText(postUrl);
                            } catch {}
                            alert("✓ ¡Enlace copiado al portapapeles para compartir!");
                          }}
                        >
                          🔗 Copiar Link para Compartir
                        </button>
                      </div>`;

if (page.includes(oldBusinessPostShare)) {
  page = page.replace(oldBusinessPostShare, newBusinessPostShare);
  console.log("Reemplazado socialShareButtonGroup en businessPostCard");
} else {
  console.warn("No se encontró exact match de oldBusinessPostShare, buscando por regex...");
  page = page.replace(/<div className="socialShareButtonGroup">[\s\S]*?<\/div>/, newBusinessPostShare);
  console.log("Reemplazado por regex en businessPostCard");
}

// 4. REEMPLAZAR BOTONES DE REDES SOCIALES EN activeStory footer
const oldStoryShare = `<div className="socialShareButtonGroup">
              <a 
                href={\`https://api.whatsapp.com/send?text=\${encodeURIComponent(\`🔥 ¡Mira la historia de \${activeStory.business_name} en El Ganador! \${activeStory.caption} \\nParticipa aquí: https://savings-feedback-oliver-neck.trycloudflare.com/?local=\${encodeURIComponent(activeStory.business_name)}\`)}\`} 
                target="_blank" 
                rel="noreferrer" 
                className="socialShareBtn whatsapp"
              >
                <span>💬</span> WhatsApp
              </a>
              <a 
                href={\`https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(\`https://savings-feedback-oliver-neck.trycloudflare.com/?local=\${encodeURIComponent(activeStory.business_name)}\`)}\`} 
                target="_blank" 
                rel="noreferrer" 
                className="socialShareBtn facebook"
              >
                <span>📘</span> Facebook
              </a>
              <button 
                type="button" 
                onClick={() => {
                  navigator.clipboard.writeText(\`🔥 ¡Sorteo de \${activeStory.business_name}! \${activeStory.caption} - Participa en https://savings-feedback-oliver-neck.trycloudflare.com/?local=\${encodeURIComponent(activeStory.business_name)}\`);
                  alert("¡Texto y enlace de la historia copiados! Puedes pegarlo directamente en tus Historias o Mensajes de Instagram.");
                  window.open("https://instagram.com", "_blank");
                }} 
                className="socialShareBtn instagram"
              >
                <span>📸</span> Instagram
              </button>
            </div>`;

const newStoryShare = `<div className="storyShareLinkBox">
              <div className="storyShareInputRow">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? \`\${window.location.origin}/?local=\${encodeURIComponent(activeStory.business_name)}\` : \`https://elganador.co/?local=\${encodeURIComponent(activeStory.business_name)}\`}
                  className="storyShareInput"
                />
                <button
                  type="button"
                  className="btnStoryCopyLink"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? \`\${window.location.origin}/?local=\${encodeURIComponent(activeStory.business_name)}\` : \`https://elganador.co/?local=\${encodeURIComponent(activeStory.business_name)}\`;
                    try {
                      if (navigator.clipboard) navigator.clipboard.writeText(url);
                    } catch {}
                    alert("✓ ¡Enlace copiado al portapapeles para compartir!");
                  }}
                >
                  Copiar Link
                </button>
              </div>
            </div>`;

if (page.includes(oldStoryShare)) {
  page = page.replace(oldStoryShare, newStoryShare);
  console.log("Reemplazado socialShareButtonGroup en activeStory");
} else {
  console.warn("Buscando activeStory socialShareButtonGroup por regex...");
  page = page.replace(/<div className="socialShareButtonGroup">[\s\S]*?<\/div>/, newStoryShare);
}

// 5. REDUCIR LOS TÍTULOS LARGOS DE LAS SECCIONES
// A. Sección A Punto de Comenzar
page = page.replace(
  /\<p className="eyebrow" style=\{\{ color: "#fbbf24", margin: 0, fontWeight: "900", letterSpacing: "0\.8px", fontSize: "10px" \}\}>⚡ ÚLTIMA OPORTUNIDAD · JUEGAN HOY<\/p>\s*<span className="amberBadgePill" style=\{\{ fontSize: "9\.5px", padding: "2px 7px" \}\}>⏳ Cierre 1h a 3h antes de Sala 3D<\/span>/,
  '<p className="eyebrow" style={{ color: "#fbbf24", margin: 0, fontWeight: "900", letterSpacing: "0.8px", fontSize: "10px" }}>⚡ ÚLTIMA HORA</p><span className="amberBadgePill" style={{ fontSize: "9.5px", padding: "2px 7px" }}>⏳ Juegan Hoy</span>'
);

page = page.replace(
  'A Punto de Comenzar · Compra de Última Hora',
  'A Punto de Comenzar'
);

page = page.replace(
  'Sorteos que juegan hoy con balotera oficial 3D. ¡Aparta tus números antes del cierre!',
  'Sorteos que cierran hoy con balotera oficial 3D.'
);

// B. Sección Marcas Aliadas
page = page.replace(
  'COMERCIOS VERIFICADOS & MARCAS OFICIALES · EL GANADOR',
  '🏪 COMERCIOS ALIADOS'
);
page = page.replace(
  'Comercios que rifan en nuestra plataforma, marcas invitadas con beneficios exclusivos y espacios disponibles para tu negocio.',
  'Tiendas y marcas oficiales con respaldo legal.'
);

// C. Sección Sorteos en Tendencia / Activos
page = page.replace(
  'PASARELA DESTACADA · PREMIOS ACTIVOS',
  '🎟️ TENDENCIAS'
);
page = page.replace(
  '<h2>Sorteos en Tendencia</h2>',
  '<h2>Sorteos Activos</h2>'
);
page = page.replace(
  'Desliza para ver los premios más deseados o entra al catálogo completo de rifas.',
  'Desliza para ver los premios disponibles o entra al catálogo completo.'
);

// D. Sección Pauta y Servicios Empresariales
page = page.replace(
  '💼 SOLUCIONES COMERCIALES & PATROCINIO OFICIAL',
  '💼 PARA EMPRESAS'
);
page = page.replace(
  '<h2>Servicios Empresariales & Pauta Publicitaria</h2>',
  '<h2>Pauta Comercial</h2>'
);
page = page.replace(
  'Conecta tu negocio o concesionario con más de 50.000 compradores activos en Colombia. Formatos de alto impacto diseñados para maximizar tus ventas y el reconocimiento de tu marca.',
  'Impulsa tu negocio con pauta y patrocinios oficiales ante miles de compradores.'
);

// E. Feed Comercios
page = page.replace(
  '<p className="eyebrow" style={{ color: "#10b981", margin: 0, fontWeight: "900", letterSpacing: "1px" }}>FEED COMERCIOS</p>',
  '<p className="eyebrow" style={{ color: "#10b981", margin: 0, fontWeight: "900", letterSpacing: "1px" }}>📰 NOVEDADES</p>'
);
page = page.replace(
  'Publicaciones oficiales, fotos y lanzamientos de nuestras tiendas aliadas.',
  'Lanzamientos y novedades de tiendas aliadas.'
);

fs.writeFileSync(pageFile, page, 'utf8');
console.log("¡app/page.tsx actualizado con éxito!");
