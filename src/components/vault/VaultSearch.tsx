"use client";

import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export const VAULT_CATEGORIES = [
  "Login",
  "Banking / UPI",
  "Social Media",
  "Wi-Fi",
  "Email",
  "Card",
  "Other",
] as const;

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

interface VaultSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  totalCount: number;
  filteredCount: number;
}

export function VaultSearch({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  totalCount,
  filteredCount,
}: VaultSearchProps) {
  return (
    <section aria-label="Vault search and filters" className="space-y-3.5">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search decrypted secrets by title, username, or notes..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search query"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto snap-x hide-scrollbar text-xs pb-1">
        <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-1 shrink-0 pl-1">
          <Filter className="w-3 h-3" /> Category:
        </span>
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={cn(
            "px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0",
            selectedCategory === "all"
              ? "bg-primary/10 text-primary font-semibold border border-primary/20"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          All ({totalCount})
        </button>
        {VAULT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0",
              selectedCategory === cat
                ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Counter summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing {filteredCount} of {totalCount} secret{totalCount === 1 ? "" : "s"}
        </span>
        {selectedCategory !== "all" && (
          <span className="font-medium text-foreground">
            Filtered by: <strong className="text-primary">{selectedCategory}</strong>
          </span>
        )}
      </div>
    </section>
  );
}
