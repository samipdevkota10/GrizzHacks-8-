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

const users = [
  { name: "Marvin McKinney", handle: "@mcKinney", img: "/images/user-marvin.png" },
  { name: "Eleanor Pena", handle: "@pena", img: "/images/user-eleanor.png" },
  { name: "Leslie Alexander", handle: "@alexander", img: "/images/user-leslie.png" },
  { name: "Courtney Henry", handle: "@henry", img: "/images/user-courtney.png" },
  { name: "Jenny Wilson", handle: "@wilson", img: "/images/user-jenny.png" },
];

const UserMarquee = () => (
  <div className="overflow-hidden py-4">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...users, ...users, ...users].map((user, i) => (
        <div key={i} className="flex items-center gap-3 mx-4 flex-shrink-0 bg-card rounded-full border border-border px-4 py-2">
          <img src={user.img} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">{user.name}</span>
            <span className="text-[10px] text-muted-foreground">{user.handle}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UserMarqueeReverse = () => (
  <div className="overflow-hidden py-4">
    <div className="flex animate-marquee-reverse whitespace-nowrap">
      {[...users.slice().reverse(), ...users.slice().reverse(), ...users.slice().reverse()].map((user, i) => (
        <div key={i} className="flex items-center gap-3 mx-4 flex-shrink-0 bg-card rounded-full border border-border px-4 py-2">
          <img src={user.img} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">{user.name}</span>
            <span className="text-[10px] text-muted-foreground">{user.handle}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
          {/* AI Fraud Detection - Left */}
          <AnimatedBlock delay={0.1} className="relative rounded-3xl bg-warm border border-border overflow-hidden p-8 pb-0 min-h-[440px] flex flex-col">
            <div className="flex-1 relative z-10">
              <h3 className="text-xl font-bold text-foreground mb-2">AI Fraud Detection</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Vera analyzes every transaction in real time. If something looks suspicious, she calls you immediately to verify before it goes through.
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-6 right-6">
              <img src="/images/feature-dots.png" alt="" className="w-8 opacity-40" />
            </div>
            <div className="absolute left-0 top-1/3">
              <img src="/images/feature-stripe1.png" alt="" className="w-8 opacity-30" />
            </div>
            <div className="absolute right-0 top-1/4">
              <img src="/images/feature-stripe2.png" alt="" className="w-8 opacity-30" />
            </div>
            <div className="relative mt-4 flex justify-center items-end">
              <img src="/images/feature-phone.png" alt="Finance app" className="w-48 md:w-56 relative z-10" />
              <div className="absolute bottom-0 right-4 md:right-12">
                <img src="/images/feature-crypto.png" alt="Crypto wallet" className="w-48 md:w-64 rounded-2xl shadow-lg" />
              </div>
            </div>
          </AnimatedBlock>

          {/* Smart Financial Dashboard - Right */}
          <AnimatedBlock delay={0.2} className="relative rounded-3xl bg-warm border border-border overflow-hidden p-8 pb-0 min-h-[440px] flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">Smart Financial Dashboard</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Get a real-time overview of income, expenses, budgets, and cash flow predictions — all in one clean dashboard.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <img src="/images/feature-badge.png" alt="" className="w-20" />
                <span className="text-primary font-bold text-sm uppercase tracking-wide">Live</span>
              </div>
            </div>
            <div className="mt-3">
              <img src="/images/feature-graph.png" alt="Graph" className="w-full max-w-sm rounded-xl" />
            </div>
            <div className="relative mt-2 flex justify-center">
              <img src="/images/feature-chart.png" alt="Dashboard chart" className="w-full rounded-t-2xl" />
            </div>
          </AnimatedBlock>
        </div>

        {/* User Avatar Marquees */}
        <AnimatedBlock delay={0.25} className="mb-6">
          <UserMarquee />
          <UserMarqueeReverse />
        </AnimatedBlock>

        {/* Feature Grid - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Purchase Advisor */}
          <AnimatedBlock delay={0.3} className="relative rounded-3xl bg-warm border border-border overflow-hidden p-8 pb-0 min-h-[440px] flex flex-col">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">AI Purchase Advisor</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Before you buy anything, ask Vera. She analyzes the impact on your budget, goals, and spending patterns — and tells you if it's worth it.
              </p>
            </div>
            <div className="relative mt-6 flex justify-center items-end">
              <img src="/images/feature-card1.png" alt="Account card" className="w-36 md:w-44 relative z-10 -mr-6 rounded-2xl shadow-lg" />
              <img src="/images/feature-card2.png" alt="Account card" className="w-36 md:w-44 relative z-20 rounded-2xl shadow-lg" />
              <div className="absolute top-0 right-4">
                <img src="/images/feature-today.png" alt="Today" className="w-16" />
              </div>
            </div>
          </AnimatedBlock>

          {/* Voice-Powered Assistant */}
          <AnimatedBlock delay={0.4} className="relative rounded-3xl bg-warm border border-border overflow-hidden p-8 pb-0 min-h-[440px] flex flex-col">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">Voice-Powered Assistant</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Talk to Vera anytime through the app. She knows your finances, tracks your bills, and gives personalized advice — no typing required.
              </p>
            </div>
            <div className="relative mt-6 flex justify-center gap-4 items-end">
              <img src="/images/feature-card1.png" alt="Card" className="w-36 md:w-44 rounded-2xl shadow-lg" />
              <img src="/images/feature-card2.png" alt="Card" className="w-36 md:w-44 rounded-2xl shadow-lg" />
            </div>
          </AnimatedBlock>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
