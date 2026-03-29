"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

const INTEGRATIONS = [
  { name: "Google Gemini", desc: "AI reasoning & fraud analysis", ring: 0 },
  { name: "ElevenLabs", desc: "Voice synthesis & outbound calls", ring: 0 },
  { name: "Plaid", desc: "Bank account & transaction sync", ring: 0 },
  { name: "Stripe", desc: "Virtual card issuing & management", ring: 1 },
  { name: "MongoDB", desc: "Real-time data layer", ring: 1 },
  { name: "Twilio", desc: "Phone calls & SMS fallback", ring: 1 },
  { name: "Next.js", desc: "Frontend framework", ring: 2 },
  { name: "FastAPI", desc: "Backend API server", ring: 2 },
  { name: "Vercel", desc: "Frontend hosting & CDN", ring: 2 },
  { name: "Railway", desc: "Backend deployment", ring: 2 },
];

const IntegrationSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="integration" className="py-20 px-4 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
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

        {/* Concentric rings with tech names orbiting */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center items-center"
        >
          <div className="relative w-full max-w-lg aspect-square">
            {/* Ring circles */}
            {[0, 1, 2].map((ring) => (
              <div
                key={ring}
                className="absolute rounded-full border border-border/40"
                style={{
                  inset: `${ring * 18}%`,
                }}
              />
            ))}

            {/* Center label */}
            <div className="absolute inset-[54%] flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs font-bold text-primary tracking-wide uppercase">Vera</p>
                <p className="text-[9px] text-muted-foreground">Engine</p>
              </div>
            </div>

            {/* Orbiting tech labels */}
            {INTEGRATIONS.map((tech, i) => {
              const ring = tech.ring;
              const itemsInRing = INTEGRATIONS.filter((t) => t.ring === ring).length;
              const indexInRing = INTEGRATIONS.filter((t) => t.ring === ring).indexOf(tech);
              const angle = (indexInRing / itemsInRing) * 360 + ring * 30;
              const radius = 42 - ring * 16;

              return (
                <motion.div
                  key={tech.name}
                  animate={{ rotate: [angle, angle + 360] }}
                  transition={{ duration: 50 + ring * 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                  style={{ transformOrigin: "center" }}
                >
                  <div
                    className="absolute"
                    style={{
                      left: `${50 + radius * Math.cos(0)}%`,
                      top: `${50 - radius * Math.sin(0)}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, -360] }}
                      transition={{ duration: 50 + ring * 15, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-sm whitespace-nowrap">
                        <p className="text-[11px] font-semibold text-foreground">{tech.name}</p>
                        <p className="text-[8px] text-muted-foreground">{tech.desc}</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IntegrationSection;
