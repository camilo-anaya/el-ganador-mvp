import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.solvio.elganador",
  appName: "El Ganador",
  webDir: "out",
  server: {
    // Permite cargar la versión en vivo de Vercel (con Wompi y APIs dinámicas de Next.js)
    url: process.env.CAP_SERVER_URL || "https://el-ganador-mvp.vercel.app",
    cleartext: true,
    androidScheme: "https",
  },
  android: {
    adjustMarginsForEdgeToEdge: "auto",
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: "DARK", // Usa "LIGHT" si tu barra superior es muy clara
      backgroundColor: "#00000000",
    },
    Keyboard: {
      resize: "none",
      style: "DARK",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
