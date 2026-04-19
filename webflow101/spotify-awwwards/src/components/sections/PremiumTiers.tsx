"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SpotlightCard from "@/components/ui/SpotlightCard";

gsap.registerPlugin(ScrollTrigger);

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with ad-supported listening",
    features: [
      "Shuffle play on mobile",
      "Ad-supported listening",
      "Basic audio quality",
      "Access to all songs",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$10.99",
    period: "/month",
    description: "The full Spotify experience, no interruptions",
    features: [
      "Ad-free music listening",
      "Download to listen offline",
      "Play songs in any order",
      "High audio quality",
      "Group sessions",
      "Organize listening queue",
    ],
    cta: "Try 1 Month Free",
    highlighted: true,
  },
  {
    name: "Family",
    price: "$16.99",
    period: "/month",
    description: "Premium for up to 6 accounts in your household",
    features: [
      "6 Premium accounts",
      "Block explicit music",
      "Spotify Kids",
      "All Premium features",
      "Family Mix playlist",
      "Parental controls",
    ],
    cta: "Start Family Plan",
    highlighted: false,
  },
];

// Pre-computed meteor positions and durations to avoid Math.random() hydration mismatches
const meteors = [
  { left: "15%", duration: 2.7 },
  { left: "28%", duration: 3.1 },
  { left: "42%", duration: 2.4 },
  { left: "55%", duration: 3.5 },
  { left: "68%", duration: 2.9 },
  { left: "80%", duration: 3.3 },
  { left: "22%", duration: 2.6 },
  { left: "35%", duration: 3.0 },
  { left: "48%", duration: 2.8 },
  { left: "62%", duration: 3.4 },
  { left: "75%", duration: 2.5 },
  { left: "88%", duration: 3.2 },
];

function Meteor({ delay, left, duration }: { delay: number; left: string; duration: number }) {
  return (
    <div
      className="absolute w-[1px] h-20 pointer-events-none"
      style={{
        top: "-80px",
        left: left,
        animation: `meteor ${duration}s linear ${delay}s infinite`,
      }}
    >
      <div className="w-full h-full bg-gradient-to-b from-spotify/60 via-spotify/20 to-transparent rounded-full" />
    </div>
  );
}

export default function PremiumTiers() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const { user, openAuthModal } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanClick = (tierName: string) => {
    if (!user) {
      openAuthModal("signup");
    } else {
      setSelectedPlan(tierName);
      setTimeout(() => setSelectedPlan(null), 2000);
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          scrollTrigger: { trigger: card, start: "top 90%" },
          y: 80,
          opacity: 0,
          scale: 0.95,
          duration: 0.8,
          delay: i * 0.15,
          ease: "power3.out",
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="premium" className="section-padding relative overflow-hidden">
      {/* Meteors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {meteors.map((m, i) => (
          <Meteor key={i} delay={i * 0.8} left={m.left} duration={m.duration} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-spotify text-sm font-semibold tracking-widest uppercase mb-4">
            Premium
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-[family-name:var(--font-outfit)] text-gradient-primary mb-6">
            Pick your plan
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Listen without limits. Try Premium free for 1 month.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {tiers.map((tier, index) => (
            <SpotlightCard
              key={tier.name}
              className={`hover:shadow-2xl ${
                tier.highlighted
                  ? "border-spotify/30 hover:border-spotify/50 scale-105 md:scale-[1.05]"
                  : ""
              }`}
              spotlightColor={tier.highlighted ? "rgba(29, 185, 84, 0.15)" : "rgba(255, 255, 255, 0.05)"}
            >
              <div ref={(el) => { if (el) cardsRef.current[index] = el; }} className="absolute inset-0 z-[-1]" />
              {/* Highlighted badge */}
              {tier.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-spotify to-transparent" />
              )}

              <div className="p-8 md:p-10">
                {tier.highlighted && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-spotify/10 text-spotify border border-spotify/20 mb-4">
                    Most Popular
                  </span>
                )}

                <h3 className="text-2xl font-bold font-[family-name:var(--font-outfit)] mb-2">
                  {tier.name}
                </h3>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-4xl md:text-5xl font-bold font-[family-name:var(--font-outfit)] ${
                    tier.highlighted ? "text-gradient-green" : "text-foreground"
                  }`}>
                    {tier.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>

                <p className="text-muted-foreground text-sm mb-8">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <svg
                        className={`w-4 h-4 flex-shrink-0 ${
                          tier.highlighted ? "text-spotify" : "text-muted-foreground"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handlePlanClick(tier.name)}
                  className={`w-full py-3.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    selectedPlan === tier.name
                      ? "bg-spotify/20 text-spotify border border-spotify/30"
                      : tier.highlighted
                      ? "bg-spotify text-black hover:bg-[#1ed760] hover:shadow-[0_0_30px_rgba(29,185,84,0.4)]"
                      : "border border-white/20 text-foreground hover:bg-white/5 hover:border-white/30"
                  }`}
                >
                  {selectedPlan === tier.name ? "✓ Selected!" : tier.cta}
                </button>
              </div>

              {/* Hover glow */}
              {tier.highlighted && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-b from-spotify/5 to-transparent" />
                </div>
              )}
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
