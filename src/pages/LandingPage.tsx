// src/pages/LandingPage.tsx
// The public website. No login, no redirect - Raj shares the link or a QR
// code with sellers and brokers.
//
// The wrapper carries `landing`, which is what keeps the website's fonts
// and colours from reaching any cockpit.

import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { useAuth } from "../lib/AuthProvider";
import { Nav } from "../features/landing/components/Nav";
import { Hero } from "../features/landing/components/Hero";
import { WhatWeBuy } from "../features/landing/components/WhatWeBuy";
import { HowWeBuy } from "../features/landing/components/HowWeBuy";
import { Process } from "../features/landing/components/Process";
import { LeadForm } from "../features/landing/components/LeadForm";
import { ContactStrip } from "../features/landing/components/ContactStrip";
import { Footer } from "../features/landing/components/Footer";

export function LandingPage() {
  const { profile } = useAuth();

  const [assetType, setAssetType] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const handlePick = (asset: string) => {
    setAssetType(asset);
    document.getElementById("submit")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(
      () => nameRef.current?.focus({ preventScroll: true }),
      600,
    );
  };

  return (
    <div className="landing min-h-screen w-full bg-brand-cream font-landing text-brand-ink selection:bg-brand-azure/25 selection:text-brand-deep">
      {/* Only Raj. A customer has no cockpit to go back to. */}
      {profile?.cockpit === "raj" && (
        <Link
          className="fixed bottom-5 left-5 z-[60] inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2.5 font-display text-[0.82rem] font-bold text-brand-ink shadow-[0_14px_32px_-12px_rgba(22,78,124,0.45)] backdrop-blur-xl transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(22,78,124,0.55)]"
          to="/raj"
        >
          <ArrowLeftIcon aria-hidden="true" size={16} strokeWidth={2.5} />
          Back to Cockpit
        </Link>
      )}

      <Nav />

      <main>
        <Hero />
        <WhatWeBuy onPick={handlePick} />
        <HowWeBuy />
        <Process />
        <LeadForm
          assetType={assetType}
          nameRef={nameRef}
          onAssetTypeChange={setAssetType}
        />
        <ContactStrip />
      </main>

      <Footer />
    </div>
  );
}
