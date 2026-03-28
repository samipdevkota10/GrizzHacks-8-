"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AIPanelWrapper } from "./AIPanelWrapper";

const DEMO_USER_ID = typeof window !== "undefined"
  ? localStorage.getItem("clearview_user_id") || "DEMO"
  : "DEMO";

type DashboardLayoutProps = {
  title: string;
  alertCount?: number;
  children: ReactNode;
};

export function DashboardLayout({
  title,
  alertCount = 0,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <TopBar title={title} alertCount={alertCount} />
        <main className="p-6">{children}</main>
      </div>
      <AIPanelWrapper userId={DEMO_USER_ID}>
        <></>
      </AIPanelWrapper>
    </div>
  );
}
