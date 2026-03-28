"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VirtualCardGrid } from "@/components/cards/VirtualCardGrid";
import { CreateCardModal } from "@/components/cards/CreateCardModal";
import { useVirtualCards } from "@/hooks/useVirtualCards";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const DEMO_USER_ID =
  typeof window !== "undefined"
    ? localStorage.getItem("clearview_user_id") || "DEMO"
    : "DEMO";

export default function CardsPage() {
  const { cards, loading, pauseCard, destroyCard, fetchCards } =
    useVirtualCards(DEMO_USER_ID);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <DashboardLayout title="Virtual Cards">
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
        userId={DEMO_USER_ID}
      />
    </DashboardLayout>
  );
}
