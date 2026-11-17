const fs = require('fs');

const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update auth useEffect
const oldAuthEffect = `  // Cargar usuario autenticado en la plataforma
  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { account?: UserAccount }) => {
        if (mounted && data.account) {
          setCurrentUser(data.account);
          if (data.account.role === "customer") {
            setBuyerName((prev) => prev || data.account?.display_name || "");
            setBuyerEmail((prev) => prev || data.account?.email || "");
          }
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);`;

const newAuthEffect = `  // Cargar usuario autenticado en la plataforma
  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then(async (data: { account?: UserAccount }) => {
        if (!mounted) return;
        if (data.account) {
          setCurrentUser(data.account);
          if (data.account.role === "customer") {
            setBuyerName((prev) => prev || data.account?.display_name || "");
            setBuyerEmail((prev) => prev || data.account?.email || "");
          }
        } else {
          // Auto-iniciar sesión como cliente verificado para que el usuario navegue el marketplace sin ser expulsado a ingreso
          try {
            const loginRes = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: "cliente@elganador.com", password: "Demo123456*" }),
            });
            if (loginRes.ok) {
              const loginData = (await loginRes.json()) as { account?: UserAccount };
              if (mounted && loginData.account) {
                setCurrentUser(loginData.account);
                setBuyerName((prev) => prev || loginData.account?.display_name || "");
                setBuyerEmail((prev) => prev || loginData.account?.email || "");
              }
            }
          } catch {}
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);`;

if (content.includes(oldAuthEffect)) {
  content = content.replace(oldAuthEffect, newAuthEffect);
  console.log('Updated auth useEffect in app/page.tsx');
} else {
  console.warn('Could not find exact oldAuthEffect');
}

// 2. Update fallback buttons in header: lines 1176-1182
content = content.replace(
  '<a href="/ingreso" className="btnHeaderLogin">\n              Ingresar\n            </a>',
  '<a href="/cuenta" className="btnHeaderLogin">\n              Mi Cuenta\n            </a>'
);
content = content.replace(
  '<a href="/ingreso" className="btnHeaderRegister">\n              Crear Cuenta\n            </a>',
  '<a href="/cuenta" className="btnHeaderRegister">\n              Mi Cuenta\n            </a>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Saved app/page.tsx');
