"use client";

import { usePlayer } from "@/context/PlayerContext";

export default function WebPlayerMainPlayButton({ tracks }: { tracks: any[] }) {
  const { playTrack, isPlaying, currentTrack, togglePlayPause } = usePlayer();

  const handlePlayClick = () => {
    if (tracks.length === 0) return;
    
    if (currentTrack && isPlaying) {
      togglePlayPause();
      return;
    }

    const firstTrack = tracks[0];
    const audioTrackData = {
      id: String(firstTrack.id),
      name: firstTrack.title || firstTrack.name || "Unknown",
      artist: firstTrack.artists?.[0]?.name || firstTrack.artist?.name || "Unknown Artist",
      image: firstTrack.album?.images?.[0]?.url || firstTrack.album?.cover_medium || firstTrack.album?.cover || "",
      previewUrl: firstTrack.preview_url || firstTrack.preview || null,
      spotifyUri: firstTrack.uri || `spotify:track:${firstTrack.id}`,
    };
    playTrack(audioTrackData);
  };

  return (
    <button 
      onClick={handlePlayClick}
      className="w-14 h-14 bg-spotify rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg shadow-spotify/20"
    >
      <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
    </button>
  );
}
