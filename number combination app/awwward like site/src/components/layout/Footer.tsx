"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Footer() {
    return (
        <footer className="relative border-t border-border-subtle bg-bg-primary">
            <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {/* Legal Info */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-coral to-accent-pink flex items-center justify-center">
                                <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="font-bold text-lg text-text-primary">Superlist</span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8 text-sm text-text-muted">
                            <div>
                                <h4 className="text-text-secondary font-semibold mb-3">Superlist Software GmbH</h4>
                                <p className="leading-relaxed">
                                    c/o Kubota<br />
                                    Rückerstrasse 5<br />
                                    10119 Berlin<br />
                                    <a href="mailto:hello@superlist.com" className="text-accent-coral hover:underline mt-1 inline-block">
                                        hello@superlist.com
                                    </a>
                                </p>
                            </div>
                            <div>
                                <h4 className="text-text-secondary font-semibold mb-3">Managing Director</h4>
                                <p className="leading-relaxed mb-4">Steffen Kiedel, Ben Kubota</p>

                                <h4 className="text-text-secondary font-semibold mb-3">Commercial Register</h4>
                                <p className="leading-relaxed">
                                    Local Court (Amtsgericht) of Charlottenburg HRB 219633 B
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="flex flex-col gap-6">
                        <nav className="flex flex-col gap-3">
                            {[
                                { label: "Twitter", href: "https://twitter.com/SuperlistHQ", external: true },
                                { label: "Jobs", href: "#jobs", external: false },
                                { label: "Privacy", href: "#", external: false },
                            ].map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    target={link.external ? "_blank" : undefined}
                                    rel={link.external ? "noopener noreferrer" : undefined}
                                    className="text-text-muted hover:text-text-primary transition-colors duration-300 text-sm group inline-flex items-center gap-2"
                                >
                                    {link.label}
                                    {link.external && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border-subtle mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-text-muted">
                        © Superlist {new Date().getFullYear()}
                    </p>
                    <p className="text-xs text-text-muted max-w-md text-center sm:text-right">
                        We assume no liability for the content of websites linked to us.
                    </p>
                </div>
            </div>
        </footer>
    );
}
