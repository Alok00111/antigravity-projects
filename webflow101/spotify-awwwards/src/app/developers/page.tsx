import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spotify for Developers",
  description: "Build something beautiful with the Spotify Web API.",
};

export default function DevelopersPage() {
  return (
    <ContentPageLayout 
      title="Spotify for Developers" 
      subtitle="Build your next audio experience using our APIs and SDKs."
    >
      <div className="content-section">
        <h2>Web API</h2>
        <p>Based on simple REST principles, the Spotify Web API endpoints return JSON metadata about music artists, albums, and tracks, directly from the Spotify Data Catalogue.</p>
        <p>Web API also provides access to user related data, like playlists and music that the user saves in the Your Music library. Such access is enabled through selective authorization, by the user.</p>
      </div>

      <div className="content-section">
        <h2>SDKs & Widgets</h2>
        <p>Embed Spotify into your applications with our robust suite of SDKs available for Web, iOS, and Android. Create deep integrations, control playback, and enhance your user's experience.</p>
      </div>
    </ContentPageLayout>
  );
}
