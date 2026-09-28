"use client";

import { Edit3, Mail, Globe, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/services/api/profile";

interface ProfileHeaderProps {
  user: UserProfile;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function ProfileHeader({
  user,
  isEditing,
  onToggleEdit,
}: ProfileHeaderProps) {
  const initials = (user.name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedJoinDate = user.created_at
    ? new Date(user.created_at.replace(" ", "T")).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border bg-card/80 dark:bg-card/40 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Avatar Presentation */}
        <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground font-extrabold text-2xl shadow-md border-2 border-background">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-full w-full object-cover rounded-2xl"
            />
          ) : (
            <span>{initials}</span>
          )}
          <span
            className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background"
            title="Online"
            aria-label="Online status"
          />
        </div>

        {/* User Info */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {user.name}
            </h2>
            <Badge
              variant={user.auth_provider === "google" ? "secondary" : "outline"}
              size="sm"
              className="text-[10px] uppercase tracking-wider"
            >
              {user.auth_provider === "google" ? "Google Account" : "Verified Account"}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>

          <div className="flex items-center gap-3 pt-0.5 text-[11px] text-muted-foreground">
            {user.timezone && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-primary" />
                <span>{user.timezone}</span>
              </span>
            )}
            {formattedJoinDate && (
              <span className="text-muted-foreground/70">
                Member since {formattedJoinDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Action */}
      <div className="shrink-0 pt-2 sm:pt-0">
        <Button
          type="button"
          variant={isEditing ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleEdit}
          className="rounded-xl h-10 px-4 text-xs font-semibold gap-1.5 w-full sm:w-auto cursor-pointer shadow-2xs border-border/80"
          aria-label={isEditing ? "Close edit mode" : "Edit Profile"}
        >
          {isEditing ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Editing</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
