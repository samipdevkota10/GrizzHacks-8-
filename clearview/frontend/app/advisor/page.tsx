"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MissingUserIdHint } from "@/components/layout/MissingUserIdHint";
import { useClearviewUserId } from "@/hooks/useClearviewUserId";
import { ChatMessage as ChatMessageComponent } from "@/components/advisor/ChatMessage";
import { QuickChips } from "@/components/advisor/QuickChips";
import { TypingIndicator } from "@/components/advisor/TypingIndicator";
import { CameraModal } from "@/components/advisor/CameraModal";
import { PurchaseResult } from "@/components/advisor/PurchaseResult";
import { PageTransition } from "@/components/motion/PageTransition";
import { useAdvisor } from "@/hooks/useAdvisor";
import { useCamera } from "@/hooks/useCamera";
import { Send, Camera, Sparkles } from "lucide-react";

const VeraOrb = dynamic(
  () => import("@/components/three/VeraOrb").then((m) => m.VeraOrb),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vera-primary text-white font-bold font-[family-name:var(--font-display)]">
        V
      </div>
    ),
  },
);

export default function AdvisorPage() {
  const { hydrated, userId } = useClearviewUserId();
  const { messages, loading, sendMessage } = useAdvisor(userId);
  const { result: purchaseResult, clearResult } = useCamera(userId);
  const [input, setInput] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || !userId) return;
    sendMessage(input.trim());
    setInput("");
  };

  if (hydrated && !userId) {
    return (
      <DashboardLayout title="AI Advisor" userId={userId}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center py-12">
          <MissingUserIdHint />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AI Advisor" userId={userId}>
      <PageTransition>
        <div className="mx-auto max-w-3xl">
          <div
            className="glass-card flex flex-col overflow-hidden"
            style={{ height: "calc(100vh - 160px)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b border-border-subtle p-4"
            >
              <div className="flex items-center gap-3">
                <VeraOrb size={40} speaking={loading} />
                <div>
                  <h2 className="flex items-center gap-1.5 font-semibold text-text-primary">
                    Vera
                    <Sparkles className="size-3.5 text-vera-primary" />
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Your financial advisor
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-positive"
                  />
                  <span className="text-xs text-text-secondary">Online</span>
                </div>
              </div>
            </motion.div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex h-full flex-col items-center justify-center text-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-4"
                    >
                      <VeraOrb size={80} />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-2 text-lg font-semibold"
                    >
                      Hey, I&apos;m Vera
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mb-6 max-w-sm text-sm text-text-secondary"
                    >
                      I know everything about your finances. Ask me anything —
                      I&apos;ll give you real answers with your real numbers.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <QuickChips
                        onSelect={(msg) => userId && void sendMessage(msg)}
                      />
                    </motion.div>
                  </motion.div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.21, 0.47, 0.32, 0.98] as const,
                    }}
                  >
                    <ChatMessageComponent
                      role={msg.role}
                      content={msg.content}
                      timestamp={msg.timestamp}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {purchaseResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <PurchaseResult
                    product={purchaseResult.product}
                    price={purchaseResult.price}
                    verdict={
                      purchaseResult.verdict as "yes" | "careful" | "no"
                    }
                    reasoning={purchaseResult.reasoning}
                    onDismiss={clearResult}
                  />
                </motion.div>
              )}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <TypingIndicator />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-t border-border-subtle p-4"
            >
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={userId ? { scale: 1.08 } : undefined}
                  whileTap={userId ? { scale: 0.92 } : undefined}
                  type="button"
                  onClick={() => setShowCamera(true)}
                  disabled={!userId}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-bg-tertiary text-text-secondary transition-colors hover:text-accent-blue disabled:pointer-events-none disabled:opacity-40"
                >
                  <Camera className="h-5 w-5" />
                </motion.button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={
                    userId ? "Ask Vera anything..." : "Set user id first"
                  }
                  className="flex-1 rounded-xl bg-bg-tertiary px-4 py-3 text-sm text-text-primary transition-all placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
                />
                <motion.button
                  whileHover={
                    userId && input.trim() && !loading
                      ? { scale: 1.08 }
                      : undefined
                  }
                  whileTap={
                    userId && input.trim() && !loading
                      ? { scale: 0.92 }
                      : undefined
                  }
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || loading || !userId}
                  className="group relative flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-accent-blue text-white transition-colors hover:bg-accent-blue/90 hover:shadow-[0_0_20px_rgba(79,142,247,0.3)] disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>

      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        userId={userId!}
        onResult={() => setShowCamera(false)}
      />
    </DashboardLayout>
  );
}
