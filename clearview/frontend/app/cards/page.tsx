"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MissingUserIdHint } from "@/components/layout/MissingUserIdHint";
import { VirtualCardGrid } from "@/components/cards/VirtualCardGrid";
import { CreateCardModal } from "@/components/cards/CreateCardModal";
import { useVirtualCards } from "@/hooks/useVirtualCards";
import { useClearviewUserId } from "@/hooks/useClearviewUserId";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function CardsPage() {
  const { hydrated, userId } = useClearviewUserId();
  const { cards, loading, pauseCard, destroyCard, fetchCards } =
    useVirtualCards(hydrated, userId);
  const [showCreate, setShowCreate] = useState(false);

  if (hydrated && !userId) {
    return (
      <DashboardLayout title="Virtual Cards" userId={userId}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center py-12">
          <MissingUserIdHint />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Virtual Cards" userId={userId}>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} className="h-56" />
          ))}
        </div>
      ) : (
        <VirtualCardGrid
          cards={cards}
          onPause={pauseCard}
          onDestroy={destroyCard}
          onCreateNew={() => setShowCreate(true)}
        />
      )}
      <CreateCardModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          fetchCards();
        }}
        userId={userId!}
      />
    </DashboardLayout>
  );
}
