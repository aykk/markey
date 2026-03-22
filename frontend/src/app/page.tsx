import { ContextSection } from "@/components/ContextSection";
import { ContentSections } from "@/components/ContentSections";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col bg-off-white">
      <Navbar />
      <div className="markey-enter">
        <ContextSection />
      </div>
      <div className="markey-enter-delay">
        <ContentSections />
      </div>
    </div>
  );
}
