"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useUI } from "@/context/UIContext";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for individuals just getting started with AI notes.",
    features: ["5 meetings per month", "Standard transcription", "Basic AI summaries", "7-day history"],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$15",
    period: "/mo",
    desc: "For professionals who live in meetings and need deep insights.",
    features: ["Unlimited meetings", "High-accuracy transcription", "Advanced AI summaries & action items", "CRM Integrations", "Unlimited history"],
    highlighted: true,
    cta: "Start 14-day Free Trial",
  },
  {
    name: "Teams",
    price: "$29",
    period: "/user/mo",
    desc: "For organizations that want to align perfectly.",
    features: ["Everything in Pro", "Team workspaces", "Shared vocabulary", "SSO & Advanced Security", "Priority 24/7 Support"],
    highlighted: false,
    cta: "Contact Sales",
  },
];

export default function Pricing() {
  const { openModal } = useUI();
  return (
    <section id="pricing" className="py-24 relative z-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-900/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-heading font-bold mb-6 text-white"
          >
            Simple, <span className="text-gradient-brand">Transparent</span> Pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-xl mx-auto text-lg"
          >
            Invest in your productivity. Cancel anytime.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`relative rounded-3xl p-8 ${
                tier.highlighted 
                  ? "bg-brand-950/40 border border-brand-500/50 shadow-2xl shadow-brand-500/20 md:-translate-y-4" 
                  : "glass-card"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-heading font-bold text-white mb-2">{tier.name}</h3>
              <p className="text-gray-400 text-sm mb-6 h-10">{tier.desc}</p>
              
              <div className="mb-8 flex items-end gap-1">
                <span className="text-5xl font-bold text-white tracking-tight">{tier.price}</span>
                {tier.period && <span className="text-gray-500 font-medium mb-1">{tier.period}</span>}
              </div>

              <button onClick={() => openModal('signup')} className={`w-full py-3 rounded-xl font-medium transition-all duration-300 mb-8 ${
                tier.highlighted
                  ? "bg-brand-500 text-white hover:bg-brand-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}>
                {tier.cta}
              </button>

              <div className="space-y-4">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${tier.highlighted ? "text-brand-400" : "text-gray-500"}`} />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
