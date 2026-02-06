import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import JsonLd from "../components/JsonLd";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DriverMind - Controle Financeiro para Motoristas de App",
  description: "Otimize seus ganhos e controle seus gastos como motorista Uber/99. Gestão financeira inteligente, simplificada e focada no seu lucro real.",
  manifest: "/manifest.json",
  metadataBase: new URL('https://drivermind.vercel.app'),
  applicationName: "DriverMind",
  keywords: ["motorista de aplicativo", "uber", "99", "controle financeiro", "gestão de ganhos", "carro de aplicativo"],
  authors: [{ name: "DriverMind Team" }],
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: "/icon-192x192.png",
  },
  openGraph: {
    title: "DriverMind - Controle Financeiro para Motoristas",
    description: "Transforme sua direção em um negócio lucrativo. Saiba exatamente quanto ganha e gasta por km rodado.",
    url: 'https://drivermind.vercel.app',
    siteName: 'DriverMind',
    images: [
      {
        url: '/logo.png', // Assuming logo.png serves as a decent OG image for now
        width: 512,
        height: 512,
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "DriverMind - O App do Motorista Profissional",
    description: "Chega de dúvidas no fim do dia. Controle seus ganhos com o DriverMind.",
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable} suppressHydrationWarning>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
