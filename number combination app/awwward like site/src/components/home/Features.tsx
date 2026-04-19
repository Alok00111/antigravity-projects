"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

const features = [
    {
        number: "01",
        title: "Built for teams",
        description:
            "Work together with your team, or share lists with friends and family. Real-time collaboration makes it easy to stay on the same page.",
        accent: "from-accent-coral to-accent-pink",
        dotColor: "bg-accent-coral",
    },
    {
        number: "02",
        title: "Seamless integration",
        description:
            "Connect with the tools you already use. Email, Slack, GitHub, and more. Superlist brings everything into one place.",
        accent: "from-accent-purple to-accent-blue",
        dotColor: "bg-accent-purple",
    },
    {
        number: "03",
        title: "Fast & fluid",
        description:
            "Built for speed. Keyboard shortcuts, offline mode, and instant sync. A specific focus on performance and interaction design.",
        accent: "from-accent-teal to-accent-lime",
        dotColor: "bg-accent-teal",
    },
];

export function Features() {
    return (
        <section id="manifesto" className="relative py-32 md:py-48">
            {/* Section header */}
            <div className="max-w-[1400px] mx-auto px-6 md:px-10 mb-20 md:mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="text-accent-coral text-sm font-semibold tracking-widest uppercase mb-4 block">
                        Manifesto
                    </span>
                    <h2 className="text-display-lg font-extrabold tracking-tighter">
                        More than just
                        <br />
                        <span className="gradient-text">checkboxes</span>
                    </h2>
                </motion.div>
            </div>

            {/* Feature blocks */}
            <div className="max-w-[1400px] mx-auto px-6 md:px-10 space-y-2">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.number}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                        <div className="group relative rounded-2xl border border-border-subtle hover:border-border-hover bg-bg-secondary/50 backdrop-blur-sm transition-all duration-500 overflow-hidden">
                            {/* Hover glow */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${feature.accent} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700`} />

                            <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-6 md:gap-16">
                                {/* Number */}
                                <span className="text-text-muted text-sm font-mono tracking-wider shrink-0">
                                    {feature.number}
                                </span>

                                {/* Dot indicator */}
                                <div className={`hidden md:block w-2 h-2 rounded-full ${feature.dotColor} shrink-0 group-hover:scale-150 transition-transform duration-500`} />

                                {/* Title */}
                                <h3 className="text-2xl md:text-4xl font-bold tracking-tight text-text-primary group-hover:translate-x-2 transition-transform duration-500 shrink-0 min-w-[280px]">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-text-secondary text-base md:text-lg leading-relaxed max-w-xl">
                                    {feature.description}
                                </p>

                                {/* Arrow */}
                                <div className="hidden md:flex items-center ml-auto shrink-0 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
