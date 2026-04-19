"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/components/Navbar";
import FooterCTA from "@/components/sections/FooterCTA";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: "Active Users", value: "602M+", delay: 0 },
  { label: "Subscribers", value: "236M+", delay: 0.1 },
  { label: "Markets", value: "184", delay: 0.2 },
  { label: "Tracks", value: "100M+", delay: 0.3 },
];

const timeline = [
  { year: "2006", title: "The Idea", desc: "Founders Daniel Ek and Martin Lorentzon brainstormed Spotify." },
  { year: "2008", title: "Launch", desc: "Spotify goes live, offering legal music streaming." },
  { year: "2015", title: "Discover Weekly", desc: "AI-driven personalization changes music discovery forever." },
  { year: "2024", title: "Audiobooks & More", desc: "Expanding the audio universe beyond music and podcasts." },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.from(".hero-text", {
        y: 100,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: "power4.out",
        delay: 0.2,
      });

      // Stats Grid Animation
      gsap.from(".stat-card", {
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: "power3.out",
      });

      // Timeline Animation
      const timelineItems = gsap.utils.toArray(".timeline-item");
      timelineItems.forEach((item: any, i) => {
        gsap.from(item, {
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
          },
          x: i % 2 === 0 ? -50 : 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-spotify selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-40 pb-20 px-6 min-h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Abstract Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.15)_0%,transparent_60%)] animate-aurora pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          <h1 className="hero-text text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 font-[family-name:var(--font-outfit)] text-glow-white">
            Unlock the <br className="hidden md:block" />
            <span className="text-gradient-green text-glow-green">potential</span> of <br className="hidden md:block" />
            human creativity.
          </h1>
          <p className="hero-text text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Our mission is to give a million creative artists the opportunity to live off their art and billions of fans the opportunity to enjoy and be inspired by it.
          </p>
        </div>
      </section>

      {/* Stats Grid Section */}
      <section ref={statsRef} className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card glass p-6 md:p-8 rounded-3xl text-center hover:bg-white/5 transition-colors duration-300">
                <div className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-outfit)] mb-2 text-gradient-green">{stat.value}</div>
                <div className="text-xs tracking-widest uppercase text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section ref={timelineRef} className="section-padding py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative px-6 md:px-0">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-spotify/30 to-transparent md:-translate-x-1/2" />

          {timeline.map((item, i) => (
            <div key={item.year} className={`timeline-item flex flex-col md:flex-row items-center justify-between mb-16 md:mb-24 last:mb-0 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Content Box */}
              <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${i % 2 === 0 ? 'md:text-right' : 'text-left'}`}>
                <div className="glass p-8 rounded-3xl relative group hover:bg-white/5 transition-colors duration-300">
                  {/* Connection Dot */}
                  <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-spotify shadow-[0_0_20px_rgba(29,185,84,0.6)] 
                    -left-14 md:left-auto ${i % 2 === 0 ? 'md:-left-12' : 'md:-right-12'}
                    group-hover:scale-150 transition-transform duration-300`} />
                  
                  <span className="text-spotify font-mono text-xl mb-4 block tracking-wider">{item.year}</span>
                  <h3 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)] mb-4 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground md:text-lg leading-relaxed">{item.desc}</p>
                </div>
              </div>

              {/* Spacer for center line aligning */}
              <div className="hidden md:flex w-[10%] justify-center" />
              <div className="hidden md:block w-[45%]" />
            </div>
          ))}
        </div>
      </section>

      <FooterCTA />
    </main>
  );
}
