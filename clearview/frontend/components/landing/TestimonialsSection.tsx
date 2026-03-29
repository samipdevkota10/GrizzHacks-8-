"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    quote: "Vera called me at 2 AM when someone tried to use my card overseas. I denied it on the spot — the charge was blocked before I even opened the app.",
    name: "Jordan Hayes",
    role: "College Student",
    img: "/images/testimonial1.png",
    stars: 5,
  },
  {
    quote: "I used to stress about every purchase. Now I just ask Vera if I can afford it, and she breaks it down — budget impact, goal delay, everything.",
    name: "Priya Malhotra",
    role: "Freelance Designer",
    img: "/images/testimonial2.png",
    stars: 5,
  },
  {
    quote: "The voice advisor feels like talking to a real financial planner. I asked about my spending habits and Vera gave me a breakdown with actual advice.",
    name: "Marcus Chen",
    role: "Graduate Student",
    img: "/images/testimonial3.png",
    stars: 5,
  },
  {
    quote: "I connected my bank, and within a day Vera had already caught a subscription I forgot about and a price increase on my streaming service.",
    name: "Taylor Williams",
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
    <section id="testimonials" className="py-20 px-4 bg-background" ref={ref}>
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
