"use client";

import { useCallback, useState, type CSSProperties, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const COLOR_OPTIONS = [
  { key: "blue", scheme: "blue" },
  { key: "purple", scheme: "purple" },
  { key: "green", scheme: "green" },
  { key: "red", scheme: "red" },
] as const;

const SWATCH_STYLE: Record<string, CSSProperties> = {
  blue: { background: "linear-gradient(135deg, #1a3a5c, #0d1f3c)" },
  purple: { background: "linear-gradient(135deg, #2d1b4e, #1a0f30)" },
  green: { background: "linear-gradient(135deg, #1a3c2a, #0d2018)" },
  red: { background: "linear-gradient(135deg, #3c1a1a, #2a0d0d)" },
};

export type CreateCardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  userId: string;
};

export function CreateCardModal({
  isOpen,
  onClose,
  onCreated,
  userId,
}: CreateCardModalProps) {
  const [merchantName, setMerchantName] = useState("");
  const [nickname, setNickname] = useState("");
  const [limit, setLimit] = useState("");
  const [colorScheme, setColorScheme] =
    useState<(typeof COLOR_OPTIONS)[number]["scheme"]>("blue");
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setMerchantName("");
    setNickname("");
    setLimit("");
    setColorScheme("blue");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const spending_limit_monthly = Number.parseFloat(limit);
      if (
        !merchantName.trim() ||
        Number.isNaN(spending_limit_monthly) ||
        spending_limit_monthly < 0
      ) {
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch(`${API_URL}/api/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant_name: merchantName.trim(),
            nickname: nickname.trim() || merchantName.trim(),
            spending_limit_monthly,
            color_scheme: colorScheme,
            user_id: userId,
          }),
        });
        if (!res.ok) {
          console.error("Create card failed:", res.status);
          return;
        }
        reset();
        onCreated();
      } catch (err) {
        console.error("Create card error:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [colorScheme, limit, merchantName, nickname, onCreated, reset, userId],
  );

  const inputClasses =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/30 placeholder:text-text-muted";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-card-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close modal"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] as const }}
            className="relative z-[1] w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.06] bg-bg-secondary/95 backdrop-blur-xl p-6 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                id="create-card-title"
                className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary"
              >
                Create Virtual Card
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={handleClose}
                className="flex items-center justify-center rounded-lg p-1.5 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="vc-merchant"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Merchant Name
                </label>
                <input
                  id="vc-merchant"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  required
                  className={inputClasses}
                  placeholder="e.g. Netflix"
                />
              </div>
              <div>
                <label
                  htmlFor="vc-nickname"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Nickname
                </label>
                <input
                  id="vc-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className={inputClasses}
                  placeholder="Optional label"
                />
              </div>
              <div>
                <label
                  htmlFor="vc-limit"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Monthly Spending Limit
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                    $
                  </span>
                  <input
                    id="vc-limit"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    required
                    className={`${inputClasses} pl-8`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-text-secondary">
                  Color
                </span>
                <div className="flex gap-3">
                  {COLOR_OPTIONS.map(({ key, scheme }) => (
                    <motion.button
                      key={key}
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setColorScheme(scheme)}
                      className={`size-10 shrink-0 cursor-pointer rounded-full border-2 transition-shadow ${
                        colorScheme === scheme
                          ? "border-accent-blue ring-2 ring-accent-blue/40"
                          : "border-transparent hover:border-white/10"
                      }`}
                      style={SWATCH_STYLE[scheme]}
                      aria-label={`Color ${scheme}`}
                      aria-pressed={colorScheme === scheme}
                    />
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative mt-2 w-full cursor-pointer overflow-hidden rounded-xl bg-accent-blue py-3 font-medium text-white transition-all hover:shadow-[0_0_24px_rgba(79,142,247,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <motion.span
                    className="inline-block size-5 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  "Create card"
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
