import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/domain/landing/HeroSection";
import FeatureSection from "@/components/domain/landing/FeatureSection";
import StepSection from "@/components/domain/landing/StepSection";
import BenefitSection from "@/components/domain/landing/BenefitSection";
import CtaSection from "@/components/domain/landing/CtaSection";
import Footer from "@/components/domain/landing/Footer";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col w-full min-h-screen">
        <HeroSection />
        <FeatureSection />
        <StepSection />
        <BenefitSection />
        <CtaSection />
        <Footer />
      </div>
    </MainLayout>
  );
}
