"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-0">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-bg.webp"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-12 md:pt-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="section-badge mb-6"
        >
          <Sparkles size={14} className="text-primary" />
          Empower your financial growth
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="section-heading max-w-3xl mb-5"
        >
          Smart Finance Solutions
          <br />
          for a{" "}
          <span className="font-serif-display italic font-normal">
            Secure Future
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-muted-foreground max-w-md mb-8 text-base"
        >
          Manage your money, track your growth, and make confident financial
          decisions with one powerful platform.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex items-center gap-4 mb-12"
        >
          <a
            href="/auth"
            className="group inline-flex items-center gap-2 rounded-full bg-primary pl-6 pr-2 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all"
          >
            Get Started
            <span className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center group-hover:bg-primary-foreground/30 transition-colors">
              <ArrowUpRight size={16} />
            </span>
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-full bg-dark px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            View Features
          </a>
        </motion.div>

        {/* Bottom Info Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center justify-between w-full max-w-4xl mb-4"
        >
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            [ 1000+ Trusted Clients ]
          </span>
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            @2002-2026
          </span>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          <img
            src="/images/hero-cards.png"
            alt="Credit cards stack"
            className="w-full h-auto"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
