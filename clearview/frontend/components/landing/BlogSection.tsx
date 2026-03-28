"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

const posts = [
  {
    img: "/images/blog1.webp",
    title: "Financial Insights That Support Better Decisions",
    excerpt: "Turn raw data into smart moves by understanding the key metrics that drive long-term financial...",
    author: "Annette Black",
    authorImg: "/images/author1.png",
    date: "2/13/26",
    readTime: "8 Minutes read",
  },
  {
    img: "/images/blog2.webp",
    title: "Smarter Expense Management for Growing Teams",
    excerpt: "Discover how growing businesses can automate their spending reports and save hours of manual...",
    author: "Broklyn Sam",
    authorImg: "/images/author2.png",
    date: "2/13/26",
    readTime: "5 Minutes read",
  },
  {
    img: "/images/blog3.png",
    title: "How to Track Cash Flow Without Complexity",
    excerpt: "Manage multiple bank accounts and wallets from one platform and its more than secure others...",
    author: "Courtney Henry",
    authorImg: "/images/author3.png",
    date: "2/6/26",
    readTime: "5 Minutes read",
  },
];

const BlogSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="blog" className="py-20 px-4 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="section-badge mb-4 inline-flex">[ Blog ]</span>
          <h2 className="section-heading mt-4">
            Finance Insights
            <br />
            and{" "}
            <span className="font-serif-display italic font-normal">Learning</span>{" "}
            Resources
          </h2>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 + 0.2 }}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl overflow-hidden mb-4">
                <img
                  src={post.img}
                  alt={post.title}
                  className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-3">
                <img
                  src={post.authorImg}
                  alt={post.author}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{post.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.date} · {post.readTime}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
