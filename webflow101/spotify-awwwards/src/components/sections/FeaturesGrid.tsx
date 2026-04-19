"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { WordRotate } from "@/components/ui/word-rotate";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Spatial Audio",
    description: "Music that surrounds you. Feel every beat in immersive 3D audio with Dolby Atmos support.",
    icon: "🎧",
    className: "md:col-span-2 md:row-span-2",
    gradient: "from-[#1DB954]/20 via-transparent to-transparent",
  },
  {
    title: "AI DJ",
    description: "Your personal DJ that knows exactly what you want to hear next.",
    icon: "🤖",
    className: "md:col-span-1",
    gradient: "from-purple-500/10 via-transparent to-transparent",
  },
  {
    title: "Lyrics Sync",
    description: "Sing along with real-time synced lyrics for every track.",
    icon: "🎤",
    className: "md:col-span-1",
    gradient: "from-blue-500/10 via-transparent to-transparent",
  },
  {
    title: "Blend",
    description: "Create shared playlists that match everyone's taste. Perfect for road trips.",
    icon: "🎵",
    className: "md:col-span-1",
    gradient: "from-pink-500/10 via-transparent to-transparent",
  },
  {
    title: "Offline Mode",
    description: "Download and listen without wifi. Take your music anywhere.",
    icon: "📱",
    className: "md:col-span-1",
    gradient: "from-amber-500/10 via-transparent to-transparent",
  },
  {
    title: "Lossless Audio",
    description: "Studio-quality sound. Hear every detail the artist intended in up to 24-bit/192kHz.",
    icon: "🔊",
    className: "md:col-span-2",
    gradient: "from-[#1DB954]/15 via-transparent to-transparent",
  },
];

export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading fade in
      gsap.from(headingRef.current, {
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
        },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Stagger cards
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
          },
          y: 60,
          opacity: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: "power3.out",
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="section-padding relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-spotify text-sm font-semibold tracking-widest uppercase mb-4">
            Features
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-[family-name:var(--font-outfit)] text-gradient-primary min-h-[120px] md:min-h-[160px] flex items-center justify-center">
            <WordRotate 
              words={[
                "Your music, your way",
                "Your podcasts, your pace",
                "Your playlists, your vibe",
                "Your sound, your soul",
                "Your rhythm, your rules"
              ]} 
              className="text-gradient-primary"
            />
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
          {features.map((feature, index) => (
            <SpotlightCard
              key={feature.title}
              className={`p-8 md:p-10 ${feature.className}`}
            >
              <div
                ref={(el) => { if (el) cardsRef.current[index] = el; }}
                className="absolute inset-0 z-[-1]"
              />
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br z-0 ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {/* Content */}
              <div className="relative z-10">
                <span className="text-3xl mb-4 inline-block transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </span>
                <h3 className="text-xl md:text-2xl font-bold mb-3 font-[family-name:var(--font-outfit)] text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {feature.description}
                </p>
              </div>

              {/* Border glow on hover */}
              <div className="absolute inset-0 rounded-2xl border border-spotify/0 group-hover:border-spotify/20 transition-colors duration-500 pointer-events-none z-10" />
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
