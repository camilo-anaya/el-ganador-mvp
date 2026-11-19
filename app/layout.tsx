import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'El Ganador · Sorteos en Vivo',
  description: 'La plataforma oficial de sorteos verificables en tiempo real.',
  applicationName: 'El Ganador',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'El Ganador',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/app-icon-192.png?v=4', sizes: '192x192', type: 'image/png' },
      { url: '/app-icon-512.png?v=4', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png?v=4',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#070a09' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Meta etiquetas indispensables para App Nativa en iOS / iPhone */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="El Ganador" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=4" />
        <link rel="icon" type="image/png" sizes="192x192" href="/app-icon-192.png?v=4" />
        <link rel="manifest" href="/manifest.webmanifest?v=4" />

        {/* Script oficial de Wompi indispensable para evitar pantallas de carga infinitas */}
        <script src="https://checkout.wompi.co/widget.js" async />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
