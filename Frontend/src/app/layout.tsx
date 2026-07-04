import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACE — AutoSales Camp Engine",
  description:
    "Detecte oportunidades sazonais, gere campanhas com IA e publique automaticamente em 3 cliques.",
  authors: [{ name: "ACE" }],
  openGraph: {
    title: "ACE — AutoSales Camp Engine",
    description:
      "Detecte oportunidades sazonais, gere campanhas com IA e publique automaticamente em 3 cliques.",
    type: "website",
    images: [
      {
        url: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/72511bf7-c1f3-4d0a-b299-282f91f8d2ea/id-preview-ed1afcd7--2d773a51-d0a0-412c-b493-039ca666427c.lovable.app-1778937567891.png",
      },
    ],
  },
  twitter: {
    card: "summary",
    site: "@Lovable",
    title: "ACE — AutoSales Camp Engine",
    description:
      "Detecte oportunidades sazonais, gere campanhas com IA e publique automaticamente em 3 cliques.",
    images: [
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/72511bf7-c1f3-4d0a-b299-282f91f8d2ea/id-preview-ed1afcd7--2d773a51-d0a0-412c-b493-039ca666427c.lovable.app-1778937567891.png",
    ],
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
        <link rel="icon" href="/logo_rocket.png" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
