import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { MediaProvider } from "@/context/MediaContext";
import { MediaPanel } from "@/components/MediaPanel";
import { LegacyPwaCleanup } from "@/components/LegacyPwaCleanup";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lore-sigma.vercel.app"),
  alternates: {
    canonical: "/",
  },
  title: "PROTOCOLO VIP | El Club de Lore",
  description: "La Jefa del Neón 👑 | ¿Te atreves a entrar a la travesura?",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/assets/brand/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/brand/pwa/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/assets/brand/pwa/icon-180.png",
  },
  openGraph: {
    title: "PROTOCOLO VIP | El Club de Lore",
    description: "La Jefa del Neón 👑 | ¿Te atreves a entrar a la travesura?",
    images: ["/assets/brand/pwa/icon-512.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white overflow-x-hidden">
        <LegacyPwaCleanup />
        <AuthProvider>
          <MediaProvider>
            <MediaPanel />
            {children}
          </MediaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
