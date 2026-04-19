import { searchSpotify } from "@/lib/spotify";
import TrackRow from "@/components/player/TrackRow";
import SearchInput from "@/components/player/SearchInput";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";
  let tracks: any[] = [];
  let error = null;

  if (query) {
    const data = await searchSpotify(query);
    if (data && data.tracks && data.tracks.items) {
      tracks = data.tracks.items.filter(Boolean);
    } else {
      error = "No results found or API error.";
    }
  }

  return (
    <div className="flex flex-col w-full pb-32">
      <div className="relative flex flex-col justify-end h-[240px] px-8 pb-6 bg-gradient-to-b from-neutral-800 to-[#121212] pt-20">
        <div className="absolute inset-0 bg-black/20 z-0" />
        <div className="relative z-10 w-full mb-4">
          <SearchInput />
        </div>
      </div>

      <div className="px-8 mt-6 min-h-[50vh]">
        {!query ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-32">
            <h2 className="text-2xl font-bold text-white mb-2">Search Spotify</h2>
            <p>Find your favorite songs, artists, and playlists.</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-32">
            <h2 className="text-xl font-semibold text-white mb-2">No results found for &quot;{query}&quot;</h2>
            <p>Please make sure your words are spelled correctly, or use fewer or different keywords.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center px-4 py-2 border-b border-white/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 sticky top-0 bg-[#121212]/95 backdrop-blur z-20">
              <div className="w-10 text-center">#</div>
              <div className="flex-1">Title</div>
              <div className="hidden md:block flex-1 px-4">Album</div>
              <div className="w-16 flex justify-end">
                <Clock className="w-4 h-4" />
              </div>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}
