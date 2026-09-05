import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, NeedsProfile } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { getStoredReminders, toggleReminder, type ReminderItem } from "@/lib/intelliplay/reminderVault";
import { SeniorVoiceBar } from "@/components/intelliplay/SeniorVoiceBar";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Medication & Daily Reminders — MindWeave" },
      {
        name: "description",
        content: "Clear daily schedule for medication, hydration, and gentle activity reminders.",
      },
    ],
  }),
  component: RemindersPage,
});

const TYPE_ICONS: Record<string, string> = {
  medication: "💊",
  routine: "💧",
  activity: "🚶‍♂️",
  appointment: "🩺",
};

function RemindersPage() {
  const { profile, ready } = useProfile();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  useEffect(() => {
    setReminders(getStoredReminders());
  }, []);

  if (!ready) {
    return (
      <AppShell>
        <div className="panel p-8 text-center font-display text-xl">Loading Reminders…</div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <NeedsProfile />
      </AppShell>
    );
  }

  const handleToggle = (id: string) => {
    const updated = toggleReminder(id);
    setReminders(updated);
  };

  const completedCount = reminders.filter((r) => r.completedToday).length;

  const audioSummary = `Hello ${profile.name}. You have ${reminders.length} reminders scheduled for today, and ${completedCount} completed. Next reminder is ${
    reminders.find((r) => !r.completedToday)?.title || "all completed for now"
  }.`;

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="panel p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Daily Schedule & Health
            </span>
            <h1 className="font-display text-3xl font-bold mt-1">
              💊 Medication & Routine Reminders
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Check off your daily medicines and healthy activities as you complete them.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 text-primary border border-primary/30 px-4 py-2 text-sm font-bold">
              {completedCount} of {reminders.length} Done Today
            </span>
            <Link
              to="/caregiver"
              className="toy-press rounded-full border-2 border-border px-4 py-2 font-display text-xs font-bold"
            >
              Manage in Caregiver Portal →
            </Link>
          </div>
        </div>

        {/* Voice Assistant Reading bar */}
        <SeniorVoiceBar promptText={audioSummary} />

        {/* Reminders List */}
        <div className="space-y-3">
          {reminders.map((r) => {
            const icon = TYPE_ICONS[r.type] || "⏰";
            return (
              <div
                key={r.id}
                onClick={() => handleToggle(r.id)}
                className={`toy-press panel p-5 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  r.completedToday
                    ? "bg-success/10 border-success/40 opacity-75 high-contrast:opacity-100"
                    : "bg-card border-2 border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`size-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      r.completedToday ? "bg-success/20 text-success" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {icon}
                  </div>
                  <div>
                    <h3
                      className={`font-display text-xl font-bold ${
                        r.completedToday ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {r.title}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      Scheduled for <strong>{r.time}</strong> ·{" "}
                      <span className="capitalize">{r.type}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`size-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all ${
                      r.completedToday
                        ? "bg-success border-success text-success-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    {r.completedToday ? "✓" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
