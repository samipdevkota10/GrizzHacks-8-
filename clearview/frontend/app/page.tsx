import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LogoMarquee from "@/components/landing/LogoMarquee";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import IntegrationSection from "@/components/landing/IntegrationSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <LogoMarquee />
      <FeaturesSection />
      <HowItWorks />
      <IntegrationSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
