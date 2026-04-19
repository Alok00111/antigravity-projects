import { getSpotifyChart } from "@/lib/spotify";
import TrackRow from "@/components/player/TrackRow";
import { Clock } from "lucide-react";
import WebPlayerMainPlayButton from "@/components/player/WebPlayerMainPlayButton";

// Force this page to always be rendered dynamically (never statically cached at build)
export const dynamic = "force-dynamic";

const DUMMY_FALLBACK = {
  title: "Chart (Offline Mode)",
  description: "Could not reach the Spotify API. Showing placeholder data.",
  picture_big: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop",
  user: { name: "Offline" },
  fans: 0,
  nb_tracks: 3,
  tracks: [
    { id: 1, title: "No Connection", artist: { name: "Check Your Network" }, album: { title: "Debug", cover_medium: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop" }, preview: "", duration: 180 },
    { id: 2, title: "Waiting for API", artist: { name: "Localhost" }, album: { title: "Dev Mode", cover_medium: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop" }, preview: "", duration: 210 },
    { id: 3, title: "Keep Building", artist: { name: "The Developers" }, album: { title: "Ship It", cover_medium: "https://images.unsplash.com/photo-1493225457124-a1a2a441e887?q=80&w=200&auto=format&fit=crop" }, preview: "", duration: 245 },
  ],
};

export default async function WebPlayerPage() {
  let chartData: any = null;

  try {
    chartData = await getSpotifyChart();
  } catch (error) {
    console.warn("Failed to fetch Spotify chart, using fallback:", error);
  }

  // Get top tracks from chart, or fallback
  let tracks = DUMMY_FALLBACK.tracks;
  let playlistName = DUMMY_FALLBACK.title;
  let playlistDesc = DUMMY_FALLBACK.description;
  let playlistImage = DUMMY_FALLBACK.picture_big;

  if (chartData && chartData.error) {
    playlistDesc = `Could not reach the Spotify API. Debug: ${chartData.error}`;
  } else if (chartData && chartData.tracks && chartData.tracks.items) {
    tracks = chartData.tracks.items.map((item: any) => item.track).filter(Boolean);
    playlistName = chartData.name || "Global Top Charts";
    playlistDesc = chartData.description || "The biggest tracks in the world right now — powered by Spotify.";
    playlistImage = chartData.images?.[0]?.url || DUMMY_FALLBACK.picture_big;
  }
  const totalTracks = tracks.length;

  return (
    <div className="flex flex-col w-full pb-32">
      {/* Hero Header */}
      <div className="relative flex items-end h-[340px] px-8 pb-6 bg-gradient-to-b from-[#1DB954]/40 to-black/40 pt-20">
        <div className="absolute inset-0 bg-black/20 z-0" />
        <div className="relative z-10 flex items-end gap-6 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={playlistImage} 
            alt={playlistName} 
            className="w-56 h-56 object-cover shadow-2xl shadow-black/60"
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-white">
              Public Chart
            </span>
            <h1 className="text-5xl md:text-7xl font-bold font-[family-name:var(--font-outfit)] text-white tracking-tighter line-clamp-2">
              {playlistName}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
              {playlistDesc}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-white/80 font-medium">
              <span className="text-white hover:underline cursor-pointer">Spotify</span>
              <span className="w-1 h-1 rounded-full bg-white/60" />
              <span>{totalTracks} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Actions & Tracklist */}
      <div className="px-8 mt-6">
        {/* Play Button Row */}
        <div className="flex items-center gap-6 mb-8">
          <WebPlayerMainPlayButton tracks={tracks} />
          <button className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-colors">
            <span className="text-xl leading-none mb-1">+</span>
          </button>
        </div>

        {/* Tracklist Table Header */}
        <div className="flex items-center px-4 py-2 border-b border-white/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 sticky top-0 bg-[#121212]/95 backdrop-blur z-20">
          <div className="w-10 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="hidden md:block flex-1 px-4">Album</div>
          <div className="w-16 flex justify-end">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col gap-1">
          {tracks.map((track: any, index: number) => {
            if (!track) return null;

            const audioTrackData = {
              id: String(track.id),
              name: track.title || track.name || "Unknown",
              artist: track.artists?.[0]?.name || track.artist?.name || "Unknown Artist",
              image: track.album?.images?.[0]?.url || track.album?.cover_medium || track.album?.cover || "",
              previewUrl: track.preview_url || track.preview || null,
              spotifyUri: track.uri || `spotify:track:${track.id}`,
            };

            return (
              <TrackRow 
                key={`${track.id}-${index}`}
                track={audioTrackData}
                index={index}
                albumName={track.album?.title || track.album?.name || "Single"}
                durationMs={(track.duration || 30) * 1000}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
