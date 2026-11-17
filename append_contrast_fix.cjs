const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssFile, 'utf8');

const contrastFix = `

/* =============================================================================
   CONTRASTE OSCURO LUXURY UNIFICADO PARA TODAS LAS SECCIONES DE HOME
   ============================================================================= */
.marketSection.fullMarket {
  background: #090d16 !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 8px 0 14px 0 !important;
  margin: 6px 0 14px 0 !important;
  box-sizing: border-box !important;
}

.newsSection {
  background: #090d16 !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 8px 0 14px 0 !important;
  margin: 6px 0 14px 0 !important;
  box-sizing: border-box !important;
}

.marketSection.fullMarket .compactSectionBar {
  background: #090d16 !important;
  padding: 8px 14px 6px 14px !important;
}

.marketSection.fullMarket .compactHeading {
  color: #ffffff !important;
  font-size: 15px !important;
  font-weight: 900 !important;
}

.btnCompactCatalog {
  background: rgba(16, 185, 129, 0.12) !important;
  border: 1px solid rgba(16, 185, 129, 0.35) !important;
  color: #34d399 !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  padding: 5px 11px !important;
  border-radius: 8px !important;
}

.btnCompactCatalog:hover {
  background: rgba(16, 185, 129, 0.25) !important;
  color: #ffffff !important;
}
`;

fs.writeFileSync(cssFile, css + contrastFix, 'utf8');
console.log("Contrast fix aplicado a globals.css");
