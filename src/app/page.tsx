import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { LandingHeader } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { WeaknessSection } from "@/components/landing/WeaknessSection";
import { UploadFlow } from "@/components/landing/UploadFlow";
import { PdfTranslateSection } from "@/components/landing/PdfTranslateSection";
import { ToolsStrip } from "@/components/landing/ToolsStrip";
import { OpportunitySection } from "@/components/landing/OpportunitySection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Faq } from "@/components/landing/Faq";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { LandingFooter } from "@/components/landing/Footer";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user;
  const userName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <div
      className="relative bg-sb-bg font-body-kr"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 35%, rgba(194,255,61,0.08), transparent 40%)",
      }}
    >
      <AmbientBackground />
      <div className="relative z-10">
        <LandingHeader loggedIn={loggedIn} userName={userName} />
        <main>
          <Hero loggedIn={loggedIn} />
          <Features />
          <WeaknessSection />
          <UploadFlow />
          <PdfTranslateSection />
          <ToolsStrip />
          <OpportunitySection />
          <PricingSection />
          <Faq />
          <CtaBanner loggedIn={loggedIn} />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
