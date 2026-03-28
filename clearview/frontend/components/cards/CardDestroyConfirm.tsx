"use client";

import { AlertTriangle } from "lucide-react";

export type CardDestroyConfirmProps = {
  isOpen: boolean;
  merchantName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CardDestroyConfirm({
  isOpen,
  merchantName,
  onConfirm,
  onCancel,
}: CardDestroyConfirmProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="destroy-card-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div className="relative z-[1] w-full max-w-sm rounded-2xl border border-border-subtle bg-bg-secondary p-6 text-center">
        <AlertTriangle
          className="mx-auto text-negative"
          strokeWidth={2}
          size={48}
          aria-hidden
        />
        <h2
          id="destroy-card-title"
          className="mt-4 text-xl font-bold text-text-primary"
        >
          Destroy Card?
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          {merchantName} will never be able to charge this card again. This
          cannot be undone.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-xl bg-bg-tertiary px-6 py-3 text-text-secondary transition-colors hover:bg-bg-tertiary/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-xl bg-negative px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Destroy
          </button>
        </div>
      </div>
    </div>
  );
}
