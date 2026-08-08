import { LandingHeader } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { AboutSection } from "@/components/landing/AboutSection";
import { UploadFlow } from "@/components/landing/UploadFlow";
import { Features } from "@/components/landing/Features";
import { ToolsStrip } from "@/components/landing/ToolsStrip";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { Faq } from "@/components/landing/Faq";
import { LandingFooter } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="bg-sb-bg font-body-kr">
      <LandingHeader />
      <main>
        <Hero />
        <AboutSection />
        <UploadFlow />
        <Features />
        <ToolsStrip />
        <CtaBanner />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  );
}
