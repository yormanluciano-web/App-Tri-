import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/outfit/index.css";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource-variable/playfair-display/index.css";
import "./globals.css";
import { Providers } from "@/features/session/Providers";
import { APP_NAME, APP_SUBTITLE } from "@/domain/models/constants";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — ${APP_SUBTITLE}`, template: `%s · ${APP_NAME}` },
  description: "Juegos privados para 2 o 3 adultos. Cada sesión es diferente. Tus límites siempre cuentan.",
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false, email: false, address: false },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  themeColor: "#0A0510",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CO">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
