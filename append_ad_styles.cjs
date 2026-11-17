const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

const adStyles = `
/* =============================================================================
   PASARELA DE PUBLICIDAD OFICIAL OPTIMIZADA EN MÓVIL
   ============================================================================= */
.adShowcaseSection {
  margin: 12px 0 20px 0 !important;
  position: relative !important;
}

.adShowcaseContainer {
  position: relative !important;
  min-height: 175px !important;
  border-radius: 20px !important;
  overflow: hidden !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}

@media (max-width: 680px) {
  .adShowcaseSection {
    margin: 10px 0 16px 0 !important;
    padding: 0 10px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .adShowcaseContainer {
    border-radius: 16px !important;
    min-height: 155px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
  }
  .adSlide {
    padding: 16px 14px !important;
    gap: 12px !important;
  }
  .adBrandTitle {
    font-size: 16px !important;
    line-height: 1.2 !important;
    margin-bottom: 4px !important;
  }
  .adBrandDesc {
    font-size: 11px !important;
    line-height: 1.35 !important;
    margin-bottom: 10px !important;
  }
  .adVisualArt {
    font-size: 42px !important;
  }
  .adControls {
    bottom: 8px !important;
    right: 12px !important;
  }
}

.btnContactAction {
  background: rgba(37, 99, 235, 0.15) !important;
  border: 1px solid rgba(59, 130, 246, 0.35) !important;
  color: #60a5fa !important;
  padding: 8px 14px !important;
  border-radius: 8px !important;
  font-weight: 800 !important;
  font-size: 12px !important;
  cursor: pointer !important;
}
`;

fs.writeFileSync(cssPath, css + adStyles, 'utf8');
console.log("Appended adShowcase mobile styles to globals.css");
