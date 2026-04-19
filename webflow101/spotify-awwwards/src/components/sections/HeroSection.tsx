"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const magnetRef = useRef<HTMLButtonElement>(null);
  const { user, openAuthModal } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.8 });

      // Staggered headline word reveal
      const words = headlineRef.current?.querySelectorAll(".word");
      if (words) {
        tl.from(words, {
          y: 120,
          opacity: 0,
          rotateX: -90,
          stagger: 0.08,
          duration: 1.2,
          ease: "power4.out",
        });
      }

      tl.from(
        subRef.current,
        { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      );

      tl.from(
        ctaRef.current,
        { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" },
        "-=0.3"
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Magnetic button effect
  useEffect(() => {
    const btn = magnetRef.current;
    if (!btn) return;

    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
    };

    btn.addEventListener("mousemove", handleMove);
    btn.addEventListener("mouseleave", handleLeave);
    return () => {
      btn.removeEventListener("mousemove", handleMove);
      btn.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const headlineText = "Music for every moment";

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Aurora background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.15)_0%,transparent_70%)] animate-aurora" />
        <div
          className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.1)_0%,transparent_70%)] animate-aurora"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-[radial-gradient(circle,rgba(30,215,96,0.08)_0%,transparent_60%)] animate-aurora"
          style={{ animationDelay: "-10s" }}
        />
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="h-10"></div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] mb-8 font-[family-name:var(--font-outfit)]"
          style={{ perspective: "1000px" }}
        >
          {headlineText.split(" ").map((word, i) => (
            <span
              key={i}
              className="word inline-block text-gradient-hero"
              style={{ transformOrigin: "center bottom" }}
            >
              {word}
              {i < headlineText.split(" ").length - 1 && "\u00A0"}
            </span>
          ))}
        </h1>

        {/* Subheadline */}
        <p
          ref={subRef}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-12"
        >
          Millions of songs, podcasts, and audiobooks. Immersive spatial audio.
          AI that knows your taste. All in one app—crafted for you.
        </p>

        {/* CTA buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            ref={magnetRef}
            onClick={() => {
              if (!user) {
                openAuthModal("signup");
              } else {
                router.push("/web-player");
              }
            }}
            className="group relative px-10 py-4 rounded-full bg-spotify text-black text-base font-bold hover:shadow-[0_0_60px_rgba(29,185,84,0.5)] transition-shadow duration-500"
          >
            <span className="relative z-10 flex items-center gap-2">
              {user ? "Open Web Player" : "Start Listening Free"}
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          <a
            href="#features"
            className="px-10 py-4 rounded-full border border-white/10 text-foreground text-base font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-300"
          >
            Explore Features
          </a>
        </div>


      </div>
    </section>
  );
}
