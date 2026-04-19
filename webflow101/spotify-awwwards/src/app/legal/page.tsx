import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal - Spotify",
  description: "Terms and conditions of use for Spotify.",
};

export default function LegalPage() {
  return (
    <ContentPageLayout 
      title="Legal Terms" 
      subtitle="Terms and Conditions of Use"
    >
      <div className="content-section">
        <h2>1. Introduction</h2>
        <p>Please read these Terms and Conditions of Use (these "Terms") carefully as they govern your use of Spotify's personalized services for streaming music and other content.</p>
        <p>By signing up for, or otherwise using, the Spotify service, you agree to these Terms. If you do not agree to these Terms, then you must not use the Spotify Service or access any Content.</p>
      </div>

      <div className="content-section">
        <h2>2. Our Services & Paid Subscriptions</h2>
        <p>Spotify provides audio streaming options. Certain Spotify services are provided to you free-of-charge, while other services require payment before you can access them.</p>
      </div>
    </ContentPageLayout>
  );
}
