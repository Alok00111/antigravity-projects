"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const founders = [
    {
        name: "Brandon Arnold",
        role: "Design Director",
        bio: "Brandon has spent his career working for some of the world's most well-known product design agencies, most recently as a Design Director for Metalab.",
    },
    {
        name: "Marcel Käding",
        role: "Product",
        bio: "Marcel was one of the first employees at Wunderlist and joined Microsoft with the acquisition in 2015. He led globally distributed teams on product development.",
    },
    {
        name: "Steffen Kiedel",
        role: "Operations",
        bio: "Steffen joined Wunderlist as CFO shortly after the company's incorporation. He helped grow and eventually sell the business to Microsoft.",
    },
    {
        name: "Ben Kubota",
        role: "Technology",
        bio: "Ben is a serial entrepreneur with multiple exits. He started the largest open-source movie database and has always worked at the intersection of product and technology.",
    },
    {
        name: "Christian Reber",
        role: "Founder & CEO",
        bio: "Christian founded Wunderlist in 2010 and was CEO until Microsoft acquired it in 2015. He later founded Pitch, a next-generation presentation software.",
    },
];

export function InteractiveList() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    return (
        <section id="team" className="relative py-32 md:py-48 overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent-purple/5 blur-[150px] pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 md:px-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7 }}
                    className="mb-20 md:mb-28"
                >
                    <span className="text-accent-purple text-sm font-semibold tracking-widest uppercase mb-4 block">
                        Team
                    </span>
                    <h2 className="text-display-lg font-extrabold tracking-tighter">
                        Founders
                    </h2>
                </motion.div>

                {/* Founder list */}
                <div className="space-y-0">
                    {founders.map((founder, index) => (
                        <motion.div
                            key={founder.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                        >
                            <div
                                className="group border-t border-border-subtle last:border-b cursor-pointer"
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                <div className="py-6 md:py-8 flex items-center justify-between gap-6 transition-all duration-500">
                                    <div className="flex items-center gap-6 md:gap-12 flex-1 min-w-0">
                                        {/* Index */}
                                        <span className="text-text-muted text-xs font-mono tracking-wider w-8 shrink-0">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>

                                        {/* Avatar placeholder */}
                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-accent-coral/20 to-accent-purple/20 border border-border-subtle flex items-center justify-center shrink-0 transition-all duration-500 ${activeIndex === index ? "scale-110 border-accent-coral/30" : ""}`}>
                                            <span className="text-text-secondary text-sm font-bold">
                                                {founder.name.split(" ").map(n => n[0]).join("")}
                                            </span>
                                        </div>

                                        {/* Name */}
                                        <h3 className={`text-xl md:text-3xl font-bold tracking-tight transition-all duration-500 ${activeIndex === index ? "text-text-primary translate-x-2" : activeIndex !== null ? "text-text-muted" : "text-text-primary"}`}>
                                            {founder.name}
                                        </h3>

                                        {/* Role - desktop */}
                                        <span className={`hidden lg:block text-sm font-medium transition-all duration-500 ${activeIndex === index ? "text-accent-coral" : "text-text-muted"}`}>
                                            {founder.role}
                                        </span>
                                    </div>

                                    {/* Arrow */}
                                    <div className={`transition-all duration-500 ${activeIndex === index ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent-coral">
                                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expanded bio */}
                                <motion.div
                                    initial={false}
                                    animate={{
                                        height: activeIndex === index ? "auto" : 0,
                                        opacity: activeIndex === index ? 1 : 0,
                                    }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="pb-8 pl-[88px] md:pl-[136px] max-w-2xl">
                                        <p className="text-text-secondary leading-relaxed text-sm md:text-base">
                                            {founder.bio}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
