"use client";

import { Home, ListTodo, Wallet, Timer, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: ListTodo, label: "Tasks", href: "/tasks" },
  { icon: Wallet, label: "Money", href: "/money" },
  { icon: Timer, label: "Focus", href: "/focus" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on auth & standalone onboarding screens
  if (['/splash', '/onboarding', '/login', '/register', '/forgot-password'].includes(pathname)) {
    return null;
  }

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/80 pb-safe shadow-lg shadow-black/5"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-3">
        {navItems.map((item) => {
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
      </div>
    </nav>
  );
}
