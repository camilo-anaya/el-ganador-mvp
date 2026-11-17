const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssFile, 'utf8');

const newStyles = `

/* =============================================================================
   ROUND 2 REFINEMENTS:
   1. FRANJAS Y ENCABEZADOS ULTRA-COMPACTOS (TIPOGRAFÍA PEQUEÑA Y ELEGANTE)
   2. BOTÓN APARTAR NÚMERO UNIDO AL VALOR DE LA BOLETA
   3. FEED SOCIAL DE COMERCIOS ORDENADO Y VERTICAL
   ============================================================================= */

/* 1. Encabezados Compactos */
.compactHeaderBar,
.compactSectionBar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 8px 14px 6px 14px !important;
  gap: 8px !important;
  background: transparent !important;
}

.compactTitleLeft {
  display: flex !important;
  flex-direction: column !important;
  gap: 1px !important;
  min-width: 0 !important;
}

.compactEyebrowRow {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  flex-wrap: wrap !important;
}

.compactEyebrow {
  font-size: 9px !important;
  font-weight: 850 !important;
  letter-spacing: 0.6px !important;
  text-transform: uppercase !important;
}

.compactEyebrow.amber {
  color: #fbbf24 !important;
}

.compactEyebrow.green {
  color: #10b981 !important;
}

.compactBadge {
  font-size: 8.5px !important;
  font-weight: 800 !important;
  padding: 1.5px 6px !important;
  border-radius: 99px !important;
  letter-spacing: 0.2px !important;
}

.compactBadge.amber {
  background: rgba(245, 158, 11, 0.2) !important;
  color: #f59e0b !important;
  border: 1px solid rgba(245, 158, 11, 0.4) !important;
}

.compactHeading {
  font-size: 14.5px !important;
  font-weight: 900 !important;
  color: #ffffff !important;
  margin: 1px 0 !important;
  letter-spacing: -0.3px !important;
  white-space: nowrap !important;
}

.compactSubtext {
  font-size: 10.5px !important;
  color: #94a3b8 !important;
  margin: 0 !important;
  line-height: 1.2 !important;
}

.btnCompactSeeAll,
.btnCompactCatalog {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  background: rgba(255, 255, 255, 0.07) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #f1f5f9 !important;
  font-size: 10.5px !important;
  font-weight: 800 !important;
  padding: 5px 10px !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0 !important;
}

.btnCompactSeeAll:hover,
.btnCompactCatalog:hover {
  background: rgba(16, 185, 129, 0.15) !important;
  border-color: rgba(16, 185, 129, 0.4) !important;
  color: #34d399 !important;
}

.btnCompactSeeAll.urgent {
  border-color: rgba(245, 158, 11, 0.35) !important;
  color: #fbbf24 !important;
}

/* 2. Botón Apartar Número + Valor de Boleta Integrados */
.igShoppableBanner {
  padding: 6px 14px 4px 14px !important;
  background: #090d16 !important;
}

.igShopCtaButton {
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 8px 14px !important;
  border-radius: 10px !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
}

.igShopCtaButton.urgent {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%) !important;
  color: #000000 !important;
}

.igShopCtaButton:not(.urgent) {
  background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%) !important;
  color: #000000 !important;
}

.igShopCtaButton.liveRoomCta {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%) !important;
  color: #ffffff !important;
}

.igCtaPriceSide {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  gap: 1px !important;
  text-align: left !important;
}

.igCtaPriceLabel {
  font-size: 8.5px !important;
  font-weight: 850 !important;
  letter-spacing: 0.6px !important;
  opacity: 0.8 !important;
  text-transform: uppercase !important;
  line-height: 1 !important;
}

.igCtaPriceValue {
  font-size: 13.5px !important;
  font-weight: 950 !important;
  letter-spacing: -0.3px !important;
  line-height: 1.1 !important;
}

.igCtaPriceValue small {
  font-size: 9.5px !important;
  font-weight: 800 !important;
  opacity: 0.85 !important;
}

.igCtaButtonSide {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-weight: 950 !important;
  font-size: 13px !important;
  letter-spacing: -0.2px !important;
}

.igCtaArrow {
  font-size: 15px !important;
  line-height: 1 !important;
  transition: transform 0.2s ease !important;
}

.igShopCtaButton:hover .igCtaArrow {
  transform: translateX(3px) !important;
}

/* 3. Feed Social de Comercios Organizado */
.newsSocialPostCard {
  background: #090d16 !important;
  border: 1px solid rgba(255, 255, 255, 0.09) !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45) !important;
}

.newsSocialHeader {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 10px 14px 6px 14px !important;
  gap: 8px !important;
}

.newsSocialAuthor {
  display: flex !important;
  align-items: center !important;
  gap: 9px !important;
  cursor: pointer !important;
  min-width: 0 !important;
}

.newsSocialAvatar {
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #000000 !important;
  font-weight: 900 !important;
  font-size: 13.5px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

.newsSocialMeta {
  display: flex !important;
  flex-direction: column !important;
  min-width: 0 !important;
}

.newsSocialNameRow {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
}

.newsSocialNameRow strong {
  font-size: 13px !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.newsSocialVerified {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 13px !important;
  height: 13px !important;
  border-radius: 50% !important;
  background: #0095f6 !important;
  color: #ffffff !important;
  font-size: 8.5px !important;
  font-weight: 900 !important;
  flex-shrink: 0 !important;
}

.newsSocialSubline {
  font-size: 10.5px !important;
  color: #94a3b8 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.newsSocialTypeBadge {
  font-size: 9px !important;
  font-weight: 800 !important;
  padding: 3px 8px !important;
  border-radius: 99px !important;
  background: rgba(59, 130, 246, 0.15) !important;
  color: #60a5fa !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.newsSocialText {
  padding: 4px 14px 10px 14px !important;
  margin: 0 !important;
  font-size: 12.5px !important;
  color: #cbd5e1 !important;
  line-height: 1.45 !important;
}

.newsSocialPhotoWrap {
  width: 100% !important;
  overflow: hidden !important;
  background: #000000 !important;
  border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.newsSocialPhotoWrap img {
  width: 100% !important;
  max-height: 380px !important;
  object-fit: cover !important;
  display: block !important;
}

.newsSocialSpecsRow {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding: 8px 14px !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  flex-wrap: wrap !important;
}

.newsSocialSpecPill {
  font-size: 11px !important;
  color: #94a3b8 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.newsSocialSpecPill b {
  color: #f1f5f9 !important;
}

.newsSocialSpecPill.price b {
  color: #34d399 !important;
}

.newsSocialActionsBar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 8px 14px !important;
  gap: 8px !important;
}

.btnNewsSocialCopy {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  padding: 6px 12px !important;
  border-radius: 8px !important;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #cbd5e1 !important;
  font-size: 11px !important;
  font-weight: 750 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.btnNewsSocialCopy:hover {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

.btnNewsSocialCopy.isCopied {
  background: #059669 !important;
  border-color: #10b981 !important;
  color: #ffffff !important;
}

.btnNewsSocialStore {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  padding: 6px 13px !important;
  border-radius: 8px !important;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
  color: #000000 !important;
  font-size: 11px !important;
  font-weight: 850 !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.btnNewsSocialStore:hover {
  filter: brightness(1.1) !important;
}

/* 4. En móvil: 100vw exacto en las pasarelas */
@media (max-width: 680px) {
  .newsGrid .newsSocialPostCard {
    flex: 0 0 100vw !important;
    width: 100vw !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }

  .newsGrid {
    padding: 0 !important;
    margin: 0 !important;
    gap: 0 !important;
    width: 100vw !important;
  }
}
`;

fs.writeFileSync(cssFile, css + newStyles, 'utf8');
console.log("¡CSS de round 2 agregado con éxito!");
