"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AIPanelWrapper } from "./AIPanelWrapper";

type DashboardLayoutProps = {
  title: string;
  alertCount?: number;
  userId: string | null;
  children: ReactNode;
};

export function DashboardLayout({
  title,
  alertCount = 0,
  userId,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-blue/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-vera-primary/[0.02] rounded-full blur-3xl" />
      </div>
      <Sidebar userId={userId} />
      <div className="relative ml-64 min-h-screen">
        <TopBar title={title} alertCount={alertCount} />
        <main className="p-6">{children}</main>
      </div>
      <AIPanelWrapper userId={userId}>
        <></>
      </AIPanelWrapper>
    </div>
  );
}
