"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { Button } from "@/components/ui/button";

export default function CTA() {
  const { openModal } = useUI();
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden glass border border-brand-500/20 px-8 py-20 text-center"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-transparent to-blue-900/40 -z-10" />
          
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Ready to transform your meetings?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals saving 5+ hours a week. Get started for free today, no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => openModal('signup')} className="w-full sm:w-auto px-8 py-6 bg-white text-black rounded-xl font-bold tracking-wide hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-white/90">
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm text-gray-500 sm:ml-4 mt-4 sm:mt-0">
              Only takes 30 seconds to setup.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
