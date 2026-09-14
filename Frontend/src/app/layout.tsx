import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/ace/PwaRegister";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "ACE — Agente de Criação Estratégica",
  applicationName: "ACE",
  description:
    "Detecte oportunidades sazonais, gere campanhas com IA e publique automaticamente no Instagram.",
  authors: [{ name: "ACE" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ACE",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/icon.png?v=3", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192x192.png?v=3", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico?v=3"],
    apple: [
      { url: "/icons/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "ACE — Agente de Criação Estratégica",
    description:
      "Detecte oportunidades sazonais, gere campanhas com IA e publique automaticamente no Instagram.",
    type: "website",
    images: [
      {
        url: "/logo_ace_dark.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ACE — Agente de Criação Estratégica",
    description:
      "Detecte oportunidades sazonais, gere campanhas com IA e publique automaticamente no Instagram.",
    images: ["/logo_ace_dark.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={plusJakartaSans.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico?v=3" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png?v=3" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png?v=3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ACE" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
