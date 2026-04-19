"use client";

import { motion } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useUI } from "@/context/UIContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { openModal } = useUI();

  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
            <Sparkles className="w-5 h-5 text-brand-400" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-white">
            MeetScribe AI
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#demo" className="hover:text-white transition-colors">How it Works</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" onClick={() => openModal('login')} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors rounded-xl">
            Log in
          </Button>
          <Button 
            onClick={() => openModal('signup')}
            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-gray-300 hover:text-white cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu (simplified dropdown) */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 mt-2 p-4 glass rounded-2xl mx-auto flex flex-col gap-4 max-w-7xl"
        >
          <Link href="#features" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white p-2">Features</Link>
          <Link href="#demo" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white p-2">How it Works</Link>
          <Link href="#pricing" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white p-2">Pricing</Link>
          <div className="h-px bg-white/10 my-2" />
          <button onClick={() => { openModal('login'); setIsOpen(false); }} className="text-left text-gray-300 hover:text-white p-2">Log in</button>
          <button onClick={() => { openModal('signup'); setIsOpen(false); }} className="bg-white text-black text-center p-3 rounded-xl font-medium w-full">Get Started for Free</button>
        </motion.div>
      )}
    </nav>
  );
}
