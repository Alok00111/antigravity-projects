"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";

const navLinks = [
    { name: "Manifesto", href: "#manifesto" },
    { name: "Team", href: "#team" },
    { name: "News", href: "#news" },
    { name: "Jobs", href: "#jobs" },
];

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                isScrolled
                    ? "glass-strong py-3"
                    : "bg-transparent py-5"
            )}
        >
            <div className="mx-auto max-w-[1400px] px-6 md:px-10 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-accent-coral to-accent-pink flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-bold text-xl relative z-10">S</span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-text-primary hidden sm:block">
                        Superlist
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link, i) => (
                        <motion.div
                            key={link.name}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.5 }}
                        >
                            <Link
                                href={link.href}
                                className="relative px-5 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-300 group"
                            >
                                {link.name}
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-accent-coral group-hover:w-3/4 transition-all duration-300" />
                            </Link>
                        </motion.div>
                    ))}
                </nav>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="hidden md:block"
                >
                    <button className="relative px-6 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-accent-coral to-accent-pink hover:shadow-[0_0_30px_rgba(255,107,74,0.3)] transition-all duration-300 hover:scale-105">
                        Be the first to know
                    </button>
                </motion.div>

                {/* Mobile Menu */}
                <button
                    className="md:hidden p-2 text-text-primary"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <div className="w-6 h-5 flex flex-col justify-between">
                        <span className={cn(
                            "block w-full h-0.5 bg-text-primary transition-all duration-300 origin-center",
                            isMobileMenuOpen && "rotate-45 translate-y-[9px]"
                        )} />
                        <span className={cn(
                            "block w-full h-0.5 bg-text-primary transition-all duration-300",
                            isMobileMenuOpen && "opacity-0 scale-0"
                        )} />
                        <span className={cn(
                            "block w-full h-0.5 bg-text-primary transition-all duration-300 origin-center",
                            isMobileMenuOpen && "-rotate-45 -translate-y-[9px]"
                        )} />
                    </div>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="md:hidden overflow-hidden glass-strong border-t border-border-subtle"
                    >
                        <div className="px-6 py-8 flex flex-col gap-2">
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                >
                                    <Link
                                        href={link.href}
                                        className="block py-3 text-2xl font-semibold text-text-secondary hover:text-text-primary hover:pl-2 transition-all duration-300"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="mt-6 pt-6 border-t border-border-subtle">
                                <button className="w-full px-6 py-3 text-base font-semibold text-white rounded-full bg-gradient-to-r from-accent-coral to-accent-pink">
                                    Be the first to know
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
