"use client";

import { Home, ListTodo, IndianRupee, Timer, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: ListTodo, label: "Tasks", href: "/tasks" },
  { icon: IndianRupee, label: "Money", href: "/money" },
  { icon: Timer, label: "Focus", href: "/focus" },
  { icon: User, label: "Me", href: "/me" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Do not show bottom nav on splash, onboarding, or auth screens
  if (['/splash', '/onboarding', '/login', '/register', '/forgot-password'].includes(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full space-y-1 select-none",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30, duration: 0.2 }}
                />
              )}
              <Icon className={cn("w-6 h-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
