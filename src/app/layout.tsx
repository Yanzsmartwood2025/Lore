import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PROTOCOLO VIP | El Club de Lore",
  description: "La Jefa del Neón 👑 | ¿Te atreves a entrar a la travesura?",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/Lore-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/Lore-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/images/Lore-180x180.png",
  },
  openGraph: {
    title: "PROTOCOLO VIP | El Club de Lore",
    description: "La Jefa del Neón 👑 | ¿Te atreves a entrar a la travesura?",
    images: ["/images/Lore-512x512.png"],
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
      <body className="h-full flex flex-col bg-black text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}