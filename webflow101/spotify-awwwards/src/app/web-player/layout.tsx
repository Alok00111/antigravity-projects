import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PlayerProvider } from "@/context/PlayerContext";
import Sidebar from "@/components/player/Sidebar";
import BottomPlayer from "@/components/player/BottomPlayer";

export default async function WebPlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("spotify_access_token")?.value;
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

  // If the user hasn't connected Spotify, force them to login before accessing the web player
  if (!token && !refreshToken) {
    redirect("/api/spotify/login");
  }

  return (
    <PlayerProvider>
      <div className="flex h-screen bg-black overflow-hidden relative">
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-[#222222] to-black h-[calc(100vh-96px)]">
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </div>

        {/* Global Player anchored to the bottom */}
        <BottomPlayer />
      </div>
    </PlayerProvider>
  );
}
