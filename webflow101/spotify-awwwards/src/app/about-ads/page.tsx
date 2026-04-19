import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Ads - Spotify",
  description: "Learn about the advertisements you see on Spotify.",
};

export default function AboutAdsPage() {
  return (
    <ContentPageLayout 
      title="About Ads" 
      subtitle="Information about the ads you hear and see on Spotify Free."
    >
      <div className="content-section">
        <h2>Ad-Supported Spotify</h2>
        <p>Spotify Free is supported by advertising. The ads you hear and see help us provide a massive catalog of music to listeners globally at no cost.</p>
        <p>We aim to show you ads that are relevant and useful to you based on your stated interests and engagement with our platform.</p>
      </div>

      <div className="content-section">
        <h2>Your Choices</h2>
        <p>You have control over the ads you see. You can opt out of tailored advertising based on your third-party browsing data in your account privacy settings.</p>
      </div>
    </ContentPageLayout>
  );
}
