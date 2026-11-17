import { ImageResponse } from "next/og";
import { numberToSpanishWords } from "../../../lib/draw-engine/format";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const winner = (searchParams.get("w") || "77").slice(0, 22);
  const drawId = (searchParams.get("id") || "EG-OFICIAL").slice(0, 32);
  const carton = searchParams.get("c") || "99";
  const mode = searchParams.get("m") === "ruleta" ? "ruleta" : "balotas";
  const words = mode === "balotas" ? numberToSpanishWords(winner).toUpperCase() : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "36px 54px",
          background: "linear-gradient(180deg, #ffffff 0%, #f4f8f5 60%, #e6efe9 100%)",
          border: "8px solid #d4a638",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0c311e",
            border: "2px solid #e0b544",
            borderRadius: "999px",
            padding: "8px 28px",
            color: "#ffe89e",
            fontSize: "20px",
            fontWeight: 800,
            letterSpacing: "1px",
          }}
        >
          EL GANADOR · SORTEO OFICIAL CERTIFICADO
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "48px",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "290px",
              height: "290px",
              borderRadius: "999px",
              background: "radial-gradient(circle at 38% 32%, #24784d 0%, #0e3d26 65%, #061c11 100%)",
              border: "14px solid #ddb040",
              boxShadow: "0 20px 45px rgba(10, 40, 24, 0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "184px",
                height: "184px",
                borderRadius: "999px",
                background: "radial-gradient(circle at 32% 28%, #fffdf2 0%, #f4cf65 55%, #a87616 100%)",
                border: "5px solid #fff6cc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "124px",
                  height: "124px",
                  borderRadius: "999px",
                  background: "#ffffff",
                  border: "3px solid #c99b2c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#092114",
                  fontSize: winner.length <= 3 ? "58px" : "36px",
                  fontWeight: 900,
                }}
              >
                {winner}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              background: "#0d3320",
              border: "3px solid #dfb446",
              borderRadius: "24px",
              padding: "28px 38px",
              maxWidth: "660px",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#7fe0b0",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "1px",
              }}
            >
              {mode === "balotas" ? "★ BALOTA GANADORA OFICIAL ★" : "★ GANADOR OFICIAL ★"}
            </div>
            <div
              style={{
                display: "flex",
                color: "#ffe484",
                fontSize: winner.length <= 4 ? "92px" : "48px",
                fontWeight: 900,
                lineHeight: 1.05,
                marginTop: "6px",
              }}
            >
              {mode === "balotas" ? `#${winner}` : winner}
            </div>
            {words ? (
              <div
                style={{
                  display: "flex",
                  color: "#ffffff",
                  fontSize: "26px",
                  fontWeight: 800,
                  marginTop: "6px",
                }}
              >
                {`“${words}”`}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                color: "#c6dfd0",
                fontSize: "19px",
                marginTop: "14px",
              }}
            >
              {`Sorteo ${drawId} · Cartón de ${carton} · Verificado SHA-256`}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#15472c",
            fontSize: "19px",
            fontWeight: 800,
          }}
        >
          ✓ Transparencia Certificada · Consulta Pública en 0 Pasos · Ley 1581 Habeas Data
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
