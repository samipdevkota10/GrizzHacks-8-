"use client";

import { useCallback, useState } from "react";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-text-primary">
          Virtual Cards
        </h1>
        <button
          type="button"
          onClick={onCreateNew}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="size-[18px] shrink-0" strokeWidth={2} />
          Create New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map((card) => (
          <VirtualCard
            key={card._id}
            card={card}
            onPause={onPause}
            onDestroy={handleDestroy}
          />
        ))}
      </div>
    </div>
  );
}
