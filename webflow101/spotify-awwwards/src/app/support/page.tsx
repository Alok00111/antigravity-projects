import Navbar from "@/components/Navbar";
import FooterCTA from "@/components/sections/FooterCTA";
import SpotlightCard from "@/components/ui/SpotlightCard";

const topics = [
  { icon: "💳", title: "Payment Help", desc: "Manage payments, receipts, and subscriptions" },
  { icon: "👤", title: "Account Help", desc: "Login issues, profile updates, and security" },
  { icon: "📱", title: "App Help", desc: "Troubleshooting the Spotify app on devices" },
  { icon: "🔒", title: "Safety & Privacy", desc: "Protecting your account and data" },
  { icon: "🎧", title: "Listening Experience", desc: "Audio quality, offline mode, and lyrics" },
  { icon: "🎙️", title: "Podcasts", desc: "Finding and managing podcast subscriptions" },
];

export default function SupportPage() {
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-spotify selection:text-black">
      <Navbar />

      {/* Hero Search Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-spotify/5 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 font-[family-name:var(--font-outfit)]">
            How can we help you?
          </h1>
          
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-6 h-6 text-muted-foreground group-focus-within:text-spotify transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search for answers..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-4 text-white placeholder-muted-foreground focus:outline-none focus:border-spotify/50 focus:bg-white/10 transition-all text-lg"
            />
            {/* Glow on focus */}
            <div className="absolute inset-0 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen shadow-[0_0_30px_rgba(29,185,84,0.1)]" />
          </div>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {topics.map((topic) => (
               <SpotlightCard key={topic.title} className="p-0 overflow-hidden bg-zinc-900 border-white/5 group">
                  <a href="#" className="block p-8 h-full transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-bottom-left">{topic.icon}</div>
                    <h3 className="text-xl font-bold mb-2 font-[family-name:var(--font-outfit)]">{topic.title}</h3>
                    <p className="text-muted-foreground text-sm">{topic.desc}</p>
                  </a>
               </SpotlightCard>
             ))}
           </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-[family-name:var(--font-outfit)]">Still need help?</h2>
          <p className="text-muted-foreground mb-8">Visit the Spotify Community to get answers from advanced users.</p>
          <button className="px-8 py-4 rounded-full border border-white/20 text-white font-bold hover:bg-white/5 hover:border-white/40 transition-all duration-300">
            Go to Community
          </button>
        </div>
      </section>

      <FooterCTA />
    </main>
  );
}
