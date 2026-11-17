const fs = require('fs');

const file = 'app/cuenta/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace header in app/cuenta/page.tsx
const oldHeaderRegex = /<header className="portalHeader">[\s\S]*?<\/header>/;
const newHeader = `<header className="portalHeader customerPortalHeader">
        <div className="portalHeaderLeft">
          <a className="portalBrand" href="/">
            EL GANADOR
          </a>
          <a className="btnBackMarketplace" href="/" title="Regresar al catálogo de rifas">
            ← Marketplace
          </a>
        </div>
        <div className="portalHeaderActions">
          <a className="portalDesktopPill livePill" href="/sorteo-en-vivo?viewer=true">
            🔴 Sala en Vivo
          </a>
          <a className="portalDesktopPill notaryPill" href="/verificar">
            🛡️ Notaría
          </a>
          <button className="btnCustomerLogout" onClick={() => void logout()} title="Cerrar sesión de mi cuenta">
            🚪 Salir
          </button>
        </div>
      </header>`;

if (!oldHeaderRegex.test(content)) {
  console.error('Could not find oldHeader in app/cuenta/page.tsx');
  process.exit(1);
}
content = content.replace(oldHeaderRegex, newHeader);
console.log('Replaced header in app/cuenta/page.tsx');

// 2. Remove avatarCameraBtn from hero card
const oldAvatarCameraRegex = /<label className="avatarCameraBtn"[\s\S]*?<\/label>/;
if (oldAvatarCameraRegex.test(content)) {
  content = content.replace(oldAvatarCameraRegex, '');
  console.log('Removed avatarCameraBtn from hero card');
}

// 3. Replace Tab 3 button text: "Datos Personales & Fotos" -> "Datos Personales & Avatar"
content = content.replace('👤 Datos Personales & Fotos', '👤 Datos Personales & Avatar');

// 4. In activeTab === "personal", replace the photo upload card with the verified avatar card
const oldPhotoCardRegex = /\{\/\* TARJETA DE GESTIÓN DE FOTOGRAFÍAS \*\/\}[\s\S]*?\{\/\* VERIFICACIÓN DOCUMENTO KYC \*\/\}/;

const newAvatarCard = `{/* TARJETA DE GESTIÓN DE AVATARES SEGUROS (CLIENTES NO SUBEN FOTOS) */}
              <div className="customerBox">
                <div className="customerBoxHeading">
                  <div className="customerBoxIcon green">🛡️</div>
                  <div>
                    <h3>Avatar Oficial & Privacidad</h3>
                    <p>Identidad certificada para compras y transmisiones en vivo.</p>
                  </div>
                </div>

                <div className="clientAvatarHeroArea">
                  {personalForm.avatarUrl ? (
                    <img className="currentAvatarLarge" src={personalForm.avatarUrl} alt="Avatar" />
                  ) : (
                    <div className="currentAvatarLarge avatarInitials" style={{ fontSize: "32px" }}>
                      {(account.display_name || "C").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="clientAvatarHeroInfo">
                    <span className="badgeClientIdentity">🛡️ Identidad Verificada (KYC)</span>
                    <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginTop: "4px" }}>
                      {account.display_name}
                    </strong>
                    <p className="clientAvatarHeroSub" style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      Tu avatar visible en la balotera 3D, actas notariales y chats en vivo.
                    </p>
                  </div>
                </div>

                <div className="clientNoPhotoNotice">
                  <span className="clientNoPhotoIcon">🔒</span>
                  <div className="clientNoPhotoText">
                    <strong>Avatares Protegidos para Clientes</strong>
                    <p>
                      Por seguridad legal y protección de datos ante notario, los compradores participan con avatares predeterminados. La subida de fotografías oficiales desde el dispositivo está reservada exclusivamente para empresarios y comercios aliados.
                    </p>
                  </div>
                </div>

                <div className="presetAvatarSection">
                  <label className="presetAvatarsLabel">
                    Selecciona tu avatar oficial del sistema:
                  </label>
                  <div className="presetAvatarsGridClean">
                    {PRESET_AVATARS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="presetAvatarBtnCard"
                        title={p.label}
                        onClick={() => {
                          const svgAvatar = \`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="%23064e3b"/><text x="50%" y="54%" font-size="34" text-anchor="middle" dominant-baseline="middle">\${encodeURIComponent(p.emoji)}</text></svg>\`;
                          setPersonalForm((prev) => ({ ...prev, avatarUrl: svgAvatar }));
                          setAccount((prev) => (prev ? { ...prev, avatar_url: svgAvatar } : null));
                          void fetch("/api/customer/profile", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "update_personal", avatarUrl: svgAvatar }),
                          });
                          showFeedback("success", \`Avatar "\${p.label}" asignado con éxito.\`);
                        }}
                      >
                        <span className="presetCardEmoji">{p.emoji}</span>
                        <span className="presetCardLabel">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* VERIFICACIÓN DOCUMENTO KYC */}`;

if (!oldPhotoCardRegex.test(content)) {
  console.error('Could not find oldPhotoCard in app/cuenta/page.tsx');
  process.exit(1);
}
content = content.replace(oldPhotoCardRegex, newAvatarCard);
console.log('Replaced photo card with safe avatar card in app/cuenta/page.tsx');

fs.writeFileSync(file, content, 'utf8');
console.log('Finished updating app/cuenta/page.tsx');
