import Navbar from "@/components/Navbar";
import FooterCTA from "@/components/sections/FooterCTA";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { NumberTicker } from "@/components/ui/number-ticker";
import { TextAnimate } from "@/components/ui/text-animate";
import { WordRotate } from "@/components/ui/word-rotate";

export default function ArtistsPage() {
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-spotify selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 min-h-[80vh] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Deep, Moody Studio Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,185,84,0.1)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-spotify/30 bg-spotify/10 text-spotify text-xs tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-spotify animate-pulse" />
            Spotify for Artists
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 font-[family-name:var(--font-outfit)] text-glow-white">
            <TextAnimate animation="blurInUp" by="word" as="span" className="inline-block" startOnView={false}>Your music.</TextAnimate> <br />
            <span className="text-muted-foreground">
              <TextAnimate animation="blurInUp" by="word" delay={0.2} as="span" className="inline-block" startOnView={false}>Your audience.</TextAnimate>
            </span> <br />
            <span className="text-gradient-green text-glow-green">
              Your <WordRotate words={["terms.", "fans.", "future.", "growth."]} className="text-gradient-green" duration={3000} />
            </span>
          </h1>
          <TextAnimate 
            as="p" 
            animation="blurIn" 
            by="word" 
            delay={0.4} 
            startOnView={false}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Get the tools you need to build your fan base, analyze your streaming data, and pitch your unreleased tracks to our editorial team.
          </TextAnimate>
          <button className="px-8 py-4 rounded-full bg-white text-black text-sm font-bold hover:bg-spotify hover:shadow-[0_0_40px_rgba(29,185,84,0.4)] transition-all duration-300">
            Claim Your Profile
          </button>
        </div>
      </section>

      {/* Analytics Dashboard Preview */}
      <section className="section-padding relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 md:mb-24 md:flex items-end justify-between">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 font-[family-name:var(--font-outfit)]">
                Know who <br className="hidden md:block" />
                is listening.
              </h2>
              <p className="text-lg text-muted-foreground">
                Dive deep into real-time statistics. Understand where your listeners live, what else they listen to, and how they discovered your specific tracks.
              </p>
            </div>
            <div className="mt-8 md:mt-0">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-background bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xs font-mono">{i}k+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SpotlightCard className="p-8 md:p-12" spotlightColor="rgba(29, 185, 84, 0.15)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Stat 1 */}
              <div className="border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-8">
                <div className="text-sm tracking-widest uppercase text-muted-foreground mb-4 block">Monthly Listeners</div>
                <div className="text-5xl font-bold mb-2 font-[family-name:var(--font-outfit)]"><NumberTicker value={842019} className="text-white dark:text-white" /></div>
                <div className="text-sm text-spotify flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  +12.4% vs last month
                </div>
              </div>
              {/* Stat 2 */}
              <div className="border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:px-8">
                <div className="text-sm tracking-widest uppercase text-muted-foreground mb-4 block">Total Streams</div>
                <div className="text-5xl font-bold mb-2 font-[family-name:var(--font-outfit)]"><NumberTicker value={12.4} decimalPlaces={1} className="text-white dark:text-white" />M</div>
                <div className="text-sm text-spotify flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  +4.2% vs last month
                </div>
              </div>
              {/* Stat 3 */}
              <div className="md:pl-8">
                <div className="text-sm tracking-widest uppercase text-muted-foreground mb-4 block">Top City</div>
                <div className="text-5xl font-bold mb-2 font-[family-name:var(--font-outfit)]">London</div>
                <div className="text-sm text-muted-foreground"><NumberTicker value={32491} className="text-white dark:text-white" /> listeners</div>
              </div>
            </div>

            {/* Mock Chart Area */}
            <div className="mt-12 h-64 border border-white/10 rounded-2xl relative overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
              {/* Fake grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-4">
                {[1,2,3,4].map(i => <div key={i} className="w-full h-[1px] bg-white/5" />)}
              </div>
              {/* Fake chart line */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0 80 Q 20 70, 40 50 T 70 30 T 100 10" fill="none" stroke="#1DB954" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0 80 Q 20 70, 40 50 T 70 30 T 100 10 L 100 100 L 0 100 Z" fill="url(#grad)" opacity="0.2" />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1DB954" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* Pitch Feature */}
      <section className="section-padding py-32 relative bg-black">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative perspective-1000">
            {/* 3D Tilted Mockup Container */}
            <div className="relative transform-gpu rotate-y-12 rotate-x-12 scale-90 hover:rotate-0 hover:scale-100 transition-all duration-700">
              <SpotlightCard className="p-1 aspect-square md:aspect-video lg:aspect-square relative overflow-hidden border-spotify/30">
                <div className="absolute inset-0 bg-gradient-to-br from-[#121212] flex flex-col justify-between p-8">
                  <div className="flex justify-between items-start">
                    <div className="w-16 h-16 bg-white/10 rounded-lg" />
                    <div className="px-3 py-1 rounded-full border border-spotify text-spotify text-xs">Unreleased</div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-2">Midnight Sunrise</h4>
                    <p className="text-muted-foreground text-sm">Release date: Nov 24</p>
                  </div>
                  <div className="w-full h-12 rounded-full bg-white text-black flex items-center justify-center font-bold mt-8">
                    Pitch to Editors
                  </div>
                </div>
              </SpotlightCard>
              {/* Floating element 1 */}
              <div className="absolute -top-10 -right-10 bg-zinc-900 border border-white/10 p-4 rounded-xl shadow-2xl glass transform translate-z-10 animate-float-slow">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-spotify/20 flex items-center justify-center text-spotify">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-sm font-medium">Added to RapCaviar</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 lg:pl-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-8 font-[family-name:var(--font-outfit)]">
              Skip the <span className="text-gradient-green">middleman</span>.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Have an unreleased track you're proud of? Pitch it directly to our editorial team right from your dashboard. We listen to every pitch, and if it's a fit, we'll slot it into one of our thousands of curated playlists.
            </p>
            <ul className="space-y-4 mb-10">
              {['Reach entirely new audiences globally', 'Boost your algorithmic placement', 'Grow your monthly listeners overnight'].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full bg-spotify/20 flex items-center justify-center text-spotify shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FooterCTA />
    </main>
  );
}
