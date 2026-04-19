"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Sign Up Free",
    description: "Create your account in seconds. No credit card required. Jump straight into the music.",
    visual: "🎵",
    accent: "#1DB954",
  },
  {
    number: "02",
    title: "Tell Us Your Taste",
    description: "Pick your favorite artists and genres. Our AI starts learning your unique preferences immediately.",
    visual: "🧠",
    accent: "#1ed760",
  },
  {
    number: "03",
    title: "Get Personalized",
    description: "Discover Weekly, Daily Mixes, and AI DJ—all tailored to you. Every recommendation gets smarter.",
    visual: "✨",
    accent: "#a3ffcf",
  },
  {
    number: "04",
    title: "Listen Everywhere",
    description: "Phone, desktop, car, smart speaker, gaming console—seamlessly switch between all your devices.",
    visual: "🌍",
    accent: "#1DB954",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.from(headingRef.current, {
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 80%",
        },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Stagger each step card with scroll-triggered entrance
      stepsRef.current.forEach((step, i) => {
        if (!step) return;

        // Card entrance: slide up + fade in
        gsap.from(step, {
          scrollTrigger: {
            trigger: step,
            start: "top 85%",
            end: "top 40%",
            scrub: 1,
          },
          y: 100,
          opacity: 0,
          scale: 0.95,
        });

        // Glow pulse on the step number when in view
        const numberEl = step.querySelector(".step-number");
        if (numberEl) {
          gsap.to(numberEl, {
            scrollTrigger: {
              trigger: step,
              start: "top 60%",
              end: "bottom 40%",
              toggleActions: "play reverse play reverse",
            },
            opacity: 0.25,
            scale: 1.05,
            duration: 0.6,
            ease: "power2.out",
          });
        }
      });

      // Animate the progress line height as user scrolls through
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 40%",
            scrub: true,
          },
          scaleY: 1,
          ease: "none",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="section-padding relative">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-24 md:mb-32">
          <p className="text-spotify text-sm font-semibold tracking-widest uppercase mb-6">
            How It Works
          </p>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter font-[family-name:var(--font-outfit)] text-gradient-primary mb-6">
            Start in seconds
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
            Four simple steps to unlock millions of songs and personalized recommendations.
          </p>
        </div>

        {/* Steps with vertical timeline */}
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-[1px] bg-white/[0.06]">
            <div
              ref={progressRef}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-spotify via-spotify/60 to-transparent origin-top"
              style={{ transform: "scaleY(0)" }}
            />
          </div>

          {/* Step cards */}
          <div className="space-y-20 md:space-y-32">
            {steps.map((step, index) => (
              <div
                key={step.number}
                ref={(el) => { if (el) stepsRef.current[index] = el; }}
                className={`relative flex flex-col md:flex-row items-start gap-8 md:gap-16 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 top-4 z-10">
                  <div
                    className="w-4 h-4 rounded-full border-2 transition-colors duration-500"
                    style={{
                      borderColor: step.accent,
                      background: `${step.accent}30`,
                      boxShadow: `0 0 20px ${step.accent}40`,
                    }}
                  />
                </div>

                {/* Card */}
                <div
                  className={`ml-20 md:ml-0 md:w-[45%] ${
                    index % 2 === 0 ? "md:pr-16" : "md:pl-16"
                  }`}
                >
                  <div className="group relative rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-8 md:p-10 overflow-hidden transition-all duration-500 hover:border-white/[0.12]">
                    {/* Background glow */}
                    <div
                      className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-30"
                      style={{ background: step.accent }}
                    />

                    {/* Step number watermark */}
                    <span
                      className="step-number absolute -top-4 -right-2 text-8xl md:text-9xl font-black font-[family-name:var(--font-outfit)] opacity-[0.06] select-none pointer-events-none"
                      style={{ color: step.accent }}
                    >
                      {step.number}
                    </span>

                    {/* Content */}
                    <div className="relative z-10">
                      <span className="text-4xl mb-5 block">{step.visual}</span>
                      <h3 className="text-xl md:text-2xl font-bold mb-3 font-[family-name:var(--font-outfit)]">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Bottom accent */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)` }}
                    />
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-[45%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
