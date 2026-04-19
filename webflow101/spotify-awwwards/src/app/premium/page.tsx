"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import FooterCTA from "@/components/sections/FooterCTA";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { useAuth } from "@/context/AuthContext";

// We'll reuse the tiers structure but add more detail
const tiers = [
  {
    name: "Individual",
    rawPrice: 10.99,
    price: "$10.99",
    period: "/month",
    description: "1 Premium account",
    features: [
      "Ad-free music listening",
      "Download to listen offline",
      "Play songs in any order",
      "High audio quality",
      "Cancel anytime",
      "15 hours/month of listening time from our audiobooks subscriber catalog",
    ],
    cta: "Try free for 1 month",
    highlighted: false,
    color: "bg-spotify",
  },
  {
    name: "Duo",
    rawPrice: 14.99,
    price: "$14.99",
    period: "/month",
    description: "2 Premium accounts",
    features: [
      "2 Premium accounts",
      "Cancel anytime",
      "15 hours/month of listening time from our audiobooks subscriber catalog (plan manager only)",
      "Ad-free music listening",
      "Download to listen offline",
      "Play songs in any order",
    ],
    cta: "Get Premium Duo",
    highlighted: true,
    color: "bg-[#ffd2d7]", // Spotify Duo color
  },
  {
    name: "Family",
    rawPrice: 16.99,
    price: "$16.99",
    period: "/month",
    description: "Up to 6 Premium accounts",
    features: [
      "Up to 6 Premium or Kids accounts",
      "Block explicit music",
      "Access to Spotify Kids",
      "Cancel anytime",
      "15 hours/month of listening time from our audiobooks subscriber catalog (plan manager only)",
      "Ad-free music listening",
    ],
    cta: "Get Premium Family",
    highlighted: false,
    color: "bg-[#056952]", // Spotify Family color
  },
  {
    name: "Student",
    rawPrice: 5.99,
    price: "$5.99",
    period: "/month",
    description: "1 Premium account",
    features: [
      "1 Premium account",
      "Discount for eligible students",
      "Cancel anytime",
      "Ad-free music listening",
      "Download to listen offline",
      "Play songs in any order",
    ],
    cta: "Get Premium Student",
    highlighted: false,
    color: "bg-[#c3f0c8]", // Spotify Student color
  },
];

const faqs = [
  {
    question: "How does the Spotify Premium trial work?",
    answer: "If you've never had Premium before, you may be eligible for a free or discounted trial. We'll need you to enter a payment method so your music keeps playing without interruption after the trial ends. But don't worry, you can cancel at any time before the trial ends and you won't be charged."
  },
  {
    question: "How do I cancel my Premium plan?",
    answer: "You can cancel your Premium plan any time on your account page. Your Premium features will remain until your next billing date, at which point your account will switch to our free, ad-supported tier."
  },
  {
    question: "How does the Premium Duo plan work?",
    answer: "Premium Duo is a discount plan for two people who live together. You'll get two separate Premium accounts, so you can both listen ad-free and without interruption, and keep your own saved music and playlists."
  },
  {
    question: "How does the Premium Family plan work?",
    answer: "Premium Family is a discount plan for up to 6 family members who live together. Each person gets their own separate Premium account, so everyone can listen at the same time and keep their own saved music and playlists."
  }
];

export default function PremiumPage() {
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
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-spotify selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-spotify/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 font-[family-name:var(--font-outfit)]">
            Listen without limits.
          </h1>
          <p className="text-lg md:text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Play millions of songs ad-free, on-demand, and offline.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (!user) openAuthModal("signup");
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-spotify text-black font-bold hover:bg-[#1ed760] hover:scale-105 transition-all duration-300"
            >
              {user ? "You have access!" : "Get Started"}
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/20 text-white font-bold hover:bg-white/5 hover:border-white/40 transition-all duration-300">
              View all plans
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-6 max-w-2xl mx-auto">
            <a href="#" className="underline hover:text-white transition-colors">Terms and conditions apply.</a> 1 month free not available for users who have already tried Premium.
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <SpotlightCard
                key={tier.name}
                className={`flex flex-col h-full bg-[#242424] border-0 p-0 overflow-hidden relative group ${
                  tier.highlighted ? "xl:-translate-y-4 xl:scale-[1.02] shadow-2xl shadow-spotify/10" : ""
                }`}
              >
                {/* Header Section */}
                <div className={`p-6 ${tier.color} text-black`}>
                  <div className="flex justify-between items-start mb-4">
                    {tier.highlighted && (
                      <span className="px-3 py-1 bg-black/10 text-xs font-bold rounded flex items-center gap-1 uppercase tracking-widest">
                         Most Popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold mb-2 font-[family-name:var(--font-outfit)]">{tier.name}</h3>
                  <div className="font-bold text-lg">{tier.price}</div>
                  <div className="text-sm opacity-80">{tier.description}</div>
                </div>

                {/* Body Section */}
                <div className="p-6 flex-1 flex flex-col bg-zinc-900 border-t border-white/10 group-hover:bg-zinc-800/80 transition-colors">
                  <ul className="space-y-4 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex gap-3 text-sm items-start">
                        <svg className="w-5 h-5 flex-shrink-0 text-white mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanClick(tier.name)}
                    className={`w-full py-4 rounded-full font-bold text-sm transition-all ${
                    selectedPlan === tier.name
                      ? "bg-spotify/20 text-spotify border border-spotify/30"
                      : tier.highlighted 
                        ? "bg-spotify text-black hover:bg-[#1ed760] hover:scale-105" 
                        : "bg-[#242424] text-white hover:scale-105"
                  }`}
                  >
                    {selectedPlan === tier.name ? "✓ Selected!" : tier.cta}
                  </button>
                  <div className="mt-4 text-xs text-center text-muted-foreground">
                    <a href="#" className="underline hover:text-white">Terms apply.</a>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props / Why Join */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl md:text-5xl font-bold tracking-tighter mb-16 font-[family-name:var(--font-outfit)]">
            Experience the difference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-spotify" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 14.2a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4zm2.1-4.2a2.1 2.1 0 10-4.2 0 2.1 2.1 0 004.2 0z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Ad-free music listening</h3>
              <p className="text-muted-foreground text-sm">Enjoy uninterrupted music.</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-spotify" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Offline playback</h3>
              <p className="text-muted-foreground text-sm">Downloads to listen anywhere.</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-spotify" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Play everywhere</h3>
              <p className="text-muted-foreground text-sm">Listen on your speakers, TV, and other favorite devices.</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-spotify" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Pay your way</h3>
              <p className="text-muted-foreground text-sm">Prepay with Paytm, UPI, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 max-w-3xl mx-auto">
        <h2 className="text-center text-3xl md:text-5xl font-bold tracking-tighter mb-12 font-[family-name:var(--font-outfit)]">
          Questions?
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group glass border border-white/10 rounded-2xl open:bg-white/5 transition-all">
              <summary className="flex items-center justify-between p-6 text-lg font-bold cursor-pointer list-none">
                {faq.question}
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-6 pt-0 text-muted-foreground">
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <FooterCTA />
    </main>
  );
}
