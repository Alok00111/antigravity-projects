"use client";

import { motion } from "framer-motion";

const newsItems = [
    {
        source: "TechCrunch",
        title: "As Wunderlist shuts down, its founder announces a new productivity app called Superlist",
        url: "https://techcrunch.com/2020/05/05/as-wunderlist-shuts-down-its-founder-announces-a-new-productivity-app-called-superlist/",
    },
    {
        source: "The Verge",
        title: "Wunderlist founder announces a new productivity app called Superlist",
        url: "https://www.theverge.com/2020/5/5/21248121/wunderlist-microsoft-to-do-office365-superlist",
    },
];

const jobs = [
    { title: "Senior Backend Engineer", location: "Remote" },
    { title: "Senior Product Designer", location: "Remote / Seattle" },
];

const benefits = [
    "Remote-first company setup",
    "Competitive compensation / equity package",
    "Healthy work-life balance",
    "Parent-friendly company culture",
    "Educational stipend",
    "30-days vacation",
    "Top-of-the-line equipment",
    "Experienced, distributed, and diverse team",
];

export function CtaSection() {
    return (
        <>
            {/* News Section */}
            <section id="news" className="relative py-32 md:py-48 border-t border-border-subtle">
                <div className="max-w-[1400px] mx-auto px-6 md:px-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        className="mb-20"
                    >
                        <span className="text-accent-teal text-sm font-semibold tracking-widest uppercase mb-4 block">
                            News
                        </span>
                        <h2 className="text-display-lg font-extrabold tracking-tighter">
                            Read all
                            <br />
                            <span className="gradient-text">about it</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {newsItems.map((item, index) => (
                            <motion.a
                                key={item.source}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group relative rounded-2xl border border-border-subtle bg-bg-secondary/50 p-8 md:p-12 hover:border-border-hover transition-all duration-500 overflow-hidden block"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative">
                                    <span className="text-accent-teal text-xs font-semibold tracking-widest uppercase mb-6 block">
                                        {item.source}
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary leading-tight mb-8 group-hover:translate-x-1 transition-transform duration-500">
                                        {item.title}
                                    </h3>
                                    <span className="inline-flex items-center gap-2 text-sm text-text-secondary group-hover:text-accent-teal transition-colors duration-300">
                                        Read more
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="group-hover:translate-x-1 transition-transform duration-300">
                                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Jobs Section */}
            <section id="jobs" className="relative py-32 md:py-48 border-t border-border-subtle overflow-hidden">
                {/* Background glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-coral/5 blur-[150px] pointer-events-none" />

                <div className="max-w-[1400px] mx-auto px-6 md:px-10">
                    <div className="grid lg:grid-cols-2 gap-20">
                        {/* Left - Jobs */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7 }}
                        >
                            <span className="text-accent-lime text-sm font-semibold tracking-widest uppercase mb-4 block">
                                Careers
                            </span>
                            <h2 className="text-display-md font-extrabold tracking-tighter mb-6">
                                Looking out for
                                <br />
                                <span className="gradient-text">super people</span>
                            </h2>

                            <div className="space-y-3 mt-12">
                                {jobs.map((job, index) => (
                                    <motion.a
                                        key={job.title}
                                        href="#"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group flex items-center justify-between p-5 rounded-xl border border-border-subtle hover:border-border-hover bg-bg-secondary/30 hover:bg-bg-secondary/60 transition-all duration-500 block"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-text-primary group-hover:text-accent-coral transition-colors duration-300">
                                                {job.title}
                                            </h4>
                                            <span className="text-sm text-text-muted">{job.location}</span>
                                        </div>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-text-muted group-hover:text-accent-coral group-hover:translate-x-1 transition-all duration-300">
                                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.a>
                                ))}
                                <a href="#" className="inline-flex items-center gap-2 mt-4 text-sm text-accent-coral hover:underline font-medium">
                                    View all roles →
                                </a>
                            </div>
                        </motion.div>

                        {/* Right - Benefits */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            <span className="text-accent-lime text-sm font-semibold tracking-widest uppercase mb-4 block">
                                Benefits
                            </span>
                            <div className="space-y-4 mt-12">
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={benefit}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-4 py-3"
                                    >
                                        <span className="text-accent-lime text-lg">•</span>
                                        <span className="text-text-secondary text-base">{benefit}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative py-32 md:py-48 border-t border-border-subtle overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-coral/10 blur-[150px] animate-pulse-glow" />
                </div>

                <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <h2 className="text-display-lg font-extrabold tracking-tighter mb-6">
                            Stay
                            <br />
                            <span className="gradient-text-hero">updated</span>
                        </h2>
                        <p className="text-text-secondary text-lg mb-10 max-w-md mx-auto">
                            Definitely don&apos;t press this big red button
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="inline-block"
                    >
                        <button className="group relative px-12 py-5 rounded-full bg-gradient-to-r from-accent-coral via-accent-pink to-accent-coral bg-[length:200%_100%] animate-gradient-shift text-white font-bold text-lg hover:shadow-[0_0_60px_rgba(255,107,74,0.4)] transition-all duration-500 hover:scale-105">
                            <span className="relative z-10">🔴 Don&apos;t press</span>
                        </button>
                    </motion.div>

                    <div className="flex items-center justify-center gap-8 mt-16">
                        <a href="https://twitter.com/SuperlistHQ" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors duration-300 text-sm">
                            Twitter
                        </a>
                        <span className="text-border-subtle">|</span>
                        <a href="#jobs" className="text-text-muted hover:text-text-primary transition-colors duration-300 text-sm">
                            Jobs
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}
