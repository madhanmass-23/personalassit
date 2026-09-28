"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomNav } from "@/components/navigation/BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthOrStandalone = [
    "/splash",
    "/onboarding",
    "/login",
    "/register",
    "/forgot-password",
  ].includes(pathname);

  if (isAuthOrStandalone) {
    return (
      <main className="min-h-screen-safe w-full bg-background flex flex-col justify-center">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen-safe w-full bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 min-h-screen-safe pb-24 md:pb-12 pt-safe px-4 sm:px-6 md:px-10 lg:px-12 w-full">
          <div className="max-w-4xl lg:max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <BottomNav />
    </div>
  );
}
