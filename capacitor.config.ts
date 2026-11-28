import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.solvio.elganador",
  appName: "El Ganador",
  webDir: "out",
  server: {
    // Permite cargar la versión en vivo de Vercel (con Wompi y APIs dinámicas de Next.js)
    url: process.env.CAP_SERVER_URL || "https://el-ganador-mvp.vercel.app",
    cleartext: true,
    androidScheme: "https",
    allowNavigation: [
      "*.wompi.co",
      "checkout.wompi.co",
      "production.wompi.co",
      "sandbox.wompi.co",
      "*.pse.com.co",
      "*.bancolombia.com",
      "*.nequi.com.co",
      "*.daviplata.com",
      "*.supabase.co",
      "el-ganador-mvp.vercel.app",
    ],
  },
  android: {
    ...({ adjustMarginsForEdgeToEdge: "auto" } as any),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK" as any, // Usa "LIGHT" si tu barra superior es muy clara
      backgroundColor: "#00000000",
    },
    Keyboard: {
      resize: KeyboardResize.None,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
