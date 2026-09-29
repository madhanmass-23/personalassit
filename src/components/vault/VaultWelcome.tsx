"use client";

import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, KeyRound, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface VaultWelcomeProps {
  onCreateClick: () => void;
}

export function VaultWelcome({ onCreateClick }: VaultWelcomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center max-w-lg mx-auto py-10 px-4 text-center space-y-8"
    >
      {/* Icon Graphic */}
      <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20 shadow-xl shadow-primary/10">
        <ShieldCheck className="w-12 h-12" strokeWidth={1.75} />
        <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-card border border-border shadow-md text-primary">
          <KeyRound className="w-4 h-4" />
        </div>
      </div>

      {/* Hero Text */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Secure Vault
        </h1>
        <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
          Keep your passwords, recovery codes, and private credentials protected with zero-knowledge envelope encryption.
        </p>
      </div>

      {/* Security Principles Cards */}
      <div className="w-full grid grid-cols-1 gap-3 text-left">
        <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-border/70 bg-card/60 dark:bg-card/30 backdrop-blur-md">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">Client-Side Authenticated Encryption</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every entry is encrypted locally with AES-256-GCM before transmission. The server receives and stores only ciphertext.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-border/70 bg-card/60 dark:bg-card/30 backdrop-blur-md">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">Zero-Knowledge Master Password</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your master password is never sent to our servers or saved in a database. It exists in volatile memory only during decryption.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-border/70 bg-card/60 dark:bg-card/30 backdrop-blur-md">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">Automatic Session Locking</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Locks automatically after 15 minutes of inactivity or when you close the tab. No unencrypted secrets persist on your device.
            </p>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="w-full space-y-3">
        <Button
          onClick={onCreateClick}
          className="w-full rounded-2xl h-13 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2.5 min-h-[50px]"
        >
          <span>Create Secure Vault</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Free, private, and encrypted exclusively for your Personal Assistant account.
        </p>
      </div>
    </motion.div>
  );
}
