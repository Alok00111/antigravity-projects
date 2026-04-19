import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "For the Record - Spotify",
  description: "Get the latest news, stories, and insights.",
};

export default function ForTheRecordPage() {
  return (
    <ContentPageLayout 
      title="For the Record" 
      subtitle="The latest news, insights, and stories."
    >
      <div className="content-section">
        <h2>Latest News</h2>
        <p>Explore the latest product announcements, company news, and stories from the world of audio streaming.</p>
        <p>
          Our mission is to unlock the potential of human creativity by giving a million creative artists the opportunity 
          to live off their art and billions of fans the opportunity to enjoy and be inspired by it.
        </p>
      </div>

      <div className="content-section">
        <h2>Audio Innovation</h2>
        <p>Discover how we push the boundaries of audio technology, deep learning, and personalization to build the best listening experience possible.</p>
        <p>From algorithmic playlists to spatial audio, our engineering teams are constantly innovating to deliver the future of sound.</p>
      </div>

      <div className="content-section">
        <h2>Culture & Impact</h2>
        <p>We believe audio has the power to change the world. Learn about our initiatives in sustainability, creator equity, and community building across the globe.</p>
      </div>

      <div className="content-section">
        <h2>Creator Spotlight</h2>
        <p>Every day, millions of artists and podcasters share their voice with the world. Read their stories — from bedroom producers breaking through to legendary artists reimagining their craft.</p>
      </div>
    </ContentPageLayout>
  );
}
