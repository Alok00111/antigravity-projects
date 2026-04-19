"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "Premium", href: "/premium" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "Download", href: "/download" },
];

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [imageError, setImageError] = useState(false);
  const { user, loading, signOut, openAuthModal } = useAuth();

  useEffect(() => {
    // Intentionally removed the scrolled state logic as the navbar is now absolutely positioned.
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.5,
        clearProps: "all", // Removes inline styles after animation so CSS takes over
      });
    });
    return () => ctx.revert();
  }, []);

  const [spotifyConnected, setSpotifyConnected] = useState(false);

  useEffect(() => {
    fetch('/api/spotify/token')
      .then(res => res.json())
      .then(data => {
        if (data.access_token) setSpotifyConnected(true);
      })
      .catch(() => {});
  }, []);

  // Get user initials for avatar
  const getInitial = () => {
    if (!user) return "";
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <nav
      ref={navRef}
      className="absolute top-0 left-0 right-0 z-50 bg-transparent py-6 transition-all duration-500"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-spotify fill-current transition-transform duration-300 group-hover:scale-110" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381C8.64 5.801 15.6 6.081 20.1 8.82c.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.439.3z"/>
          </svg>
          <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-outfit)]">
            Spotify
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-spotify transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* CTA / Auth */}
        <div className="flex items-center gap-4">
          {loading ? (
            // Loading skeleton
            <div className="w-20 h-8 rounded-full bg-white/5 animate-pulse" />
          ) : user ? (
            // Logged in state
            <>
              {!spotifyConnected && (
                <Link
                  href="/api/spotify/login"
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-black bg-spotify hover:bg-[#1ed760] hover:scale-105 px-4 py-2 rounded-full transition-all duration-300 mr-2"
                >
                  Connect Spotify
                </Link>
              )}
              <Link
                href="/web-player"
                className="hidden sm:inline-flex items-center gap-2 text-sm text-foreground bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors duration-300 mr-2"
              >
                Launch Player
              </Link>
              <div className="flex items-center gap-3">
                {/* User avatar */}
                <div className="w-8 h-8 rounded-full bg-spotify/20 border border-spotify/30 flex items-center justify-center text-spotify text-sm font-bold overflow-hidden">
                  {user.photoURL && !imageError ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    getInitial()
                  )}
                </div>
                <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[120px]">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
              </div>
              <button
                onClick={signOut}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                Log out
              </button>
            </>
          ) : (
            // Logged out state
            <>
              <button
                onClick={() => openAuthModal("login")}
                className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                Log in
              </button>
              <button
                onClick={() => openAuthModal("signup")}
                className="relative px-6 py-2.5 rounded-full bg-spotify text-black text-sm font-semibold hover:bg-[#1ed760] hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(29,185,84,0.4)]"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
