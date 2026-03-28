"use client";

import { useCallback, useState, type CSSProperties, type FormEvent } from "react";

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
    [
      colorScheme,
      limit,
      merchantName,
      nickname,
      onCreated,
      reset,
      userId,
    ],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
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
      <div className="relative z-[1] w-full max-w-md rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h2
          id="create-card-title"
          className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary"
        >
          Create Virtual Card
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="vc-merchant"
              className="mb-1.5 block text-sm text-text-secondary"
            >
              Merchant Name
            </label>
            <input
              id="vc-merchant"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              required
              className="w-full rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3 text-text-primary transition-colors focus:border-accent-blue focus:outline-none"
              placeholder="e.g. Netflix"
            />
          </div>
          <div>
            <label
              htmlFor="vc-nickname"
              className="mb-1.5 block text-sm text-text-secondary"
            >
              Nickname
            </label>
            <input
              id="vc-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3 text-text-primary transition-colors focus:border-accent-blue focus:outline-none"
              placeholder="Optional label"
            />
          </div>
          <div>
            <label
              htmlFor="vc-limit"
              className="mb-1.5 block text-sm text-text-secondary"
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
                className="w-full rounded-xl border border-border-subtle bg-bg-tertiary py-3 pl-8 pr-4 text-text-primary transition-colors focus:border-accent-blue focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <span className="mb-2 block text-sm text-text-secondary">
              Color
            </span>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map(({ key, scheme }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColorScheme(scheme)}
                  className={`size-10 shrink-0 rounded-full border-2 transition-shadow ${
                    colorScheme === scheme
                      ? "border-accent-blue ring-2 ring-accent-blue/40"
                      : "border-transparent"
                  }`}
                  style={SWATCH_STYLE[scheme]}
                  aria-label={`Color ${scheme}`}
                  aria-pressed={colorScheme === scheme}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full cursor-pointer rounded-xl bg-accent-blue py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create card"}
          </button>
        </form>
      </div>
    </div>
  );
}
