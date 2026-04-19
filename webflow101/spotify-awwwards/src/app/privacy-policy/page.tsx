import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Spotify",
  description: "Read the full Spotify Privacy Policy.",
};

export default function PrivacyPolicyPage() {
  return (
    <ContentPageLayout 
      title="Privacy Policy" 
      subtitle="Detailed information on how we collect, use, and share your data."
    >
      <div className="content-section">
        <h2>1. About this Policy</h2>
        <p>This Privacy Policy sets out the essential details relating to your personal data relationship with Spotify AB. The Policy applies to all Spotify services and any associated services.</p>
      </div>

      <div className="content-section">
        <h2>2. Data Collection</h2>
        <p>We collect certain data when you use our service, such as your email address, birth date, gender, and voice data if you use our voice features. We also collect usage data about how you interact with the Spotify Service.</p>
      </div>
    </ContentPageLayout>
  );
}
