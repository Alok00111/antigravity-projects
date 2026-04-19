import Navbar from "@/components/Navbar";
import FooterCTA from "@/components/sections/FooterCTA";
import SpotlightCard from "@/components/ui/SpotlightCard";

export default function DownloadPage() {
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-spotify selection:text-black flex flex-col">
      <Navbar />

      <section className="flex-1 pt-40 pb-20 px-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-spotify/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 font-[family-name:var(--font-outfit)]">
            Listening is <span className="text-spotify">everything</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12">
            Millions of songs and podcasts. No credit card needed.
          </p>
          <a 
            href="https://www.spotify.com/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-5 rounded-full bg-spotify text-black font-bold text-lg hover:bg-[#1ed760] hover:scale-105 hover:shadow-[0_0_40px_rgba(29,185,84,0.4)] transition-all duration-300"
          >
            Download Spotify Free
          </a>
        </div>

        {/* Devices showcase (Abstracted with CSS shapes/glass for simplicity & performance) */}
        <div className="relative w-full max-w-5xl mx-auto h-[300px] md:h-[500px] mt-10 z-10 flex items-end justify-center perspective-[1000px]">
          {/* Mock Laptop */}
          <div className="relative w-[300px] h-[200px] md:w-[600px] md:h-[380px] rounded-t-2xl border-x-4 border-t-4 border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black transform rotateX-[10deg] translate-y-12">
            <div className="absolute top-0 left-0 w-full h-8 bg-zinc-900 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <div className="absolute top-8 bottom-0 left-0 w-48 bg-black/60 border-r border-white/5 hidden md:block" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-spotify blur-[20px] opacity-20">
               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 14.2a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4zm2.1-4.2a2.1 2.1 0 10-4.2 0 2.1 2.1 0 004.2 0z"/></svg>
            </div>
          </div>
          
          {/* Mock Phone */}
          <div className="absolute right-[5%] md:right-[15%] bottom-0 w-[100px] h-[200px] md:w-[180px] md:h-[360px] rounded-3xl border-4 border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black transform rotate-[-5deg] translate-y-4">
             <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/3 h-4 bg-zinc-900 rounded-full" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/5 rounded-full blur-2xl" />
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-24 px-6 bg-zinc-950 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center justify-between">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-4 font-[family-name:var(--font-outfit)]">Also available on</h2>
            <p className="text-muted-foreground">Download the app on all your devices.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {['Mac', 'Windows', 'iOS', 'Android', 'Linux'].map((os) => (
              <a 
                key={os} 
                href="https://www.spotify.com/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 hover:border-white/40 transition-all"
              >
                {os}
              </a>
            ))}
          </div>
        </div>
      </section>

      <FooterCTA />
    </main>
  );
}
