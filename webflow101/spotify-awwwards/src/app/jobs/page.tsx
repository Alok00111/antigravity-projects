import Navbar from "@/components/Navbar";
import FooterCTA from "@/components/sections/FooterCTA";
import SpotlightCard from "@/components/ui/SpotlightCard";

const roles = [
  { team: "Engineering", title: "Senior Frontend Engineer, Web Platform", location: "New York, USA" },
  { team: "Design", title: "Product Designer, Core Experience", location: "Stockholm, Sweden" },
  { team: "Machine Learning", title: "Machine Learning Engineer, Discovery", location: "Remote, Global" },
  { team: "Product", title: "Product Manager, Creator Tools", location: "London, UK" },
];

export default function JobsPage() {
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-spotify selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Abstract Background Noise */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(29,185,84,0.08)_0%,transparent_70%)]" />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs tracking-widest uppercase mb-8">
              Spotify Careers
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 font-[family-name:var(--font-outfit)]">
              Join the band.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              We're looking for passionate people to join us on our mission to unlock the potential of human creativity. Come build the future of audio.
            </p>
            <div className="flex items-center gap-4">
              <button className="px-8 py-4 rounded-full bg-spotify text-black text-sm font-bold hover:bg-[#1ed760] hover:shadow-[0_0_40px_rgba(29,185,84,0.3)] transition-all duration-300">
                View Open Roles
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative w-full aspect-square md:aspect-auto md:h-[500px] rounded-3xl overflow-hidden glass border-white/10 group">
            {/* Culture Image */}
            <img 
              src="/jobs-culture.png" 
              alt="Spotify Culture - Team collaborating" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* Glowing Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-spotify/20 rounded-full blur-[100px] mix-blend-screen" />
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-20 border-y border-white/[0.04] bg-white/[0.01] overflow-hidden flex flex-col items-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">Build with the best tech</p>
        
        {/* Simple CSS Marquee */}
        <div className="relative w-full overflow-hidden whitespace-nowrap group">
          <div className="flex gap-16 md:gap-32 w-max animate-marquee font-bold text-3xl md:text-5xl text-white/20 uppercase font-[family-name:var(--font-outfit)] group-hover:text-white/40 transition-colors duration-500">
            <span>React</span>
            <span>•</span>
            <span>Next.js</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Rust</span>
            <span>•</span>
            <span>Go</span>
            <span>•</span>
            <span>Kubernetes</span>
            <span>•</span>
            <span>TensorFlow</span>
            <span>•</span>
            <span>React</span>
            <span>•</span>
            <span>Next.js</span>
            <span>•</span>
            <span>TypeScript</span>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 font-[family-name:var(--font-outfit)]">
              Open Roles
            </h2>
            <p className="text-lg text-muted-foreground">Find your next gig.</p>
          </div>

          <div className="space-y-4">
            {roles.map((role) => (
              <SpotlightCard key={role.title} className="p-0 border border-white/5 overflow-hidden group">
                <a href="#" className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 hover:bg-white/[0.02] transition-colors relative z-10">
                  <div>
                    <div className="text-spotify text-sm font-bold tracking-widest uppercase mb-2">
                      {role.team}
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-foreground group-hover:text-white transition-colors">
                      {role.title}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-6">
                    <span className="text-sm text-muted-foreground">{role.location}</span>
                    <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 group-hover:text-white group-hover:border-white transition-all bg-background">
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </a>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      <FooterCTA />
    </main>
  );
}
