"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";

const plans = [
  {
    name: "Free",
    priceMonthly: "$0",
    priceYearly: "$0",
    desc: "Perfect for tracking basic expenses and getting real-time insights.",
    features: [
      "Transaction tracking",
      "Monthly spending reports",
      "1 virtual card",
      "Basic budget categories",
      "Community support",
      "Mobile-friendly dashboard",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    badge: "Most Popular",
    priceMonthly: "$12",
    priceYearly: "$10",
    desc: "Unlock AI insights and advanced tools for smarter financial decisions.",
    features: [
      "Everything in Free",
      "AI-powered advisor (Vera)",
      "Unlimited virtual cards",
      "Advanced budget planning",
      "Bill tracking & reminders",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    priceMonthly: "$49",
    priceYearly: "$42",
    desc: "Built for teams and families who need shared financial oversight.",
    features: [
      "Everything in Pro",
      "Multi-user accounts",
      "Custom spending rules",
      "Advanced analytics & exports",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-20 px-4 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <span className="section-badge mb-4 inline-flex">[ Pricing ]</span>
          <h2 className="section-heading mt-4">
            Simple and
            <br />
            <span className="font-serif-display italic font-normal">Transparent</span>{" "}
            Pricing
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <button
            onClick={() => setIsYearly(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              !isYearly
                ? "bg-dark text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              isYearly
                ? "bg-dark text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            Yearly (Save 15%)
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * i + 0.3 }}
              className={`relative rounded-3xl p-8 flex flex-col ${
                plan.highlight
                  ? "bg-dark text-primary-foreground border-dark"
                  : "bg-card border border-border"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`text-sm font-medium ${
                    plan.highlight
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {plan.name}
                </span>
                {plan.badge && (
                  <span className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <span className="text-5xl font-bold">
                  {isYearly ? plan.priceYearly : plan.priceMonthly}
                </span>
                <span
                  className={`text-sm ${
                    plan.highlight
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  /month
                </span>
              </div>

              <p
                className={`text-sm mb-8 ${
                  plan.highlight
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {plan.desc}
              </p>

              <div className="mb-8">
                <p
                  className={`text-xs font-semibold mb-4 ${
                    plan.highlight
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  What&apos;s included:
                </p>
                <div className="space-y-3">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          plan.highlight ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <Check
                          size={12}
                          className={
                            plan.highlight
                              ? "text-primary-foreground"
                              : "text-foreground"
                          }
                        />
                      </div>
                      <span
                        className={`text-sm ${
                          plan.highlight
                            ? "text-primary-foreground/80"
                            : "text-foreground"
                        }`}
                      >
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="#contact"
                className={`mt-auto group inline-flex items-center justify-center gap-2 rounded-full py-3 px-6 text-sm font-medium transition-all ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-dark text-primary-foreground hover:opacity-90"
                }`}
              >
                {plan.cta}
                <ArrowUpRight
                  size={16}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
