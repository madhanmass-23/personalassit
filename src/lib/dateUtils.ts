/**
 * Date formatting utilities for Tasks and Dashboard.
 * Formats dates intelligently: Today, Tomorrow, Overdue, or specific dates with 12-hour times.
 */

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converts "18:00:00" or "18:00" into "6:00 PM"
 */
export function formatTime12Hour(timeStr?: string | null): string {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export interface FormattedDueDate {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
}

/**
 * Intelligently formats task due date & time:
 * - "Today · 5:00 PM" or "Today"
 * - "Tomorrow · 9:00 AM" or "Tomorrow"
 * - "Overdue · Oct 1 · 4:00 PM" (if status is pending and date is in past)
 * - "Oct 2 · 6:30 PM" or "Oct 2"
 */
export function formatTaskDueDate(
  dueDate?: string | null,
  dueTime?: string | null,
  isCompleted: boolean = false
): FormattedDueDate | null {
  if (!dueDate) return null;

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const formattedTime = formatTime12Hour(dueTime);
  const timeSuffix = formattedTime ? ` · ${formattedTime}` : "";

  const isToday = dueDate === todayStr;
  const isTomorrow = dueDate === tomorrowStr;
  const isOverdue = !isCompleted && dueDate < todayStr;

  if (isToday) {
    return {
      label: `Today${timeSuffix}`,
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
    };
  }

  if (isTomorrow) {
    return {
      label: `Tomorrow${timeSuffix}`,
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
    };
  }

  // Parse YYYY-MM-DD
  const [y, m, d] = dueDate.split("-").map((v) => parseInt(v, 10));
  let dateFormatted = dueDate;
  if (y && m && d) {
    const dateObj = new Date(y, m - 1, d);
    dateFormatted = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: y !== new Date().getFullYear() ? "numeric" : undefined,
    });
  }

  if (isOverdue) {
    return {
      label: `Overdue · ${dateFormatted}${timeSuffix}`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
    };
  }

  return {
    label: `${dateFormatted}${timeSuffix}`,
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
  };
}
