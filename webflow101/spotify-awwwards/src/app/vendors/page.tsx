import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Information - Spotify",
  description: "Information for existing and prospective Spotify vendors.",
};

export default function VendorsPage() {
  return (
    <ContentPageLayout 
      title="Vendors" 
      subtitle="Partnering with Spotify to build the world's leading audio platform."
    >
      <div className="content-section">
        <h2>Supplier Code of Conduct</h2>
        <p>We expect our vendors to uphold the highest standards of integrity, ethics, and sustainability. All partners must adhere to our comprehensive Supplier Code of Conduct.</p>
        <p>This includes commitments to human rights, fair labor practices, environmental responsibility, and ethical business conduct.</p>
      </div>

      <div className="content-section">
        <h2>Becoming a Vendor</h2>
        <p>If you offer products or services that can help Spotify innovate and grow, we want to hear from you. Our procurement team manages all vendor onboarding and relationships globally.</p>
      </div>
    </ContentPageLayout>
  );
}
