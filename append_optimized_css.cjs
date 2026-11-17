const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssFile, 'utf8');

const additionalCss = `

/* =============================================================================
   OPTIMIZACIÓN DE BOTONES: SOLO LIKES Y COMPARTIR LINK (SIN REDES SOCIALES)
   PANTALLA COMPLETA BORDE A BORDE EN CELULAR (EDGE-TO-EDGE 100VW)
   ============================================================================= */

/* Botón Me gusta limpio y estilizado */
.igLikeBtnOnly {
  display: inline-flex !important;
  align-items: center !important;
  gap: 7px !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  padding: 6px 14px !important;
  border-radius: 99px !important;
  color: #f1f5f9 !important;
  font-size: 12px !important;
  font-weight: 750 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.igLikeBtnOnly:hover {
  background: rgba(239, 68, 68, 0.12) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
  color: #ef4444 !important;
}

.igLikeBtnOnly.isLiked {
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
  color: #ef4444 !important;
}

.igLikeBtnOnly .igSvgIcon {
  width: 18px !important;
  height: 18px !important;
  display: block !important;
}

/* Botón Compartir Link Oficial */
.igActionSharePill {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: rgba(16, 185, 129, 0.08) !important;
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
  padding: 6px 14px !important;
  border-radius: 99px !important;
  color: #34d399 !important;
  font-size: 11.5px !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.igActionSharePill:hover {
  background: rgba(16, 185, 129, 0.18) !important;
  border-color: rgba(16, 185, 129, 0.5) !important;
}

.igActionSharePill.isCopied {
  background: #059669 !important;
  border-color: #10b981 !important;
  color: #ffffff !important;
}

.igShareSvg {
  width: 15px !important;
  height: 15px !important;
  display: block !important;
}

/* Estilos para compartir link en Historias 24h */
.storyShareLinkBox {
  margin: 10px 0 6px 0 !important;
}

.storyShareInputRow {
  display: flex !important;
  align-items: center !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 12px !important;
  padding: 4px 6px 4px 12px !important;
  gap: 8px !important;
}

.storyShareInput {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  color: #cbd5e1 !important;
  font-size: 11.5px !important;
  font-family: monospace !important;
}

.btnStoryCopyLink {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
  color: #000000 !important;
  font-weight: 850 !important;
  font-size: 11.5px !important;
  border: none !important;
  padding: 7px 14px !important;
  border-radius: 9px !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: all 0.2s ease !important;
}

.btnStoryCopyLink:hover {
  filter: brightness(1.1) !important;
}

/* Compartir enlace en publicaciones del local */
.businessPostShareRow {
  margin-top: 10px !important;
}

.btnShareDirectLink {
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  padding: 9px 14px !important;
  background: rgba(16, 185, 129, 0.1) !important;
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
  border-radius: 10px !important;
  color: #34d399 !important;
  font-size: 12.5px !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.btnShareDirectLink:hover {
  background: rgba(16, 185, 129, 0.2) !important;
  border-color: rgba(16, 185, 129, 0.5) !important;
}

/* =============================================================================
   PANTALLA COMPLETA LATERAL EN CELULAR (100% WIDTH / ZERO BORDER WASTAGE)
   ============================================================================= */
@media (max-width: 680px) {
  /* Layout principal flush edge-to-edge */
  .dashboardLayout {
    display: block !important;
    width: 100vw !important;
    max-width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
  }

  .mainColumn {
    padding: 0 0 95px 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
    margin: 0 !important;
  }

  /* Sección A Punto de Comenzar / Última Oportunidad borde a borde */
  .closingSoonSection3D {
    margin: 4px 0 12px 0 !important;
    padding: 10px 0 14px 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    box-sizing: border-box !important;
  }

  .closingSoonHeader3D {
    padding: 0 14px 8px 14px !important;
  }

  .closingSoonGrid3D {
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory !important;
    -webkit-overflow-scrolling: touch !important;
    gap: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
  }

  .closingSoonGrid3D .closingSoonCard3D,
  .closingSoonGrid3D .igSocialPostCard {
    flex: 0 0 100vw !important;
    width: 100vw !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
    scroll-snap-align: start !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }

  /* Pasarela de Sorteos Activos / Tendencias */
  .marketSection.fullMarket {
    padding: 0 !important;
    margin: 0 0 12px 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
  }

  .marketSection.fullMarket .sectionTitle {
    padding: 0 14px 8px 14px !important;
  }

  .productRail {
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory !important;
    -webkit-overflow-scrolling: touch !important;
    gap: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
  }

  .productRail .productCard,
  .productRail .igSocialPostCard {
    flex: 0 0 100vw !important;
    width: 100vw !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
    scroll-snap-align: start !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }

  .exploreAllRafflesCard {
    flex: 0 0 100vw !important;
    width: 100vw !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
    scroll-snap-align: start !important;
    border-radius: 0 !important;
  }

  /* Tarjeta igSocialPostCard al 100% */
  .igSocialPostCard {
    width: 100vw !important;
    max-width: 100vw !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }

  /* Foto adaptada a ancho completo */
  .igPostMedia {
    width: 100vw !important;
    max-width: 100vw !important;
    aspect-ratio: 1 / 1 !important;
    height: auto !important;
    max-height: 420px !important;
    min-height: 320px !important;
    border-radius: 0 !important;
  }

  .igPostMedia img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    border-radius: 0 !important;
  }

  .igPostHeader,
  .igActionBar,
  .igShoppableBanner,
  .igLikesRow,
  .igCaptionRow,
  .igProgressBox,
  .igPostFooter {
    padding-left: 14px !important;
    padding-right: 14px !important;
  }

  /* Temporizador de Cierre sin truncamiento */
  .igPostHeader {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 10px 14px !important;
    gap: 10px !important;
    min-width: 0 !important;
  }

  .igHeaderAuthor {
    display: flex !important;
    align-items: center !important;
    gap: 9px !important;
    min-width: 0 !important;
    flex: 1 1 auto !important;
    overflow: hidden !important;
  }

  .igAuthorMeta {
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .igAuthorName {
    max-width: 130px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .igLocationText {
    max-width: 100px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .igHeaderRight {
    flex-shrink: 0 !important;
    margin-left: auto !important;
  }

  .igStatusPill {
    font-size: 10px !important;
    font-weight: 850 !important;
    padding: 4px 9px !important;
    border-radius: 99px !important;
    letter-spacing: 0.2px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  /* Feed Comercios / Novedades al 100% */
  .newsSection {
    padding: 0 !important;
    margin: 0 0 12px 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
  }

  .newsSection .sectionTitle {
    padding: 0 14px 8px 14px !important;
  }

  .newsGrid {
    padding: 0 14px 14px 14px !important;
  }
}
`;

fs.writeFileSync(cssFile, css + additionalCss, 'utf8');
console.log("¡globals.css actualizado con éxito!");
