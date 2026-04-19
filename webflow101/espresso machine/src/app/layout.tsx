import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";
import Scene from "@/components/canvas/Scene";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Precision | Luxury Espresso",
  description: "A 3D WebGL Showcase of Engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <LenisProvider>
          {/* The fixed 3D Scene stays perfectly still behind the scrolling content */}
          <Scene />
          {/* Main DOM Layer layered on top of the canvas */}
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
