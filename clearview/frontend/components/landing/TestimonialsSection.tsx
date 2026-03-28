"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    quote: "This platform helped me understand my finances clearly. Everything is simple and well organized. I feel more confident making financial decisions now.",
    name: "Alex Morgan",
    role: "Small Business Owner",
    img: "/images/testimonial1.png",
    stars: 5,
  },
  {
    quote: "Managing multiple accounts is now stress free and incredibly efficient. The reports are extremely helpful, providing insights that simplify decision making.",
    name: "Sarah John",
    role: "Freelancer",
    img: "/images/testimonial2.png",
    stars: 4,
  },
  {
    quote: "The experience is incredibly smooth and well designed. I especially like how transparent everything feels, from daily activity to overall insights and user engagement.",
    name: "David Mike",
    role: "Independent Consultant",
    img: "/images/testimonial3.png",
    stars: 5,
  },
  {
    quote: "Everything feels simple and easy to understand. I can track my spending clearly and manage my money without feeling overwhelmed.",
    name: "Michael Reed",
    role: "Small Business Owner",
    img: "/images/testimonial4.png",
    stars: 4,
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-20 px-4 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="section-badge mb-4 inline-flex">[ Testimonial ]</span>
          <h2 className="section-heading mt-4">
            What Our
            <br />
            <span className="font-serif-display italic font-normal">Clients</span>{" "}
            Say
          </h2>
        </motion.div>

        {/* Testimonial Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="overflow-hidden"
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {testimonials.map((t, i) => (
              <div key={i} className="flex-shrink-0 w-full px-4">
                <div className="flex flex-col md:flex-row gap-8 items-center bg-card rounded-3xl border border-border p-8 md:p-12">
                  {/* Left - Content */}
                  <div className="flex-1">
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          size={18}
                          className={si < t.stars ? "text-primary fill-primary" : "text-muted"}
                        />
                      ))}
                    </div>
                    <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8">
                      {t.quote}
                    </p>
                    <div>
                      <p className="font-bold text-foreground">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                    </div>
                  </div>

                  {/* Right - Image */}
                  <div className="w-full md:w-64 flex-shrink-0">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-full h-auto rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft size={20} className="text-foreground" />
            </button>
            <button
              onClick={next}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight size={20} className="text-foreground" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
