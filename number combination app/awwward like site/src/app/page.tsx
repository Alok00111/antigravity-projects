import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { InteractiveList } from "@/components/home/InteractiveList";
import { CtaSection } from "@/components/home/CtaSection";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Features />
      <InteractiveList />
      <CtaSection />
    </div>
  );
}
