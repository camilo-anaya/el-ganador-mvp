import type { Metadata, Viewport } from "next";
import { NativeAppBridge } from "@/components/NativeAppBridge";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "El Ganador",
  description: "Marketplace digital de sorteos y rifas online",
  applicationName: "El Ganador",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "El Ganador",
  },
  icons: {
    icon: [
      { url: "/app-icon-192.png?v=5", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png?v=5", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png?v=5",
  },
  manifest: "/manifest.webmanifest?v=5",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script oficial de Wompi indispensable para widget checkout */}
        <script src="https://checkout.wompi.co/widget.js" async />
      </head>
      <body suppressHydrationWarning>
        <NativeAppBridge />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
