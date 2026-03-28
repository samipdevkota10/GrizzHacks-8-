"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { VirtualCard, type VirtualCardRecord } from "./VirtualCard";

export type VirtualCardGridProps = {
  cards: VirtualCardRecord[];
  onPause: (id: string) => void;
  onDestroy: (id: string) => void;
  onCreateNew: () => void;
};

export function VirtualCardGrid({
  cards,
  onPause,
  onDestroy,
  onCreateNew,
}: VirtualCardGridProps) {
  const [destroyedAnimatedIds, setDestroyedAnimatedIds] = useState<
    Set<string>
  >(() => new Set());

  const handleDestroy = useCallback(
    (id: string) => {
      setDestroyedAnimatedIds((prev) => new Set(prev).add(id));
      void onDestroy(id);
    },
    [onDestroy],
  );

  const visibleCards = cards.filter((c) => !destroyedAnimatedIds.has(c._id));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-text-primary">
          Virtual Cards
        </h1>
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onCreateNew}
          className="group relative flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-blue px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-[0_0_24px_rgba(79,142,247,0.3)]"
        >
          <Plus className="size-[18px] shrink-0" strokeWidth={2} />
          Create New
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map((card, i) => (
          <VirtualCard
            key={card._id}
            card={card}
            onPause={onPause}
            onDestroy={handleDestroy}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
