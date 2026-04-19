import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Center - Spotify",
  description: "Understand your privacy rights and how Spotify protects your data.",
};

export default function PrivacyCenterPage() {
  return (
    <ContentPageLayout 
      title="Privacy Center" 
      subtitle="Your data, your control. Understand how we manage and protect your information."
    >
      <div className="content-section">
        <h2>Transparency and Choice</h2>
        <p>At Spotify, we want to give you the best possible experience to ensure that you enjoy our service today, tomorrow, and in the future. To do this we need to understand your listening habits so we can deliver an exceptional and personalized service.</p>
        <p>Your privacy and the security of your personal data is, and will always be, enormously important to us.</p>
      </div>

      <div className="content-section">
        <h2>Manage Your Privacy</h2>
        <p>You can manage your privacy settings, control what data you share with us, and download a copy of your personal data at any time from your account settings.</p>
      </div>
    </ContentPageLayout>
  );
}
