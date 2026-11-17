const fs = require('fs');

const cssPath = 'app/cuenta/page.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Also update .customerTabsNav to hide scrollbar
css = css.replace('.customerTabsNav {', `.customerTabsNav {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  -webkit-overflow-scrolling: touch !important;`);

const newCssRules = `
/* =============================================================================
   OPTIMIZACIÓN MÓVIL TOTAL DEL PERFIL DEL CLIENTE & CABECERA
   ============================================================================= */

/* 1. CABECERA LIMPIA Y COMPACTA (MÓVIL Y WEB) */
.customerPortalHeader {
  height: 60px !important;
  padding: 0 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 50 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

.portalHeaderLeft {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
}

.portalHeaderLeft .portalBrand {
  font-size: 17px !important;
  font-weight: 900 !important;
  color: #047857 !important;
  letter-spacing: -0.5px !important;
  text-decoration: none !important;
}

.btnBackMarketplace {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  background: #f1f5f9 !important;
  color: #334155 !important;
  padding: 6px 12px !important;
  border-radius: 8px !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  text-decoration: none !important;
  transition: all 0.2s ease !important;
  border: 1px solid #e2e8f0 !important;
}

.btnBackMarketplace:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
}

.portalHeaderActions {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.portalDesktopPill {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 12px !important;
  font-weight: 750 !important;
  text-decoration: none !important;
  padding: 6px 10px !important;
  border-radius: 8px !important;
  transition: background 0.2s ease !important;
}

.portalDesktopPill.livePill {
  color: #dc2626 !important;
  background: rgba(220, 38, 38, 0.08) !important;
}

.portalDesktopPill.notaryPill {
  color: #0284c7 !important;
  background: rgba(2, 132, 199, 0.08) !important;
}

.btnCustomerLogout {
  background: #fee2e2 !important;
  color: #991b1b !important;
  border: 1px solid #fecaca !important;
  padding: 6px 12px !important;
  border-radius: 8px !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  transition: all 0.2s ease !important;
}

.btnCustomerLogout:hover {
  background: #fca5a5 !important;
}

/* 2. AVISO DE IDENTIDAD PROTEGIDA (CLIENTES NO SUBEN FOTOS) */
.clientAvatarHeroArea {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
  padding: 16px !important;
  background: #f8fafc !important;
  border-radius: 16px !important;
  border: 1px solid #e2e8f0 !important;
  margin-bottom: 16px !important;
}

.badgeClientIdentity {
  display: inline-block !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #047857 !important;
  background: #dcfce7 !important;
  padding: 3px 8px !important;
  border-radius: 6px !important;
}

.clientNoPhotoNotice {
  display: flex !important;
  align-items: flex-start !important;
  gap: 12px !important;
  background: #eff6ff !important;
  border: 1px solid #bfdbfe !important;
  border-radius: 14px !important;
  padding: 14px 16px !important;
  margin-bottom: 20px !important;
}

.clientNoPhotoIcon {
  font-size: 20px !important;
  line-height: 1 !important;
  flex-shrink: 0 !important;
}

.clientNoPhotoText strong {
  display: block !important;
  font-size: 13px !important;
  color: #1e40af !important;
  margin-bottom: 4px !important;
}

.clientNoPhotoText p {
  margin: 0 !important;
  font-size: 12px !important;
  line-height: 1.45 !important;
  color: #3b82f6 !important;
}

/* 3. GRILLA DE AVATARES RÁPIDOS */
.presetAvatarSection {
  margin-top: 8px !important;
}

.presetAvatarsLabel {
  display: block !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  margin-bottom: 10px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.3px !important;
}

.presetAvatarsGridClean {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
  gap: 10px !important;
}

.presetAvatarBtnCard {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  background: #ffffff !important;
  border: 1.5px solid #e2e8f0 !important;
  border-radius: 12px !important;
  padding: 10px 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  text-align: left !important;
}

.presetAvatarBtnCard:hover {
  border-color: #059669 !important;
  background: #f0fdf4 !important;
  transform: translateY(-1px) !important;
}

.presetCardEmoji {
  font-size: 24px !important;
  line-height: 1 !important;
}

.presetCardLabel {
  font-size: 12px !important;
  font-weight: 800 !important;
  color: #1e293b !important;
}

/* 4. ADAPTACIONES MÓVILES EXCLUSIVAS (PANTALLA CELULAR < 680px) */
@media (max-width: 680px) {
  .customerPortalHeader {
    height: 52px !important;
    padding: 0 12px !important;
  }
  
  .portalDesktopPill {
    display: none !important;
  }
  
  .customerPortalWrap {
    padding: 12px 10px 80px !important;
  }
  
  .customerHeroCard {
    padding: 16px !important;
    border-radius: 16px !important;
    gap: 14px !important;
    margin-bottom: 16px !important;
  }
  
  .customerAvatarSection {
    flex-direction: row !important;
    align-items: center !important;
    gap: 14px !important;
    width: 100% !important;
  }
  
  .avatarImageWrapper {
    width: 68px !important;
    height: 68px !important;
  }
  
  .avatarInitials {
    font-size: 26px !important;
  }
  
  .customerHeroDetails h1 {
    font-size: 17px !important;
    line-height: 1.25 !important;
    margin-bottom: 4px !important;
  }
  
  .customerHeroDetails p {
    font-size: 12px !important;
    line-height: 1.3 !important;
    margin-bottom: 8px !important;
    word-break: break-word !important;
  }
  
  .customerBadgesRow {
    gap: 5px !important;
  }
  
  .securityBadge {
    font-size: 9px !important;
    padding: 3px 6px !important;
  }
  
  .heroActionGroup {
    width: 100% !important;
  }
  
  .btnHeroOutline {
    width: 100% !important;
    text-align: center !important;
    padding: 8px 12px !important;
    font-size: 12px !important;
  }
  
  .customerTabsNav {
    gap: 6px !important;
    margin-bottom: 16px !important;
    padding-bottom: 2px !important;
  }
  
  .customerTabsNav::-webkit-scrollbar {
    display: none !important;
  }
  
  .customerTabBtn {
    padding: 8px 12px !important;
    font-size: 12px !important;
    border-radius: 8px !important;
    background: #f1f5f9 !important;
  }
  
  .customerTabBtn.active {
    background: #065f46 !important;
    color: #ffffff !important;
  }
  
  .presetAvatarsGridClean {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
`;

fs.writeFileSync(cssPath, css + '\n' + newCssRules, 'utf8');
console.log('Appended mobile CSS rules to app/cuenta/page.css');
