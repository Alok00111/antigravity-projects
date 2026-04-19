import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductDemo from "@/components/ProductDemo";
import Features from "@/components/Features";
import Workflow from "@/components/Workflow";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative selection:bg-brand-500/30 overflow-hidden">
      <Navbar />
      <Hero />
      <ProductDemo />
      <Features />
      <Workflow />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
