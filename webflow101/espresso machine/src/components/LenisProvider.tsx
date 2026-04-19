"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Register ScrollTrigger if not already registered
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis for buttery-smooth momentum scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Keep GSAP ScrollTrigger in perfect sync with Lenis scroll events
    lenis.on("scroll", ScrollTrigger.update);

    // Hook Lenis into GSAP's internal ticker
    function tick(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(tick);

    // Prevent GSAP from lagging when switching tabs
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, []);

  return <>{children}</>;
}
