"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarNavItems } from "./BottomNav";
import { Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Hide on auth & standalone onboarding screens
  if (['/splash', '/onboarding', '/login', '/register', '/forgot-password'].includes(pathname)) {
    return null;
  }

  return (
    <aside
      aria-label="Desktop Sidebar Navigation"
      className="hidden md:flex flex-col justify-between w-64 lg:w-72 shrink-0 border-r border-border/80 bg-card/60 dark:bg-card/30 backdrop-blur-xl h-screen sticky top-0 px-4 py-6 select-none"
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">Assistant</h2>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Productivity OS</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Main menu">
          {sidebarNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;


            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-150 group-hover:scale-105",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Utility & Theme Toggle */}
      <div className="border-t border-border/60 pt-4 px-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Theme Mode</span>
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle color theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border bg-secondary/50 hover:bg-secondary text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
