"use client";

import { useState, useRef } from "react";
import { Edit3, Mail, Globe, Check, Camera, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserProfile, profileService } from "@/services/api/profile";

interface ProfileHeaderProps {
  user: UserProfile;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAvatarUpdated?: (updatedUser: UserProfile) => void;
}

export function ProfileHeader({
  user,
  isEditing,
  onToggleEdit,
  onAvatarUpdated,
}: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initials = (user.name || "U")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PA";

  const handleAvatarClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB");
      setTimeout(() => setUploadError(null), 3500);
      return;
    }

    // Validate MIME type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Only JPEG, PNG, and WEBP formats supported");
      setTimeout(() => setUploadError(null), 3500);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      const res = await profileService.uploadAvatar(file);
      if (res?.user && onAvatarUpdated) {
        onAvatarUpdated(res.user);
      }
    } catch {
      setUploadError("Photo upload unavailable on this server. Name & settings remain fully editable.");
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl border bg-card/80 dark:bg-card/40 shadow-xs relative overflow-hidden">
      {/* Hidden File Input for Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload profile photo"
      />

      {/* Large Circular Profile Photo (min 96px touch target / size) */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={uploading}
          aria-label="Change profile photo"
          className="relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground font-extrabold text-3xl shadow-lg border-4 border-background overflow-hidden cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[96px] min-w-[96px]"
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="text-[10px] font-medium text-white">Uploading</span>
            </div>
          ) : user.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            <span>{initials}</span>
          )}

          {/* Hover / Tap overlay */}
          {!uploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Change</span>
            </div>
          )}
        </button>

        {/* Small Camera Badge Button */}
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={uploading}
          aria-label="Upload photo"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors cursor-pointer min-h-[32px] min-w-[32px]"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Error Banner if any */}
      {uploadError && (
        <p className="mt-2 text-xs text-destructive font-medium max-w-xs">
          {uploadError}
        </p>
      )}

      {/* User Name */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-4">
        {user.name}
      </h2>

      {/* Email (Centered) */}
      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
        <Mail className="w-4 h-4 shrink-0 text-muted-foreground/70" />
        <span>{user.email}</span>
      </p>

      {/* Timezone & Account Badge */}
      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
        {user.timezone && (
          <Badge variant="outline" size="sm" className="text-[11px] gap-1 px-2.5 py-0.5">
            <Globe className="w-3 h-3 text-primary" />
            <span>{user.timezone}</span>
          </Badge>
        )}
        <Badge
          variant={user.auth_provider === "google" ? "secondary" : "outline"}
          size="sm"
          className="text-[10px] uppercase tracking-wider"
        >
          {user.auth_provider === "google" ? "Google Account" : "Verified Account"}
        </Badge>
      </div>

      {/* Edit Profile Action (Min 44px Touch Target) */}
      <div className="mt-5">
        <Button
          type="button"
          variant={isEditing ? "secondary" : "outline"}
          size="default"
          onClick={onToggleEdit}
          className="min-h-[44px] px-6 text-sm font-semibold gap-2 rounded-xl cursor-pointer shadow-xs border-border/80"
          aria-label={isEditing ? "Close edit mode" : "Edit Profile"}
        >
          {isEditing ? (
            <>
              <Check className="w-4 h-4" />
              <span>Editing Profile</span>
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
