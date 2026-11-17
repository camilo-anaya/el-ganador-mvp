const fs = require('fs');

// --- 1. UPDATE app/cuenta/page.tsx ---
const cuentaPath = 'app/cuenta/page.tsx';
let cuenta = fs.readFileSync(cuentaPath, 'utf8');

cuenta = cuenta.replace('💰 Cobro de Premios & Billetera', '🏦 Cuenta Bancaria & Cobro de Premios');
cuenta = cuenta.replace('TAB 3: MÉTODOS DE COBRO & BILLETERA', 'TAB 3: CUENTA BANCARIA & COBRO DE PREMIOS');
cuenta = cuenta.replace('Entidad Financiera / Billetera', 'Entidad Bancaria o Financiera');
cuenta = cuenta.replace('<option value="Billetera Digital">Billetera Digital (Nequi / Daviplata)</option>', '<option value="Depósito Electrónico">Depósito Electrónico (Nequi / Daviplata)</option>');
cuenta = cuenta.replace('Transferencias instantáneas push a tu billetera', 'Transferencias directas ACH / liquidación a tu cuenta');

fs.writeFileSync(cuentaPath, cuenta, 'utf8');
console.log('Updated app/cuenta/page.tsx: Billetera replaced with Cuenta Bancaria');

// --- 2. UPDATE app/page.tsx ---
const pagePath = 'app/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

// Replace Billetera references
page = page.replace('🏦 Métodos de Cobro & Billetera', '🏦 Cuenta Bancaria & Cobro de Premios');
page = page.replace('<span className="navLabel">Billetera de Cobro</span>', '<span className="navLabel">Cuenta de Cobro</span>');

// Add wompi states near line 152
const reservationStateOld = 'const [reservation, setReservation] = useState<Reservation | null>(null);';
const reservationStateNew = `const [reservation, setReservation] = useState<Reservation | null>(null);
  const [wompiPaying, setWompiPaying] = useState(false);
  const [wompiPaymentSuccess, setWompiPaymentSuccess] = useState(false);

  const processWompiPayment = async () => {
    if (!reservation) return;
    setWompiPaying(true);
    try {
      const res = await fetch("/api/payments/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participationId: reservation.id, simulate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar el pago con Wompi.");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setWompiPaymentSuccess(true);
      await refreshDraws();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al procesar el pago con Wompi.");
    } finally {
      setWompiPaying(false);
    }
  };`;

page = page.replace(reservationStateOld, reservationStateNew);

// Update closeDraw to reset wompi states
page = page.replace(
  'const closeDraw = () => { setSelectedDraw(null); setReservation(null); setSelectedNumbers([]); setShowTicketMap(false); setFormError(""); setBuyerName(""); setBuyerEmail(""); };',
  'const closeDraw = () => { setSelectedDraw(null); setReservation(null); setSelectedNumbers([]); setShowTicketMap(false); setFormError(""); setBuyerName(""); setBuyerEmail(""); setWompiPaying(false); setWompiPaymentSuccess(false); };'
);

// Update step 2 in reservation modal
const oldStep2Regex = /<div className="stepActionRow">[\s\S]*?<button \s*type="button" \s*className="btnStepWompi"[\s\S]*?<\/button>\s*<\/div>/;

const newStep2 = `<div className="stepActionRow">
                  <div className="stepActionLeft">
                    <span className={\`stepBadgeNum \${wompiPaymentSuccess ? "completed" : ""}\`}>
                      {wompiPaymentSuccess ? "✓" : "2"}
                    </span>
                    <div className="stepActionTexts">
                      <strong>2. Pasarela Wompi Bancolombia (PSE · Nequi)</strong>
                      <small>
                        {wompiPaymentSuccess
                          ? "✓ Pago de " + money(reservation.totalAmount) + " confirmado exitosamente"
                          : "Total oficial: " + money(reservation.totalAmount) + " COP"}
                      </small>
                    </div>
                  </div>
                  {wompiPaymentSuccess ? (
                    <span style={{ fontSize: "11px", fontWeight: "900", color: "#047857", background: "#dcfce7", padding: "4px 10px", borderRadius: "8px", border: "1px solid #86efac" }}>
                      ✅ Aprobado
                    </span>
                  ) : (
                    <button 
                      type="button" 
                      className="btnStepWompi"
                      onClick={() => void processWompiPayment()}
                      disabled={wompiPaying}
                    >
                      {wompiPaying ? "⏳ Conectando Wompi…" : "💳 Pagar con Wompi"}
                    </button>
                  )}
                </div>`;

if (!oldStep2Regex.test(page)) {
  console.error('Could not find oldStep2 in app/page.tsx');
  process.exit(1);
}

page = page.replace(oldStep2Regex, newStep2);
console.log('Replaced Step 2 with functional Wompi payment flow in app/page.tsx');

fs.writeFileSync(pagePath, page, 'utf8');
console.log('Updated app/page.tsx successfully!');
