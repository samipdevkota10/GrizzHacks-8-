"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

const AnimatedBlock = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <AnimatedBlock className="text-center mb-16">
          <span className="section-badge mb-4 inline-flex">[ What VeraFund Does ]</span>
          <h2 className="section-heading mt-4">
            Everything You Need
            <br />
            to Stay in{" "}
            <span className="font-serif-display italic font-normal">Control</span>
          </h2>
        </AnimatedBlock>

        {/* Feature Grid - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* AI Fraud Detection */}
          <AnimatedBlock delay={0.1} className="relative rounded-3xl bg-warm border border-border overflow-hidden p-8 flex flex-col">
            <div className="relative z-10 mb-4">
              <h3 className="text-xl font-bold text-foreground mb-2">AI Fraud Detection</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Vera analyzes every transaction in real time. If something looks suspicious, she calls you immediately to verify before it goes through.
              </p>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <img src="/images/feature-fraud-detection.svg" alt="AI fraud detection shield" className="w-full max-w-[280px] h-auto" />
            </div>
          </AnimatedBlock>

          {/* Smart Financial Dashboard */}
          <AnimatedBlock delay={0.2} className="relative rounded-3xl bg-warm border border-border overflow-hidden p-8 flex flex-col">
            <div className="relative z-10 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">Smart Financial Dashboard</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Get a real-time overview of income, expenses, budgets, and cash flow predictions — all in one clean dashboard.
                  </p>
                </div>
                <span className="text-primary font-bold text-sm uppercase tracking-wide ml-3">Live</span>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <img src="/images/feature-dashboard.svg" alt="Financial dashboard" className="w-full max-w-[320px] h-auto" />
            </div>
          </AnimatedBlock>
        </div>

        {/* Feature Grid - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Purchase Advisor */}
          <AnimatedBlock delay={0.3} className="relative rounded-3xl bg-warm border border-border overflow-hidden p-8 flex flex-col">
            <div className="relative z-10 mb-4">
              <h3 className="text-xl font-bold text-foreground mb-2">AI Purchase Advisor</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Before you buy anything, ask Vera. She analyzes the impact on your budget, goals, and spending patterns — and tells you if it's worth it.
              </p>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <img src="/images/feature-purchase-advisor.svg" alt="Purchase analysis" className="w-full max-w-[280px] h-auto" />
            </div>
          </AnimatedBlock>

          {/* Voice-Powered Assistant */}
          <AnimatedBlock delay={0.4} className="relative rounded-3xl bg-warm border border-border overflow-hidden p-8 flex flex-col">
            <div className="relative z-10 mb-4">
              <h3 className="text-xl font-bold text-foreground mb-2">Voice-Powered Assistant</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Talk to Vera anytime through the app. She knows your finances, tracks your bills, and gives personalized advice — no typing required.
              </p>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <img src="/images/feature-voice-assistant.svg" alt="Voice assistant" className="w-full max-w-[280px] h-auto" />
            </div>
          </AnimatedBlock>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
