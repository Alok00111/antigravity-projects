import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import LenisWrapper from "@/components/LenisWrapper";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spotify Experience | Awwwards",
  description: "An ultra-premium frontend experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${outfit.variable} antialiased bg-background text-foreground selection:bg-primary/30`}
      >
        <AuthProvider>
          <LenisWrapper>{children}</LenisWrapper>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
