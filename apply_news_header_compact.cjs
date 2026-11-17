const fs = require('fs');
const path = require('path');

// 1. Update app/page.tsx
const pagePath = path.join(__dirname, 'app', 'page.tsx');
let pageCode = fs.readFileSync(pagePath, 'utf8');

// Replace Formato Instagram
pageCode = pageCode.replace(
  '📱 Formato Instagram · 4:5 Full HD',
  '📱 Formato HD · 4:5 Pantalla Completa'
);

// Replace newsSection header
const oldHeader = `    <section className="marketSection newsSection" id="novedades-locales">
      <div className="sectionTitle">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
            <p className="eyebrow" style={{ color: "#10b981", margin: 0, fontWeight: "900", letterSpacing: "1px" }}>📰 NOVEDADES</p>
            <span className="mobilePasarelaBadge">👉 Desliza a los lados</span>
          </div>
          <h2>Feed Comercios</h2>
          <p>Lanzamientos y novedades de tiendas aliadas.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {onOpenPublish && (
            <>
              <button
                type="button"
                className="textButton"
                onClick={() => onOpenPublish("raffle")}
                style={{
                  color: "#2563eb",
                  fontWeight: "800",
                  background: "rgba(37,99,235,0.08)",
                  padding: "7px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(37,99,235,0.3)",
                  cursor: "pointer",
                }}
              >
                📸 Subir Fotos (Hasta 6)
              </button>
              <button
                type="button"
                className="textButton"
                onClick={() => onOpenPublish("story")}
                style={{
                  color: "#ec4899",
                  fontWeight: "800",
                  background: "rgba(236,72,153,0.08)",
                  padding: "7px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(236,72,153,0.3)",
                  cursor: "pointer",
                }}
              >
                ⚡ Subir Historia 24h
              </button>
            </>
          )}
          <a className="textButton" href="/novedades">Ver muro completo →</a>
        </div>
      </div>`;

const newHeader = `    <section className="marketSection newsSection" id="novedades-locales">
      <div className="compactSectionBar">
        <div className="compactBarLeft">
          <div className="compactBarMeta">
            <span className="compactEyebrow" style={{ color: "#34d399" }}>📰 COMERCIOS</span>
            <span className="compactBadge">📸 Novedades & Entregas</span>
          </div>
          <h2 className="compactHeading">Feed Comercios</h2>
          <p className="compactSubtext">Lanzamientos, fotos de premios y anuncios oficiales.</p>
        </div>
        <div className="compactBarRight" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {onOpenPublish && (
            <button
              type="button"
              className="btnCompactCatalog"
              onClick={() => onOpenPublish("raffle")}
              style={{ background: "rgba(37,99,235,0.18)", borderColor: "rgba(59,130,246,0.45)", color: "#93c5fd" }}
            >
              📸 Publicar
            </button>
          )}
          <a className="btnCompactCatalog" href="/novedades">
            Ver Muro →
          </a>
        </div>
      </div>`;

if (pageCode.includes(oldHeader)) {
  pageCode = pageCode.replace(oldHeader, newHeader);
  console.log("Replaced newsSection header successfully in page.tsx");
} else {
  console.warn("Could not find exact oldHeader string, using regex replacement");
  pageCode = pageCode.replace(
    /<section className="marketSection newsSection" id="novedades-locales">[\s\S]*?<div className="sectionTitle">[\s\S]*?<\/div>\s*<\/div>/,
    `<section className="marketSection newsSection" id="novedades-locales">\n      <div className="compactSectionBar">\n        <div className="compactBarLeft">\n          <div className="compactBarMeta">\n            <span className="compactEyebrow" style={{ color: "#34d399" }}>📰 COMERCIOS</span>\n            <span className="compactBadge">📸 Novedades & Entregas</span>\n          </div>\n          <h2 className="compactHeading">Feed Comercios</h2>\n          <p className="compactSubtext">Lanzamientos, fotos de premios y anuncios oficiales.</p>\n        </div>\n        <div className="compactBarRight" style={{ display: "flex", gap: "6px", alignItems: "center" }}>\n          {onOpenPublish && (\n            <button\n              type="button"\n              className="btnCompactCatalog"\n              onClick={() => onOpenPublish("raffle")}\n              style={{ background: "rgba(37,99,235,0.18)", borderColor: "rgba(59,130,246,0.45)", color: "#93c5fd" }}\n            >\n              📸 Publicar\n            </button>\n          )}\n          <a className="btnCompactCatalog" href="/novedades">\n            Ver Muro →\n          </a>\n        </div>\n      </div>`
  );
}

fs.writeFileSync(pagePath, pageCode, 'utf8');

// 2. Update app/globals.css
const cssPath = path.join(__dirname, 'app', 'globals.css');
let cssCode = fs.readFileSync(cssPath, 'utf8');

const newsStyleAdditions = `
/* Contraste y barra compacta para Feed Comercios */
.newsSection .compactSectionBar {
  background: #090d16 !important;
  padding: 8px 14px 6px 14px !important;
}

.newsSection .compactHeading {
  color: #ffffff !important;
  font-size: 15px !important;
  font-weight: 900 !important;
}

.newsSection .compactSubtext {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 11.5px !important;
}
`;

fs.writeFileSync(cssPath, cssCode + newsStyleAdditions, 'utf8');
console.log("Updated globals.css with newsSection compact bar styles");
