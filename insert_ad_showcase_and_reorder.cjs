const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let code = fs.readFileSync(pageFile, 'utf8');

// Replace feedSponsors action whatsapp with clean contact action
code = code.replace(/action:\s*"whatsapp"\s*as\s*const/g, 'action: "contact" as const');
code = code.replace(/targetUrl:\s*"https:\/\/wa\.me\/[^"]+"/g, 'targetUrl: "#servicios-empresariales"');
code = code.replace(
  '{sp.action === "whatsapp" && (\n                          <a\n                            href={sp.targetUrl}\n                            target="_blank"\n                            rel="noopener noreferrer"\n                            className="btnSponsorAction btnWhatsappAction"\n                          >\n                            {sp.ctaText}\n                          </a>\n                        )}',
  `{sp.action === "contact" && (
                          <button
                            type="button"
                            className="btnSponsorAction btnContactAction"
                            onClick={() => {
                              if (sp.targetAdmin) openBusiness(sp.targetAdmin);
                              else setShowAdvertisingModal(true);
                            }}
                          >
                            🔗 {sp.ctaText.replace("💬", "").replace("WhatsApp", "Contacto")}
                          </button>
                        )}`
);

// Now let's organize the sections on the home screen:
// 1. Stories
// 2. A Punto de Comenzar (closingSoonSection3D)
// 3. Feed Comercios (NewsFeed)
// 4. Pasarela de Publicidad (adShowcaseSection)
// 5. Próximos Sorteos (marketSection fullMarket)

const adShowcaseMarkup = `
          {/* PASARELA DE PUBLICIDAD OFICIAL & ANUNCIOS DE PATROCINADORES */}
          {view === "home" && (
            <section className="adShowcaseSection" id="pasarela-publicidad" aria-label="Pasarela de Publicidad Oficial">
              <div className="adShowcaseContainer" style={{ background: adBanners[activeAdIndex].bgGradient }}>
                <div className="adSlide">
                  <div className="adSlideLeft">
                    <span className="adBadgeTag" style={{ color: adBanners[activeAdIndex].tagColor }}>
                      {adBanners[activeAdIndex].badge} · {adBanners[activeAdIndex].brand}
                    </span>
                    <h2 className="adBrandTitle">{adBanners[activeAdIndex].title}</h2>
                    <p className="adBrandDesc">{adBanners[activeAdIndex].description}</p>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="adCtaBtn"
                        onClick={() => {
                          if (adBanners[activeAdIndex].isAdSelf) {
                            setShowAdvertisingModal(true);
                          } else {
                            openBusiness(adBanners[activeAdIndex].brand.split(" ")[0]);
                          }
                        }}
                      >
                        {adBanners[activeAdIndex].cta}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAdvertisingModal(true)}
                        style={{
                          background: "rgba(255, 255, 255, 0.16)",
                          border: "1px solid rgba(255, 255, 255, 0.35)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "800",
                          padding: "8px 14px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        📢 Pautar Mi Marca ($150k)
                      </button>
                    </div>
                  </div>
                  <div className="adSlideRight">
                    <span className="adVisualArt">{adBanners[activeAdIndex].emoji}</span>
                  </div>
                </div>
                <div className="adControls">
                  <button
                    type="button"
                    className="adNavArrow"
                    onClick={() => setActiveAdIndex((prev) => (prev - 1 + adBanners.length) % adBanners.length)}
                    aria-label="Anterior patrocinador"
                    title="Anterior"
                  >
                    ‹
                  </button>
                  <div className="adDots">
                    {adBanners.map((ad, idx) => (
                      <button
                        key={ad.id}
                        type="button"
                        className={\`adDot \${activeAdIndex === idx ? "active" : ""}\`}
                        onClick={() => setActiveAdIndex(idx)}
                        aria-label={\`Ver anuncio \${idx + 1}\`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="adNavArrow"
                    onClick={() => setActiveAdIndex((prev) => (prev + 1) % adBanners.length)}
                    aria-label="Siguiente patrocinador"
                    title="Siguiente"
                  >
                    ›
                  </button>
                </div>
              </div>
            </section>
          )}
`;

// Remove existing NewsFeed line at line 1925
code = code.replace(/\{view === "home" && <NewsFeed onBusiness=\{openBusiness\} onOpenPublish=\{\(tab\) => openPublishModal\(tab \|\| "raffle"\)\} \/>\}\s*/g, '');

// Insert NewsFeed and adShowcaseMarkup right after closingSoonSection3D
const closingSoonTarget = `                    progress={progress}
                  />
                ))}
              </div>
            </section>
          )}`;

const replacementWithNewsAndAds = `                    progress={progress}
                  />
                ))}
              </div>
            </section>
          )}

          {/* SECCIÓN 2: FEED DE COMERCIOS (PUBLICACIONES Y FOTOS VOLTEABLES DE EMPRESARIOS) */}
          {view === "home" && <NewsFeed onBusiness={openBusiness} onOpenPublish={(tab) => openPublishModal(tab || "raffle")} />}
${adShowcaseMarkup}`;

if (code.includes(closingSoonTarget)) {
  code = code.replace(closingSoonTarget, replacementWithNewsAndAds);
  console.log("Successfully placed NewsFeed and adShowcaseSection after closingSoonSection3D!");
} else {
  console.error("Could not find closingSoonTarget string in page.tsx");
  process.exit(1);
}

fs.writeFileSync(pageFile, code, 'utf8');
console.log("Updated app/page.tsx successfully!");
