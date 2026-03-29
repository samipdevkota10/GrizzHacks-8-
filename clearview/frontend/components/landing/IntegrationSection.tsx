"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

const IntegrationSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="integration" className="py-20 px-4 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="section-badge mb-4 inline-flex">[ Technology Stack ]</span>
          <h2 className="section-heading mt-4">
            Powered by{" "}
            <span className="font-serif-display italic font-normal">Industry-Leading</span>
            <br />
            Technology
          </h2>
        </motion.div>

        {/* Integration circles - 3 concentric rings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center items-center"
        >
          <div className="relative w-full max-w-xl aspect-square">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
            >
              <img src="/images/integration1.webp" alt="Integration ring" className="w-full h-full object-contain" />
            </motion.div>

            {/* Middle ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[15%] rounded-full"
            >
              <img src="/images/integration2.webp" alt="Integration ring" className="w-full h-full object-contain" />
            </motion.div>

            {/* Inner ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[30%] rounded-full"
            >
              <img src="/images/integration3.webp" alt="Integration ring" className="w-full h-full object-contain" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IntegrationSection;
