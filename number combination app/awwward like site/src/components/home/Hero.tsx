"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const wordVariants = {
    hidden: { opacity: 0, y: 80, rotateX: 40 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        rotateX: 0,
        transition: {
            delay: 0.3 + i * 0.15,
            duration: 0.8,
            ease: [0.215, 0.61, 0.355, 1] as [number, number, number, number],
        },
    }),
};

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.6], [1, 0.95]);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
            {/* Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-accent-coral/10 blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-accent-purple/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent-pink/5 blur-[150px]" />
            </div>

            {/* Grain overlay */}
            <div className="noise absolute inset-0 pointer-events-none" />

            <motion.div
                style={{ y, opacity, scale }}
                className="relative z-10 flex flex-col items-center text-center px-6 max-w-6xl mx-auto"
            >
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass border border-border-subtle text-text-secondary text-sm">
                        <span className="w-2 h-2 rounded-full bg-accent-coral animate-pulse" />
                        Supercharged productivity is coming
                    </div>
                </motion.div>

                {/* Main Headline */}
                <div className="perspective-[1000px] mb-8">
                    <h1 className="text-display-xl font-extrabold tracking-tighter leading-[0.85]">
                        <div className="overflow-hidden">
                            <motion.span
                                className="block"
                                variants={wordVariants}
                                initial="hidden"
                                animate="visible"
                                custom={0}
                            >
                                Supercharged
                            </motion.span>
                        </div>
                        <div className="overflow-hidden">
                            <motion.span
                                className="block gradient-text-hero"
                                variants={wordVariants}
                                initial="hidden"
                                animate="visible"
                                custom={1}
                            >
                                productivity
                            </motion.span>
                        </div>
                    </h1>
                </div>

                {/* Sub-heading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-lg md:text-xl text-text-secondary max-w-xl mx-auto mb-12 leading-relaxed"
                >
                    We&apos;re building the productivity tool of the future — for teams and individuals alike.
                </motion.p>

                {/* Email Signup */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    <div className="relative flex items-center gap-2 p-1.5 rounded-full glass border border-border-subtle glow-input hover:border-accent-coral/30 transition-all duration-500 focus-within:border-accent-coral/50 focus-within:shadow-[0_0_40px_rgba(255,107,74,0.15)]">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 bg-transparent pl-5 pr-2 py-3 text-text-primary placeholder:text-text-muted outline-none text-sm"
                        />
                        <button className="px-6 py-3 rounded-full bg-gradient-to-r from-accent-coral to-accent-pink text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(255,107,74,0.4)] transition-all duration-300 hover:scale-105 whitespace-nowrap">
                            Notify me
                        </button>
                    </div>
                    <p className="mt-4 text-xs text-text-muted">
                        We&apos;re committed to protecting your data.{" "}
                        <a href="#" className="text-accent-coral hover:underline">Learn more</a>
                    </p>
                </motion.div>
            </motion.div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg-primary to-transparent z-20 pointer-events-none" />
        </section>
    );
}
