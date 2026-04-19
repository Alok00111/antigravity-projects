import ContentPageLayout from "@/components/layout/ContentPageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor Relations - Spotify",
  description: "Financial information, corporate governance, and updates for Spotify investors.",
};

export default function InvestorsPage() {
  return (
    <ContentPageLayout 
      title="Investor Relations" 
      subtitle="Financial performance, corporate governance, and shareholder information."
    >
      <div className="content-section">
        <h2>Financials</h2>
        <p>Access our quarterly earnings reports, SEC filings, annual reports, and proxy statements. We strive to provide transparent and timely financial information to all our stakeholders.</p>
        <p>Our goal is to sustainably grow our business while continuing to innovate and expand our product offerings worldwide.</p>
      </div>

      <div className="content-section">
        <h2>Corporate Governance</h2>
        <p>Spotify is committed to strong corporate governance practices that promote long-term value creation. Review our committee charters, governance guidelines, and code of conduct.</p>
      </div>
    </ContentPageLayout>
  );
}
