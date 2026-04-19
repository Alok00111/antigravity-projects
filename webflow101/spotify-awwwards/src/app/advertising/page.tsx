import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spotify Advertising",
  description: "Reach your audience where they are listening.",
};

export default function AdvertisingPage() {
  return (
    <ContentPageLayout 
      title="Advertising" 
      subtitle="Connect with users in the moments that matter through Spotify audio and video ads."
    >
      <div className="content-section">
        <h2>Reach a Highly Engaged Audience</h2>
        <p>Spotify listeners are highly engaged, streaming music and podcasts across devices all day long. Advertising on Spotify lets you reach them during screenless moments when visual ads can't.</p>
        <p>Whether they're commuting, working out, or focusing at work, your message is delivered in a brand-safe environment with 100% share of voice.</p>
      </div>

      <div className="content-section">
        <h2>Ad Studio</h2>
        <p>Create and launch audio and video ad campaigns in minutes using Spotify Ad Studio. Our self-serve platform makes it easy to target your audience, set your budget, and measure your results.</p>
      </div>
    </ContentPageLayout>
  );
}
