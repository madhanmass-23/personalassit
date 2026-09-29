"use client";

import { useState } from "react";
import {
  Home,
  ListTodo,
  Wallet,
  Timer,
  MoreHorizontal,
  ShieldCheck,
  User,
  Settings,
  FolderGit2,
  Bell,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const primaryNavItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: ListTodo, label: "Tasks", href: "/tasks" },
  { icon: Wallet, label: "Money", href: "/money" },
  { icon: Timer, label: "Focus", href: "/focus" },
];

export const sidebarNavItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: ListTodo, label: "Tasks", href: "/tasks" },
  { icon: Wallet, label: "Money", href: "/money" },
  { icon: Timer, label: "Focus", href: "/focus" },
  { icon: ShieldCheck, label: "Secure Vault", href: "/vault" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Hide on auth & standalone onboarding screens
  if (['/splash', '/onboarding', '/login', '/register', '/forgot-password'].includes(pathname)) {
    return null;
  }

  const isMoreActive = pathname === "/vault" || pathname === "/profile";

  return (
    <>
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/80 pb-safe shadow-lg shadow-black/5"
      >
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-3">
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full min-h-[44px] space-y-1 select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-xl",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon 
                  className={cn("w-5 h-5 transition-transform duration-150", isActive && "scale-105")} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className="text-[11px] leading-tight tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* 5th Button: More Menu */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-label="More options"
            className={cn(
              "relative flex flex-col items-center justify-center w-full h-full min-h-[44px] space-y-1 select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-xl",
              isMoreActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isMoreActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-xs"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <MoreHorizontal 
              className={cn("w-5 h-5 transition-transform duration-150", isMoreActive && "scale-105")} 
              strokeWidth={isMoreActive ? 2.5 : 2} 
            />
            <span className="text-[11px] leading-tight tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div
              className="absolute inset-0"
              onClick={() => setIsMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md mx-auto rounded-t-3xl border-t border-border bg-card p-5 pb-safe shadow-2xl space-y-4"
            >
              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full" />
                  <h3 className="text-base font-bold text-foreground tracking-tight">More Apps & Settings</h3>
                </div>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 gap-2">
                {/* 1. Secure Vault (Active Module) */}
                <Link
                  href="/vault"
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl border transition-all",
                    pathname === "/vault"
                      ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                      : "border-border/70 bg-card hover:bg-secondary/60 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Secure Vault</div>
                      <div className="text-[11px] text-muted-foreground">Zero-knowledge encrypted passwords & secrets</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    New
                  </span>
                </Link>

                {/* 2. Profile */}
                <Link
                  href="/profile"
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl border transition-all",
                    pathname === "/profile"
                      ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                      : "border-border/70 bg-card hover:bg-secondary/60 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-secondary text-foreground">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Profile & Account</div>
                      <div className="text-[11px] text-muted-foreground">Manage user info, timezone, and security</div>
                    </div>
                  </div>
                </Link>

                {/* 3. Settings */}
                <Link
                  href="/profile"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-card hover:bg-secondary/60 text-foreground transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-secondary text-foreground">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Preferences & Reports</div>
                      <div className="text-[11px] text-muted-foreground">Theme, reminders, and CSV exports</div>
                    </div>
                  </div>
                </Link>

                {/* 4. Projects (Future Placeholder) */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/40 bg-card/40 opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-secondary text-muted-foreground">
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Projects</div>
                      <div className="text-[11px] text-muted-foreground">Workspace task boards and milestones</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                    Coming soon
                  </span>
                </div>

                {/* 5. Notifications (Future Placeholder) */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/40 bg-card/40 opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-secondary text-muted-foreground">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Notifications</div>
                      <div className="text-[11px] text-muted-foreground">Reminders and activity digests</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                    Coming soon
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
