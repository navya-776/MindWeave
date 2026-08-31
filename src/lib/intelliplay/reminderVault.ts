import type { ReminderItem } from "./types";
export type { ReminderItem };

const REMINDERS_STORAGE_KEY = "mindweave.reminders.v1";

export const SAMPLE_REMINDERS: ReminderItem[] = [
  {
    id: "rem-1",
    patientId: "default",
    title: "Morning Blood Pressure Medication",
    type: "medication",
    time: "08:30",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    completedToday: false,
  },
  {
    id: "rem-2",
    patientId: "default",
    title: "Morning Hydration (Glass of Water)",
    type: "routine",
    time: "11:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    completedToday: false,
  },
  {
    id: "rem-3",
    patientId: "default",
    title: "Afternoon Herbal Tea & Rest",
    type: "routine",
    time: "15:30",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    completedToday: false,
  },
  {
    id: "rem-4",
    patientId: "default",
    title: "Evening Garden Walk with Family",
    type: "activity",
    time: "17:30",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    completedToday: false,
  },
  {
    id: "rem-5",
    patientId: "default",
    title: "Evening Heart Care Capsule",
    type: "medication",
    time: "20:30",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    completedToday: false,
  },
];

/** Fetch stored reminder items with fallback to sample reminders. */
export function getStoredReminders(): ReminderItem[] {
  if (typeof window === "undefined") return SAMPLE_REMINDERS;
  try {
    const raw = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(SAMPLE_REMINDERS));
      return SAMPLE_REMINDERS;
    }
    const items = JSON.parse(raw) as ReminderItem[];
    return items.length > 0 ? items : SAMPLE_REMINDERS;
  } catch (err) {
    console.error("Error reading reminders:", err);
    return SAMPLE_REMINDERS;
  }
}

/** Save updated reminders list to local storage. */
export function saveStoredReminders(reminders: ReminderItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (err) {
    console.error("Error writing reminders:", err);
  }
}

/** Toggle a reminder's completion state for today. */
export function toggleReminder(id: string): ReminderItem[] {
  const current = getStoredReminders();
  const updated = current.map((r) =>
    r.id === id ? { ...r, completedToday: !r.completedToday } : r
  );
  saveStoredReminders(updated);
  return updated;
}
