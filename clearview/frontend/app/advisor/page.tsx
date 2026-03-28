"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatMessage as ChatMessageComponent } from "@/components/advisor/ChatMessage";
import { QuickChips } from "@/components/advisor/QuickChips";
import { TypingIndicator } from "@/components/advisor/TypingIndicator";
import { CameraModal } from "@/components/advisor/CameraModal";
import { PurchaseResult } from "@/components/advisor/PurchaseResult";
import { useAdvisor } from "@/hooks/useAdvisor";
import { useCamera } from "@/hooks/useCamera";
import { Send, Camera } from "lucide-react";

const DEMO_USER_ID = typeof window !== "undefined"
  ? localStorage.getItem("clearview_user_id") || "DEMO"
  : "DEMO";

export default function AdvisorPage() {
  const { messages, loading, sendMessage } = useAdvisor(DEMO_USER_ID);
  const { result: purchaseResult, clearResult } = useCamera(DEMO_USER_ID);
  const [input, setInput] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <DashboardLayout title="AI Advisor">
      <div className="mx-auto max-w-3xl">
        <div className="glass-card flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
          <div className="border-b border-border-subtle p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vera-primary text-white font-bold font-[family-name:var(--font-display)]">
                V
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">Vera</h2>
                <p className="text-xs text-text-secondary">Your financial advisor</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-positive" />
                <span className="text-xs text-text-secondary">Online</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-vera-primary/20 mb-4">
                  <span className="text-3xl font-bold text-vera-primary font-[family-name:var(--font-display)]">V</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Hey, I&apos;m Vera</h3>
                <p className="text-sm text-text-secondary mb-6 max-w-sm">
                  I know everything about your finances. Ask me anything — I&apos;ll give you real answers with your real numbers.
                </p>
                <QuickChips onSelect={sendMessage} />
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessageComponent key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
            ))}

            {purchaseResult && (
              <PurchaseResult
                product={purchaseResult.product}
                price={purchaseResult.price}
                verdict={purchaseResult.verdict as "yes" | "careful" | "no"}
                reasoning={purchaseResult.reasoning}
                onDismiss={clearResult}
              />
            )}

            {loading && <TypingIndicator />}
          </div>

          <div className="border-t border-border-subtle p-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-tertiary text-text-secondary hover:text-accent-blue transition-colors cursor-pointer"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask Vera anything..."
                className="flex-1 rounded-xl bg-bg-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue/40"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-blue text-white hover:bg-accent-blue-dim transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        userId={DEMO_USER_ID}
        onResult={() => setShowCamera(false)}
      />
    </DashboardLayout>
  );
}
