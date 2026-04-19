"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const devices = [
  {
    name: "iPhone",
    category: "Mobile",
    description: "Full-featured app with offline downloads, spatial audio, and haptic feedback.",
    mockup: "📱",
    size: "w-48 h-96",
    gradient: "from-slate-800 to-slate-900",
  },
  {
    name: "MacBook",
    category: "Desktop",
    description: "Native desktop app with high-fidelity audio, keyboard shortcuts, and mini player.",
    mockup: "💻",
    size: "w-80 h-52",
    gradient: "from-zinc-800 to-zinc-900",
  },
  {
    name: "Apple Watch",
    category: "Wearable",
    description: "Control your music from your wrist. Stream directly or sync playlists offline.",
    mockup: "⌚",
    size: "w-40 h-48",
    gradient: "from-neutral-800 to-neutral-900",
  },
  {
    name: "Smart Speaker",
    category: "Home",
    description: "Ask for any song, artist, or mood. Voice-controlled music in every room.",
    mockup: "🔈",
    size: "w-48 h-48",
    gradient: "from-stone-800 to-stone-900",
  },
];

function DeviceCard({
  device,
  index,
}: {
  device: (typeof devices)[0];
  index: number;
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const rotateX = isHovered ? (mousePos.y - 0.5) * -10 : 0;
  const rotateY = isHovered ? (mousePos.x - 0.5) * 10 : 0;

  return (
    <div
      ref={cardRef}
      className="group relative"
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden transition-all duration-300 hover:border-white/[0.12]"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
      >
        {/* Spotlight */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `radial-gradient(300px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(29, 185, 84, 0.08), transparent 60%)`,
            }}
          />
        )}

        {/* Device mockup area */}
        <div className={`h-52 bg-gradient-to-br ${device.gradient} flex items-center justify-center relative`}>
          <span className="text-7xl transition-transform duration-500 group-hover:scale-110">
            {device.mockup}
          </span>
          {/* Spotify UI indicator */}
          <div className="absolute bottom-3 left-3 right-3 h-8 rounded-md bg-black/40 backdrop-blur-sm flex items-center px-3 gap-2">
            <div className="w-3 h-3 rounded-sm bg-spotify/60" />
            <div className="flex-1 h-1 rounded-full bg-white/10">
              <div className="h-full w-1/2 rounded-full bg-spotify/40" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-bold font-[family-name:var(--font-outfit)]">
              {device.name}
            </h4>
            <span className="text-xs text-spotify/80 px-2 py-0.5 rounded-full bg-spotify/10">
              {device.category}
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {device.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CrossPlatform() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      const cards = gridRef.current?.children;
      if (cards) {
        gsap.from(Array.from(cards), {
          scrollTrigger: { trigger: gridRef.current, start: "top 85%" },
          y: 60,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding relative">
      <div className="max-w-7xl mx-auto">
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-spotify text-sm font-semibold tracking-widest uppercase mb-4">
            Everywhere
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-[family-name:var(--font-outfit)] text-gradient-primary mb-6">
            Play on any device
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Seamlessly switch between devices. Your music follows you everywhere.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {devices.map((device, index) => (
            <DeviceCard key={device.name} device={device} index={index} />
          ))}
        </div>

        {/* Download CTA */}
        <div className="text-center mt-16">
          <Link
            href="/download"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-spotify text-black font-bold hover:bg-[#1ed760] hover:scale-105 transition-all duration-300 shadow-lg shadow-spotify/20"
          >
            Download the App
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
