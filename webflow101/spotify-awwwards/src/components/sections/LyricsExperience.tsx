"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const lyrics = [
  "Is it the look in your eyes",
  "Or is it this dancing juice",
  "Who cares, baby",
  "I think I wanna marry you",
];

export default function LyricsExperience() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Text generate effect: reveal each line sequentially on scroll
      const lines = lyricsRef.current?.querySelectorAll(".lyric-line");
      if (lines) {
        lines.forEach((line, i) => {
          gsap.from(line, {
            scrollTrigger: {
              trigger: line,
              start: "top 80%",
              onEnter: () => setActiveIdx(i),
            },
            opacity: 0,
            y: 40,
            filter: "blur(10px)",
            duration: 1,
            ease: "power3.out",
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1DB954]/5 to-transparent" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div ref={headingRef} className="text-center mb-24">
          <p className="text-spotify text-sm font-semibold tracking-widest uppercase mb-4">
            Lyrics
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-[family-name:var(--font-outfit)] text-gradient-primary mb-6">
            Feel every word
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Real-time synced lyrics that bring you closer to the music.
          </p>
        </div>

        {/* Lyrics Display */}
        <div className="relative">
          {/* Vinyl/waveform decoration */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white/[0.04] hidden lg:block">
            <div className="absolute inset-4 rounded-full border border-white/[0.04]">
              <div className="absolute inset-4 rounded-full border border-white/[0.04]">
                <div className="absolute inset-4 rounded-full bg-spotify/10" />
              </div>
            </div>
          </div>

          <div ref={lyricsRef} className="space-y-6 md:space-y-8 py-8">
            {lyrics.map((line, i) => (
              <div
                key={i}
                className={`lyric-line text-center transition-all duration-700 cursor-default ${
                  activeIdx === i
                    ? "text-foreground scale-105"
                    : activeIdx > i
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground/20"
                }`}
              >
                <p className={`text-3xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-outfit)] tracking-tight leading-tight transition-all duration-700 ${
                  activeIdx === i ? "text-glow-green" : ""
                }`}>
                  {line}
                </p>
              </div>
            ))}
          </div>

          {/* Now playing bar */}
          <div className="mt-16 max-w-md mx-auto glass rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1DB954] to-[#134e30] flex-shrink-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Marry You</p>
              <p className="text-xs text-muted-foreground truncate">Bruno Mars</p>
              {/* Progress bar */}
              <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[65%] rounded-full bg-spotify animate-shimmer bg-gradient-to-r from-spotify via-[#1ed760] to-spotify" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">2:14 / 3:51</span>
          </div>
        </div>
      </div>
    </section>
  );
}
