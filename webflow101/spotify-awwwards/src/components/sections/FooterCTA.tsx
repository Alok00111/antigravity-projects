"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRouter } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

const footerLinks = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Jobs", href: "/jobs" },
      { label: "For the Record", href: "/for-the-record" }
    ],
  },
  {
    heading: "Communities",
    links: [
      { label: "For Artists", href: "/artists" },
      { label: "Developers", href: "/developers" },
      { label: "Advertising", href: "/advertising" },
      { label: "Investors", href: "/investors" },
      { label: "Vendors", href: "/vendors" }
    ],
  },
  {
    heading: "Useful Links",
    links: [
      { label: "Support", href: "/support" },
      { label: "Web Player", href: "/web-player" },
      { label: "Free Mobile App", href: "/download" }
    ],
  },
];

const socialIcons = [
  {
    name: "Instagram",
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: "Twitter",
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

export default function FooterCTA() {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // CTA text reveal
      gsap.from(ctaRef.current, {
        scrollTrigger: { trigger: ctaRef.current, start: "top 85%" },
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
      });

      // Footer links stagger
      const linkGroups = linksRef.current?.querySelectorAll(".link-group");
      if (linkGroups) {
        gsap.from(Array.from(linkGroups), {
          scrollTrigger: { trigger: linksRef.current, start: "top 90%" },
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Social icon magnetic effect
  useEffect(() => {
    const icons = document.querySelectorAll(".social-magnetic");
    const handlers: Array<{
      el: Element;
      move: (e: MouseEvent) => void;
      leave: () => void;
    }> = [];

    icons.forEach((icon) => {
      const handleMove = (e: MouseEvent) => {
        const rect = (icon as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(icon, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: "power2.out" });
      };
      const handleLeave = () => {
        gsap.to(icon, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      };
      (icon as HTMLElement).addEventListener("mousemove", handleMove);
      (icon as HTMLElement).addEventListener("mouseleave", handleLeave);
      handlers.push({ el: icon, move: handleMove, leave: handleLeave });
    });

    return () => {
      handlers.forEach(({ el, move, leave }) => {
        (el as HTMLElement).removeEventListener("mousemove", move);
        (el as HTMLElement).removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative">
      {/* Big CTA */}
      <div ref={ctaRef} className="section-padding text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.1)_0%,transparent_70%)]" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter font-[family-name:var(--font-outfit)] text-gradient-green mb-8 text-glow-green">
            Ready to start listening?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-12">
            Join over 600 million users. Free forever, with Premium when you want it.
          </p>
          <button
            onClick={() => {
              if (!user) {
                openAuthModal("signup");
              } else {
                router.push("/web-player");
              }
            }}
            className="px-12 py-5 rounded-full bg-spotify text-black text-lg font-bold hover:bg-[#1ed760] hover:scale-105 hover:shadow-[0_0_60px_rgba(29,185,84,0.5)] transition-all duration-500"
          >
            {user ? "Launch Web Player" : "Sign Up Free"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
          <div ref={linksRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {/* Logo column */}
            <div className="link-group col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-spotify fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381C8.64 5.801 15.6 6.081 20.1 8.82c.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.439.3z"/>
                </svg>
                <span className="text-xl font-bold font-[family-name:var(--font-outfit)]">Spotify</span>
              </Link>
            </div>

            {/* Link groups */}
            {footerLinks.map((group) => (
              <div key={group.heading} className="link-group">
                <h4 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">
                  {group.heading}
                </h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("http") ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social + Legal */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/[0.04]">
            {/* Social icons */}
            <div className="flex items-center gap-4">
              {socialIcons.map((social) => {
                const socialHref = social.name === 'Instagram' ? 'https://instagram.com' : social.name === 'Twitter' ? 'https://twitter.com' : 'https://facebook.com';
                return (
                  <a
                    key={social.name}
                    href={socialHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-magnetic w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.1] transition-colors duration-300"
                    aria-label={social.name}
                  >
                    {social.svg}
                  </a>
                );
              })}
            </div>

            {/* Legal */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/60">
              <Link href="/legal" className="hover:text-muted-foreground transition-colors">Legal</Link>
              <Link href="/privacy-center" className="hover:text-muted-foreground transition-colors">Privacy Center</Link>
              <Link href="/privacy-policy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
              <Link href="/cookies" className="hover:text-muted-foreground transition-colors">Cookies</Link>
              <Link href="/about-ads" className="hover:text-muted-foreground transition-colors">About Ads</Link>
              <span>© {new Date().getFullYear()} Personal Project</span>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}
