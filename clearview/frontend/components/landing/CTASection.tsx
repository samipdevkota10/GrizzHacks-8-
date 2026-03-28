"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="contact" className="py-20 px-4 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden"
        >
          <img
            src="/images/cta-bg.png"
            alt=""
            className="w-full h-auto"
          />

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 max-w-xl"
            >
              Take Full Control of Your{" "}
              <span className="font-serif-display italic font-normal">Finances</span>{" "}
              Today
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-sm text-muted-foreground mb-8"
            >
              Reach users managing money smarter and safer.
            </motion.p>

            {/* Avatars + Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex items-center gap-6 mb-8"
            >
              <div className="flex -space-x-3">
                <img src="/images/avatar1.png" alt="" className="w-10 h-10 rounded-full border-2 border-card" />
                <img src="/images/avatar2.png" alt="" className="w-10 h-10 rounded-full border-2 border-card" />
                <img src="/images/avatar3.png" alt="" className="w-10 h-10 rounded-full border-2 border-card" />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-bold text-foreground">100k+ Users</span>
                <span className="font-bold text-foreground">4.6 Rating</span>
              </div>
            </motion.div>

            <motion.a
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.55 }}
              href="/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all"
            >
              Get Started Free
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
