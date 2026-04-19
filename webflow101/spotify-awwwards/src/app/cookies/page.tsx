import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies - Spotify",
  description: "How Spotify uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <ContentPageLayout 
      title="Cookie Policy" 
      subtitle="How we use cookies and similar technologies."
    >
      <div className="content-section">
        <h2>What are cookies?</h2>
        <p>Cookies are small text files that are downloaded to your device when you visit a website. They allow the website to recognize your device and store some information about your preferences or past actions.</p>
      </div>

      <div className="content-section">
        <h2>How we use them</h2>
        <p>We use cookies to remember your preferences, provide security, understand how our website is used, and deliver personalized content and advertisements. You can modify your browser settings to decline cookies if you prefer.</p>
      </div>
    </ContentPageLayout>
  );
}
