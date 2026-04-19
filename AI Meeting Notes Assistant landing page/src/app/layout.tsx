import type { Metadata } from "next";
import { Inter, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { UIProvider } from "@/context/UIContext";
import AuthModal from "@/components/AuthModal";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeetScribe AI - The Future of Meeting Notes",
  description: "AI-powered meeting transcriptions and smart summaries. Never miss a detail again.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark scroll-smooth", "font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-black text-white font-sans selection:bg-purple-900/50 selection:text-purple-100 min-h-screen flex flex-col`}
      >
        <UIProvider>
          {children}
          <AuthModal />
        </UIProvider>
      </body>
    </html>
  );
}
