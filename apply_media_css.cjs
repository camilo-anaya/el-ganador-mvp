const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'app', 'globals.css');
let css = fs.readFileSync(cssFile, 'utf8');

const mediaTransitionCss = `

/* =============================================================================
   TRANSICIÓN SUAVE DE IMÁGENES AL TOCAR / DESLIZAR EN FEED DE COMERCIOS
   (VOLTEO FLUIDO SIN QUEDARSE ESTANCADO)
   ============================================================================= */
.newsPhotoGallery {
  position: relative !important;
  width: 100% !important;
  background: #000000 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  margin: 0 !important;
  padding: 0 !important;
}

.newsSlideViewport {
  position: relative !important;
  width: 100% !important;
  height: 330px !important;
  overflow: hidden !important;
  background: #080c14 !important;
  cursor: pointer !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  touch-action: pan-y !important;
}

.newsSlideTrack {
  display: flex !important;
  height: 100% !important;
  transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1) !important;
  will-change: transform !important;
}

.newsSlideItem {
  height: 100% !important;
  position: relative !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #050811 !important;
}

.newsSlideImg {
  width: 100% !important;
  height: 100% !important;
  max-height: 330px !important;
  object-fit: cover !important;
  display: block !important;
  pointer-events: none !important;
  transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, filter 0.35s ease !important;
}

.newsSlideItem.inactive .newsSlideImg {
  opacity: 0.72 !important;
  transform: scale(0.96) !important;
  filter: brightness(0.85) !important;
}

.newsSlideItem.active .newsSlideImg {
  opacity: 1 !important;
  transform: scale(1) !important;
  filter: brightness(1) !important;
}

.newsPhotoCountBadge {
  position: absolute !important;
  top: 10px !important;
  right: 10px !important;
  background: rgba(0, 0, 0, 0.75) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  color: #ffffff !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  padding: 4px 10px !important;
  border-radius: 99px !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  z-index: 10 !important;
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
  pointer-events: none !important;
}

.newsSlideNavBtn {
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  font-size: 22px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  z-index: 12 !important;
  transition: all 0.2s ease !important;
  padding-bottom: 2px !important;
}

.newsSlideNavBtn:hover {
  background: rgba(0, 0, 0, 0.88) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: translateY(-50%) scale(1.1) !important;
}

.newsSlideNavBtn.prev {
  left: 10px !important;
}

.newsSlideNavBtn.next {
  right: 10px !important;
}

.newsDotsOverlay {
  position: absolute !important;
  bottom: 12px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  z-index: 10 !important;
  padding: 4px 10px !important;
  background: rgba(0, 0, 0, 0.55) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  border-radius: 99px !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

.newsDot {
  width: 7px !important;
  height: 7px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.4) !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  border: none !important;
  padding: 0 !important;
  cursor: pointer !important;
}

.newsDot.active {
  width: 22px !important;
  border-radius: 99px !important;
  background: #38bdf8 !important;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.7) !important;
}

.newsThumbRail {
  display: flex !important;
  gap: 8px !important;
  padding: 8px 12px !important;
  background: #090d16 !important;
  overflow-x: auto !important;
  scrollbar-width: none !important;
  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.newsThumbRail::-webkit-scrollbar {
  display: none !important;
}

.newsThumbItem {
  flex: 0 0 54px !important;
  height: 54px !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  border: 2px solid transparent !important;
  cursor: pointer !important;
  background: #0f172a !important;
  padding: 0 !important;
  transition: border-color 0.25s, transform 0.2s, box-shadow 0.25s !important;
}

.newsThumbItem.active {
  border-color: #38bdf8 !important;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.5) !important;
  transform: scale(1.05) !important;
}

.newsThumbItem img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}
`;

fs.writeFileSync(cssFile, css + mediaTransitionCss, 'utf8');
console.log("Appended media transition styles to globals.css");
