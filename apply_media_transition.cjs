const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

const targetFunctionStart = 'function NewsPostMedia({ post }: { post: PublicPost }) {';
const targetFunctionEnd = 'function NewsFeed({ onBusiness, onOpenPublish }:';

const startIdx = content.indexOf(targetFunctionStart);
const endIdx = content.indexOf(targetFunctionEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end index");
  process.exit(1);
}

const replacement = `function NewsPostMedia({ post }: { post: PublicPost }) {
  const images = (post.images && post.images.length > 0)
    ? post.images
    : (post.image_url ? [post.image_url] : []);
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="newsSlideViewport" style={{ height: "320px", cursor: "default" }}>
        <img
          src={images[0]}
          alt={\`Foto de \${post.business_name}\`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
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
  };

  const handlePhotoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width * 0.35) {
      // Toca lado izquierdo -> foto anterior
      handlePrev();
    } else {
      // Toca lado derecho o centro -> voltea a la siguiente
      handleNext();
    }
  };

  return (
    <div className="newsPhotoGallery">
      {/* VIEWPORT CON DESLIZAMIENTO SUAVE Y VOLTEO DE IMAGEN */}
      <div
        className="newsSlideViewport"
        onClick={handlePhotoClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        title="Toca para voltear a la siguiente imagen"
      >
        {/* Badge contador y ayuda táctil */}
        <span className="newsPhotoCountBadge">
          📸 {activeIdx + 1} de {images.length} · 👉 Toca para voltear
        </span>

        {/* Flecha anterior */}
        <button
          type="button"
          className="newsSlideNavBtn prev"
          onClick={handlePrev}
          aria-label="Foto anterior"
          title="Foto anterior"
        >
          ‹
        </button>

        {/* Flecha siguiente */}
        <button
          type="button"
          className="newsSlideNavBtn next"
          onClick={handleNext}
          aria-label="Foto siguiente"
          title="Foto siguiente"
        >
          ›
        </button>

        {/* Pista deslizante con animación suave al voltear */}
        <div
          className="newsSlideTrack"
          style={{
            display: "flex",
            width: \`\${images.length * 100}%\`,
            transform: \`translateX(-\${(activeIdx * 100) / images.length}%)\`,
            transition: "transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)",
            height: "100%",
          }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className={\`newsSlideItem \${i === activeIdx ? "active" : "inactive"}\`}
              style={{
                width: \`\${100 / images.length}%\`,
                flexShrink: 0,
                height: "100%",
              }}
            >
              <img
                src={img}
                alt={\`Foto \${i + 1} de \${post.business_name}\`}
                className="newsSlideImg"
              />
            </div>
          ))}
        </div>

        {/* Puntos de paginación tipo historia/pasarela */}
        <div className="newsDotsOverlay">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={\`newsDot \${activeIdx === i ? "active" : ""}\`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx(i);
              }}
              aria-label={\`Ir a foto \${i + 1}\`}
            />
          ))}
        </div>
      </div>

      {/* Miniaturas inferiores para salto directo */}
      <div className="newsThumbRail">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className={\`newsThumbItem \${activeIdx === i ? "active" : ""}\`}
            onClick={() => setActiveIdx(i)}
            title={\`Ver foto \${i + 1}\`}
          >
            <img src={img} alt={\`Miniatura \${i + 1}\`} />
          </button>
        ))}
      </div>
    </div>
  );
}

`;

content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync(pageFile, content, 'utf8');
console.log("Replaced NewsPostMedia successfully in app/page.tsx");
