"use client";

import { useRef } from "react";
import { AuroraText } from "@/components/magicui/aurora-text";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AnimatedBeam } from "@/components/magicui/animated-beam";

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  return (
    <main className="relative w-full z-10 font-[family-name:var(--font-outfit)]" ref={containerRef}>
      
      {/* SECTION 1: The Hero */}
      <section className="h-screen w-full flex flex-col items-center justify-center p-8 pointer-events-none">
        <AuroraText className="text-6xl md:text-8xl lg:text-9xl font-bold font-[family-name:var(--font-playfair)] mb-4">
          LA MARZOCCO
        </AuroraText>
        <p className="text-zinc-400 max-w-md text-center text-lg md:text-xl font-light tracking-wide">
          The pinnacle of espresso engineering. <br/> Scroll to explore the mechanics.
        </p>
      </section>

      {/* SECTION 2: The Disassembly Scroll Trigger */}
      <section className="disassembly-trigger min-h-[150vh] w-full relative flex items-center justify-start p-8 md:p-24 pointer-events-none">
        <div className="max-w-xl" ref={textRef}>
          <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-playfair)] mb-6 text-white/90">
            Precision Extraction.
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed font-light">
            Every component is machined to aerospace tolerances. The detached commercial-grade portafilter ensures total temperature stability from the boiler directly to your cup.
          </p>
        </div>
        
        {/* An invisible target ref sitting exactly where our 3D portafilter detaches to on the right side of the screen */}
        <div ref={modelRef} className="absolute right-1/4 top-[60vh] w-10 h-10" />

        {/* The Magic UI SVG Beam that dynamically connects the HTML text to the 3D WebGL element! */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={textRef}
          toRef={modelRef}
          curvature={100}
          startYOffset={-50}
          pathColor="rgba(255,255,255,0.05)"
          gradientStartColor="rgba(255,255,255,0)"
          gradientStopColor="rgba(255,255,255, 0.8)"
          duration={3}
        />
      </section>

      {/* SECTION 3: The Footer / Brewing */}
      <section className="min-h-screen w-full flex items-center justify-center bg-gradient-to-t from-black via-[#0a0a0a] to-transparent p-8">
        <div className="text-center">
          <BlurFade delay={0.25} inView>
            <h2 className="text-5xl md:text-7xl font-[family-name:var(--font-playfair)] mb-8 text-white">
              Pre-Order Available.
            </h2>
          </BlurFade>
          <BlurFade delay={0.5} inView>
            <button className="px-8 py-4 rounded-full bg-white text-black font-medium tracking-wide hover:scale-105 transition-transform">
              Configure Yours
            </button>
          </BlurFade>
        </div>
      </section>
    </main>
  );
}
