"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "@/components/advisor/ChatPanel";

interface AIPanelWrapperProps {
  children: React.ReactNode;
  userId: string | null;
}

export function AIPanelWrapper({ children, userId }: AIPanelWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children}
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userId={userId}
        onOpenCamera={() => {}}
      />
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-vera-primary text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-vera-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          aria-label="Open Vera advisor"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      ) : null}
    </>
  );
}
