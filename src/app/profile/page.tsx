"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Palette,
  Sun,
  Moon,
  Monitor,
  Bell,
  Globe,
  Wallet,
  Calendar,
  Lock,
  Download,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/services/api/auth";
import {
  profileService,
  UserProfile,
  UserPreferences,
} from "@/services/api/profile";
import {
  downloadReportFile,
  ExportReportType,
} from "@/services/api/reports";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { LogoutDialog } from "@/components/profile/LogoutDialog";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +5:30)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT -5/-4)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT -6/-5)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT -7/-6)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT -8/-7)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST +0/+1)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST +1/+2)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST +1/+2)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST +4)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST +9)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT +10/+11)" },
];

const CURRENCIES = [
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", label: "AUD ($) - Australian Dollar" },
  { code: "JPY", label: "JPY (¥) - Japanese Yen" },
];

const DATE_FORMATS = [
  { value: "Y-m-d", label: "YYYY-MM-DD (e.g. 2026-09-28)" },
  { value: "d/m/Y", label: "DD/MM/YYYY (e.g. 28/09/2026)" },
  { value: "m/d/Y", label: "MM/DD/YYYY (e.g. 09/28/2026)" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Core Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Edit Profile Form State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTimezone, setEditTimezone] = useState("UTC");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Preferences Form State
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSuccessMsg, setPrefsSuccessMsg] = useState<string | null>(null);

  // Data Export Download State
  const [downloadingType, setDownloadingType] = useState<ExportReportType | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // Logout Dialog State
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch Profile & Preferences from backend
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Verify authentication first
      const authRes = await authService.me();
      if (!authRes?.user) {
        router.push("/login");
        return;
      }
      setUser(authRes.user);
      setEditName(authRes.user.name || "");
      setEditTimezone(authRes.user.timezone || "UTC");

      // Load user preferences
      try {
        const prefsRes = await profileService.getPreferences();
        if (prefsRes) {
          setPreferences(prefsRes);
        }
      } catch {
        // Preferences fail soft with default fallback
        setPreferences({
          currency: "INR",
          date_format: "Y-m-d",
          week_start_day: 1,
          daily_reminder_enabled: 1,
          daily_reminder_time: "17:30:00",
          theme: "system",
        });
      }
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr?.status === 401) {
        router.push("/login");
      } else {
        setError("Couldn't load your profile. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Save Profile (Real backend PATCH /api/profile)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      setSavingProfile(true);
      setError(null);
      setProfileSuccessMsg(null);

      const res = await profileService.updateProfile({
        name: editName.trim(),
        timezone: editTimezone,
      });

      if (res?.user) {
        setUser(res.user);
        setIsEditingProfile(false);
        setProfileSuccessMsg("Profile updated successfully.");
        setTimeout(() => setProfileSuccessMsg(null), 3000);
      }
    } catch {
      setError("Failed to save profile changes. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Update Theme (Real next-themes + PATCH /api/preferences)
  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    if (!preferences) return;

    // Optimistic update
    setPreferences((prev) => (prev ? { ...prev, theme: newTheme } : null));

    try {
      await profileService.updatePreferences({ theme: newTheme });
    } catch {
      // Theme persists client-side via next-themes even if backend fails
    }
  };

  // Handle Update Currency (Real PATCH /api/preferences)
  const handleCurrencyChange = async (currency: string) => {
    if (!preferences) return;
    setPreferences((prev) => (prev ? { ...prev, currency } : null));

    try {
      setSavingPrefs(true);
      await profileService.updatePreferences({ currency });
      setPrefsSuccessMsg("Currency updated.");
      setTimeout(() => setPrefsSuccessMsg(null), 2500);
    } catch {
      setError("Could not update currency preference.");
    } finally {
      setSavingPrefs(false);
    }
  };

  // Handle Update Week Start Day (Real PATCH /api/preferences)
  const handleWeekStartChange = async (week_start_day: number) => {
    if (!preferences) return;
    setPreferences((prev) => (prev ? { ...prev, week_start_day } : null));

    try {
      setSavingPrefs(true);
      await profileService.updatePreferences({ week_start_day });
      setPrefsSuccessMsg("Week start day updated.");
      setTimeout(() => setPrefsSuccessMsg(null), 2500);
    } catch {
      setError("Could not update week start day.");
    } finally {
      setSavingPrefs(false);
    }
  };

  // Handle Update Date Format (Real PATCH /api/preferences)
  const handleDateFormatChange = async (date_format: string) => {
    if (!preferences) return;
    setPreferences((prev) => (prev ? { ...prev, date_format } : null));

    try {
      setSavingPrefs(true);
      await profileService.updatePreferences({ date_format });
      setPrefsSuccessMsg("Date format preference saved.");
      setTimeout(() => setPrefsSuccessMsg(null), 2500);
    } catch {
      setError("Could not update date format.");
    } finally {
      setSavingPrefs(false);
    }
  };

  // Handle Toggle Daily Reminder (Real PATCH /api/preferences)
  const handleToggleDailyReminder = async () => {
    if (!preferences) return;
    const isCurrentlyEnabled =
      preferences.daily_reminder_enabled === 1 ||
      preferences.daily_reminder_enabled === true;
    const nextVal = isCurrentlyEnabled ? 0 : 1;

    setPreferences((prev) =>
      prev ? { ...prev, daily_reminder_enabled: nextVal } : null
    );

    try {
      setSavingPrefs(true);
      await profileService.updatePreferences({ daily_reminder_enabled: nextVal });
      setPrefsSuccessMsg(
        nextVal === 1 ? "Daily reminders enabled." : "Daily reminders disabled."
      );
      setTimeout(() => setPrefsSuccessMsg(null), 2500);
    } catch {
      setError("Could not update reminder preference.");
    } finally {
      setSavingPrefs(false);
    }
  };

  // Handle Daily Reminder Time Change (Real PATCH /api/preferences)
  const handleReminderTimeChange = async (timeVal: string) => {
    if (!preferences || !timeVal) return;
    const formattedTime = timeVal.length === 5 ? `${timeVal}:00` : timeVal;

    setPreferences((prev) =>
      prev ? { ...prev, daily_reminder_time: formattedTime } : null
    );

    try {
      setSavingPrefs(true);
      await profileService.updatePreferences({
        daily_reminder_time: formattedTime,
      });
      setPrefsSuccessMsg("Reminder time saved.");
      setTimeout(() => setPrefsSuccessMsg(null), 2500);
    } catch {
      setError("Could not update reminder time.");
    } finally {
      setSavingPrefs(false);
    }
  };

  // Data Export Handler (Real backend CSV reports with authenticated blob download)
  const handleExportData = async (type: ExportReportType) => {
    try {
      setDownloadingType(type);
      setError(null);
      setDownloadSuccessMsg(null);

      const filename = await downloadReportFile(type);
      setDownloadSuccessMsg(`Downloaded ${filename} successfully.`);
      setTimeout(() => setDownloadSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr?.status === 401) {
        router.push("/login");
      } else {
        setError(
          apiErr?.message || `Failed to download ${type} CSV. Please try again.`
        );
      }
    } finally {
      setDownloadingType(null);
    }
  };

  // Handle Logout (Real backend POST /api/auth/logout)
  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
    }
  };

  // Helper values
  const isReminderEnabled = useMemo(() => {
    if (!preferences) return false;
    return (
      preferences.daily_reminder_enabled === 1 ||
      preferences.daily_reminder_enabled === true
    );
  }, [preferences]);

  const reminderTimeDisplay = useMemo(() => {
    if (!preferences?.daily_reminder_time) return "17:30";
    return preferences.daily_reminder_time.slice(0, 5);
  }, [preferences]);

  const formattedAccountDate = useMemo(() => {
    if (!user?.created_at) return "N/A";
    try {
      return new Date(user.created_at.replace(" ", "T")).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
    } catch {
      return user.created_at;
    }
  }, [user]);

  const formattedLastLogin = useMemo(() => {
    if (!user?.last_login_at) return null;
    try {
      return new Date(user.last_login_at.replace(" ", "T")).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      );
    } catch {
      return user.last_login_at;
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-20 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3 pt-1"
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1 px-1.5 -ml-1.5"
            aria-label="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Profile & Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account credentials, preferences, and workspace settings.
          </p>
        </div>
      </motion.header>

      {/* Notifications / Feedback Banners */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            role="alert"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium text-xs sm:text-sm">{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="rounded-xl h-7 px-2.5 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive font-semibold cursor-pointer"
            >
              Dismiss
            </Button>
          </motion.div>
        )}

        {(profileSuccessMsg || prefsSuccessMsg || downloadSuccessMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm">
              {profileSuccessMsg || prefsSuccessMsg || downloadSuccessMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <ProfileSkeleton />
      ) : user ? (
        <div className="space-y-6 sm:space-y-7">
          {/* 1. Profile Header Card */}
          <ProfileHeader
            user={user}
            isEditing={isEditingProfile}
            onToggleEdit={() => {
              setIsEditingProfile(!isEditingProfile);
              setEditName(user.name || "");
              setEditTimezone(user.timezone || "UTC");
            }}
            onAvatarUpdated={(updatedUser) => {
              setUser(updatedUser);
              setProfileSuccessMsg("Profile photo updated.");
              setTimeout(() => setProfileSuccessMsg(null), 3000);
            }}
          />

          {/* 2. Edit Profile Form (Real backend PATCH /api/profile) */}
          <AnimatePresence>
            {isEditingProfile && (
              <motion.form
                key="edit-profile-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSaveProfile}
                className="rounded-3xl border bg-card/90 dark:bg-card/40 p-5 sm:p-6 shadow-sm space-y-4 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Edit Profile Details
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Changes persist to your account
                  </span>
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-name"
                    className="text-xs font-semibold text-foreground"
                  >
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-xs min-h-[44px]"
                  />
                </div>

                {/* Email (Read-only explanation) */}
                <div className="space-y-1.5 opacity-80">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="profile-email"
                      className="text-xs font-semibold text-foreground"
                    >
                      Email Address
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Read-only
                    </span>
                  </div>
                  <input
                    id="profile-email"
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-secondary/50 text-muted-foreground text-sm cursor-not-allowed min-h-[44px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Your email address is your unique account identifier and cannot be modified.
                  </p>
                </div>

                {/* Timezone Selector */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="profile-timezone"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    Timezone
                  </label>
                  <select
                    id="profile-timezone"
                    value={editTimezone}
                    onChange={(e) => setEditTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-xs min-h-[44px] cursor-pointer"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Ensures reminders and focus metrics align with your local day.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingProfile}
                    onClick={() => setIsEditingProfile(false)}
                    className="rounded-xl h-10 px-4 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingProfile}
                    className="rounded-xl h-10 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* 2. Account Section */}
          <ProfileSection
            title="Account"
            icon={<User className="w-4 h-4" />}
            description="Your personal identity and profile credentials"
          >
            <div className="space-y-3 divide-y divide-border/60 text-xs">
              <div className="flex items-center justify-between pt-1">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block">Display Name</span>
                  <span className="font-semibold text-foreground text-sm">{user.name}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingProfile(true);
                    setEditName(user.name || "");
                    setEditTimezone(user.timezone || "UTC");
                  }}
                  className="rounded-xl h-9 px-3 text-xs font-semibold gap-1.5 min-h-[36px] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Name</span>
                </Button>
              </div>

              <div className="pt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Email Address</span>
                  <Badge variant="outline" size="sm" className="text-[10px] text-muted-foreground">
                    Read-only
                  </Badge>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground font-mono text-xs select-all">
                  {user.email}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Email is used as your account identifier.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block">Active Timezone</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>{user.timezone || "UTC"}</span>
                  </span>
                </div>
              </div>
            </div>
          </ProfileSection>

          {/* 3. Appearance Settings (next-themes + user_preferences.theme) */}
          <ProfileSection
            title="Appearance"
            icon={<Palette className="w-4 h-4" />}
            description="Personalize your workspace theme across devices"
          >
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Monitor },
              ].map((opt) => {
                const isSelected = theme === opt.id;
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      handleThemeChange(opt.id as "light" | "dark" | "system")
                    }
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border text-xs font-semibold transition-all min-h-[56px] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card border-border/70 text-foreground hover:bg-secondary/60 hover:border-border"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </ProfileSection>

          {/* 4. Preferences Settings (Real backend user_preferences) */}
          <ProfileSection
            title="Preferences"
            icon={<Settings className="w-4 h-4" />}
            description="Configure default formats and notifications"
          >
            {/* Currency Preference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-border/60">
              <div className="space-y-0.5">
                <label
                  htmlFor="pref-currency"
                  className="text-sm font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Wallet className="w-4 h-4 text-primary" />
                  <span>Currency</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Default currency symbol for Money Manager
                </p>
              </div>
              <select
                id="pref-currency"
                disabled={savingPrefs}
                value={preferences?.currency || "INR"}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full sm:w-56 px-3 py-2 rounded-xl border border-input bg-card text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-xs min-h-[44px] cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Format Preference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-border/60">
              <div className="space-y-0.5">
                <label
                  htmlFor="pref-date-format"
                  className="text-sm font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Date Format</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Display format for scheduled tasks and expenses
                </p>
              </div>
              <select
                id="pref-date-format"
                disabled={savingPrefs}
                value={preferences?.date_format || "Y-m-d"}
                onChange={(e) => handleDateFormatChange(e.target.value)}
                className="w-full sm:w-56 px-3 py-2 rounded-xl border border-input bg-card text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-xs min-h-[44px] cursor-pointer"
              >
                {DATE_FORMATS.map((df) => (
                  <option key={df.value} value={df.value}>
                    {df.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Start Day */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-border/60">
              <div className="space-y-0.5">
                <label
                  htmlFor="pref-week-start"
                  className="text-sm font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Week Starts On</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  First day of the week for scheduling and weekly reports
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { val: 1, label: "Monday" },
                  { val: 0, label: "Sunday" },
                ].map((item) => {
                  const isSelected =
                    Number(preferences?.week_start_day ?? 1) === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      disabled={savingPrefs}
                      onClick={() => handleWeekStartChange(item.val)}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-xs font-semibold transition-all min-h-[44px] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card border-border/70 text-foreground hover:bg-secondary/60"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Reminder (Notifications) */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Daily Reminder
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get a daily prompt to review pending tasks and focus
                  </p>
                </div>

                {/* Accessible Toggle Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isReminderEnabled}
                  aria-label="Toggle daily reminders"
                  disabled={savingPrefs}
                  onClick={handleToggleDailyReminder}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isReminderEnabled ? "bg-primary" : "bg-secondary"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                      isReminderEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Reminder Time Picker if enabled */}
              {isReminderEnabled && (
                <div className="flex items-center justify-between gap-3 pt-2 pl-6 animate-in fade-in duration-150">
                  <span className="text-xs font-medium text-muted-foreground">
                    Preferred Reminder Time:
                  </span>
                  <input
                    type="time"
                    aria-label="Daily reminder time"
                    disabled={savingPrefs}
                    value={reminderTimeDisplay}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-input bg-card text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-xs min-h-[40px] cursor-pointer"
                  />
                </div>
              )}
            </div>
          </ProfileSection>

          {/* 4. Data & Privacy (Real backend CSV exports) */}
          <ProfileSection
            title="Data & Privacy"
            icon={<Download className="w-4 h-4" />}
            description="Download and export your personal data anytime"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  type: "expenses" as ExportReportType,
                  label: "Download Expenses CSV",
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  type: "income" as ExportReportType,
                  label: "Download Income CSV",
                  color: "text-primary",
                },
                {
                  type: "monthly" as ExportReportType,
                  label: "Download Monthly CSV",
                  color: "text-amber-600 dark:text-amber-400",
                },
              ].map((item) => {
                const isDownloading = downloadingType === item.type;
                const isAnyDownloading = downloadingType !== null;

                return (
                  <Button
                    key={item.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isAnyDownloading}
                    onClick={() => handleExportData(item.type)}
                    className="min-h-[44px] h-11 rounded-xl text-xs font-semibold border-border/80 gap-2 cursor-pointer justify-start px-3.5 shadow-2xs"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                        <span className="truncate">Preparing download...</span>
                      </>
                    ) : (
                      <>
                        <Download className={cn("w-4 h-4 shrink-0", item.color)} />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </Button>
                );
              })}
            </div>
          </ProfileSection>

          {/* 5. Security Section */}
          <ProfileSection
            title="Security"
            icon={<Lock className="w-4 h-4" />}
            description="Account verification, credentials, and session management"
          >
            <div className="space-y-3 divide-y divide-border/60 text-xs">
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">Account Created</span>
                <span className="font-semibold text-foreground">
                  {formattedAccountDate}
                </span>
              </div>

              {formattedLastLogin && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-muted-foreground">Last Session Login</span>
                  <span className="font-semibold text-foreground">
                    {formattedLastLogin}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3">
                <span className="text-muted-foreground">Sign-In Provider</span>
                <Badge
                  variant={user.auth_provider === "google" ? "secondary" : "outline"}
                  size="sm"
                  className="uppercase text-[10px]"
                >
                  {user.auth_provider === "google"
                    ? "Google Authentication"
                    : "Email & Secure Password"}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-muted-foreground block">Password</span>
                  <span className="text-[10px] text-muted-foreground/80">
                    Encrypted via Argon2id / bcrypt
                  </span>
                </div>
                <span className="font-mono text-muted-foreground tracking-widest text-xs">
                  ••••••••••••
                </span>
              </div>

              <div className="pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="w-full h-12 rounded-xl text-sm font-semibold shadow-xs gap-2 cursor-pointer transition-all active:scale-[0.99] min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </Button>
              </div>
            </div>
          </ProfileSection>
        </div>
      ) : null}

      {/* Confirmation Dialog for Logout */}
      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        isLoading={isLoggingOut}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
