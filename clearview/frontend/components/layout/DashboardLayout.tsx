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
      <Sidebar userId={userId} />
      <div className="ml-64 min-h-screen">
        <TopBar title={title} alertCount={alertCount} />
        <main className="p-6">{children}</main>
      </div>
      <AIPanelWrapper userId={userId}>
        <></>
      </AIPanelWrapper>
    </div>
  );
}
