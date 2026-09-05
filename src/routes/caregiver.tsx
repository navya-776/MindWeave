import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, NeedsProfile, Stat } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { minutesRemaining, secondsToday } from "@/lib/intelliplay/bonus";
import type { CareLevel, MemoryItem, ReminderItem } from "@/lib/intelliplay/types";
import { getStoredMemories, saveStoredMemories } from "@/lib/intelliplay/memoryVault";
import { getStoredReminders, saveStoredReminders } from "@/lib/intelliplay/reminderVault";

export const Route = createFileRoute("/caregiver")({
  head: () => ({
    meta: [
      { title: "Caregiver Portal — MindWeave" },
      {
        name: "description",
        content:
          "Caregiver portal to manage patient profiles, support levels, senior accessibility, and cognitive activity trends.",
      },
    ],
  }),
  component: CaregiverPage,
});

function CaregiverPage() {
  const { profile, ready, updateSettings, updateAccessibility, updateCareLevel } = useProfile();

  if (!ready) {
    return (
      <AppShell>
        <div className="panel p-8 text-center">Loading…</div>
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

  const usedMins = Math.round(secondsToday(profile) / 60);
  const remainingMins = minutesRemaining(profile);

  return (
    <AppShell>
      <div className="panel animate-pop mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="font-display text-3xl font-bold">🛡️ Caregiver Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage assistance level, senior accessibility, activity schedules, and view cognitive engagement logs for <strong>{profile.name}</strong>.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Support Level & Care Settings */}
        <section className="panel space-y-6 p-6">
          <h2 className="font-display text-xl font-bold">🤝 Assistance & Support Level</h2>

          {/* Care Level Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Patient Care & Guidance Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["independent", "guided", "high-support"] as CareLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateCareLevel(level)}
                  className={`toy-press rounded-2xl p-4 text-center border-2 transition-all ${
                    profile.careLevel === level
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-soft"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  <div className="font-display text-base capitalize">{level.replace("-", " ")}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {level === "independent" && "Minimal hints"}
                    {level === "guided" && "Balanced hints"}
                    {level === "high-support" && "Auto-guidance"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Activity Time Limit */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-sm font-bold">
              <span>Daily Target Activity Time</span>
              <span className="text-primary text-base font-display">
                {profile.settings.dailyLimitMinutes} minutes
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={120}
              step={5}
              value={profile.settings.dailyLimitMinutes}
              onChange={(e) => updateSettings({ dailyLimitMinutes: Number(e.target.value) })}
              className="w-full accent-[var(--primary)] h-3 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
              <span>15 min</span>
              <span>60 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <Stat label="Activity Today" value={`${usedMins} min`} />
            <Stat label="Remaining Goal" value={`${remainingMins} min`} />
          </div>
        </section>

        {/* Senior Accessibility Preferences */}
        <section className="panel space-y-6 p-6">
          <h2 className="font-display text-xl font-bold">👁️ Senior Accessibility Settings</h2>

          <div className="space-y-4">
            {/* Font Size Selector */}
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
              <div>
                <p className="font-display text-base font-bold">Typography Scale</p>
                <p className="text-xs text-muted-foreground">Adjust text size for easy reading.</p>
              </div>
              <div className="flex gap-1.5">
                {(["medium", "large", "extra-large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateAccessibility({ fontSize: size })}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs capitalize transition-all ${
                      profile.accessibility?.fontSize === size
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-muted-foreground high-contrast:text-foreground"
                    }`}
                  >
                    {size === "extra-large" ? "XL" : size}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
              <div>
                <p className="font-display text-base font-bold">High Contrast Mode</p>
                <p className="text-xs text-muted-foreground">High contrast black & white theme.</p>
              </div>
              <button
                onClick={() =>
                  updateAccessibility({ highContrast: !profile.accessibility?.highContrast })
                }
                className={`toy-press px-4 py-2 rounded-full font-bold text-xs transition-all ${
                  profile.accessibility?.highContrast
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground high-contrast:text-foreground"
                }`}
              >
                {profile.accessibility?.highContrast ? "ON" : "OFF"}
              </button>
            </div>

            {/* Speech Rate Slider */}
            <div className="space-y-2 rounded-2xl bg-muted/40 p-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Audio Voice Speech Speed</span>
                <span className="text-primary font-display">
                  {Math.round((profile.accessibility?.speechRate ?? 0.85) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.0}
                step={0.05}
                value={profile.accessibility?.speechRate ?? 0.85}
                onChange={(e) => updateAccessibility({ speechRate: Number(e.target.value) })}
                className="w-full accent-[var(--primary)] h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                <span>Relaxed (60%)</span>
                <span>Normal (100%)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Family Memory Vault Management */}
        <section className="panel p-6 lg:col-span-2 space-y-6">
          <CaregiverMemoryManager />
        </section>

        {/* Medication & Routine Reminders Management */}
        <section className="panel p-6 lg:col-span-2 space-y-6">
          <CaregiverReminderManager />
        </section>

        {/* Cognitive Session Activity History */}
        <section className="panel p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">📜 Recent Activity Logs</h2>
          {profile.history.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No recorded sessions yet today.</p>
          ) : (
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
              {[...profile.history].reverse().map((r) => (
                <div key={r.id} className="rounded-2xl bg-muted/40 p-4 text-sm font-medium">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
                    <span className="font-display text-base">{r.gameType.toUpperCase()} Activity</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-card px-3 py-1 border border-border">
                        {Math.round(r.metrics.accuracy * 100)}% Accuracy
                      </span>
                      <span className="rounded-full bg-primary/10 text-primary px-3 py-1">
                        {r.metrics.timeTaken.toFixed(0)}s Duration
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(r.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {r.notes.length > 0 ? (
                    <div className="mt-2 text-xs text-muted-foreground font-semibold">
                      ⚙️ Adaptive Guidance: {r.notes.join(" · ")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function CaregiverMemoryManager() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Son");
  const [photoUrl, setPhotoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMemories(getStoredMemories());
  }, []);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !photoUrl.trim()) return;

    const newMem: MemoryItem = {
      id: `mem-${Date.now()}`,
      patientId: "default",
      name: name.trim(),
      relation: relation.trim(),
      photoUrl: photoUrl.trim(),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      createdAt: Date.now(),
    };

    const next = [newMem, ...memories];
    setMemories(next);
    saveStoredMemories(next);

    // Reset Form
    setName("");
    setPhotoUrl("");
    setLocation("");
    setNotes("");
    setShowAddForm(false);
  };

  const handleDeleteMemory = (id: string) => {
    if (window.confirm("Remove this family memory photo?")) {
      const next = memories.filter((m) => m.id !== id);
      setMemories(next);
      saveStoredMemories(next);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">🖼️ Family Memory Vault</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add family member photos and stories to automatically generate personalized memory exercises.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="toy-press rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-soft"
        >
          {showAddForm ? "Cancel" : "＋ Add Family Member"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddMemory} className="rounded-2xl bg-muted/40 p-5 border border-border space-y-4 animate-pop">
          <h3 className="font-display text-base font-bold">New Family Member Record</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ravi Sharma"
                required
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>

            <label className="block text-xs font-bold">
              Relationship
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
              >
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Spouse">Spouse</option>
                <option value="Granddaughter">Granddaughter</option>
                <option value="Grandson">Grandson</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Friend">Friend</option>
              </select>
            </label>

            <label className="block text-xs font-bold sm:col-span-2">
              Photo Image URL (or Web Image Link)
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/photo-..."
                required
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>

            <label className="block text-xs font-bold">
              Location (City)
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Delhi"
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>

            <label className="block text-xs font-bold sm:col-span-2">
              Warm Memory Note / Story
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Visits every Sunday morning and brings fresh sweets."
                rows={2}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary resize-none"
              />
            </label>
          </div>

          <button
            type="submit"
            className="toy-press rounded-full bg-primary px-6 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-soft"
          >
            Save Family Member
          </button>
        </form>
      )}

      {/* Existing Memory Items Table */}
      <div className="grid gap-3 sm:grid-cols-3">
        {memories.map((m) => (
          <div key={m.id} className="rounded-2xl bg-card border border-border p-3.5 flex items-center gap-3 relative shadow-soft">
            <img
              src={m.photoUrl}
              alt={m.name}
              className="size-14 rounded-xl object-cover border border-border shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-sm text-foreground truncate">{m.name}</p>
              <p className="text-xs text-primary font-bold">{m.relation}</p>
              {m.location && <p className="text-xs text-muted-foreground">📍 {m.location}</p>}
            </div>
            <button
              onClick={() => handleDeleteMemory(m.id)}
              className="text-xs text-muted-foreground hover:text-destructive p-1"
              title="Delete Memory"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaregiverReminderManager() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"medication" | "routine" | "activity" | "appointment">("medication");
  const [time, setTime] = useState("09:00");

  useEffect(() => {
    setReminders(getStoredReminders());
  }, []);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReminder: ReminderItem = {
      id: `rem-${Date.now()}`,
      patientId: "default",
      title: title.trim(),
      type,
      time,
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      completedToday: false,
    };

    const next = [...reminders, newReminder];
    setReminders(next);
    saveStoredReminders(next);

    setTitle("");
    setTime("09:00");
    setShowAddForm(false);
  };

  const handleDeleteReminder = (id: string) => {
    if (window.confirm("Remove this reminder?")) {
      const next = reminders.filter((r) => r.id !== id);
      setReminders(next);
      saveStoredReminders(next);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">💊 Medication & Routine Reminders</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure daily medications, hydration, and gentle activity prompts for the patient.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="toy-press rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-soft"
        >
          {showAddForm ? "Cancel" : "＋ Add Reminder"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddReminder} className="rounded-2xl bg-muted/40 p-5 border border-border space-y-4 animate-pop">
          <h3 className="font-display text-base font-bold">New Reminder Schedule</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-xs font-bold sm:col-span-2">
              Reminder Title / Medicine Name
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning Blood Pressure Tablet"
                required
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>

            <label className="block text-xs font-bold">
              Category
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
              >
                <option value="medication">💊 Medication</option>
                <option value="routine">💧 Hydration / Routine</option>
                <option value="activity">🚶 Activity / Walk</option>
                <option value="appointment">🩺 Medical Appointment</option>
              </select>
            </label>

            <label className="block text-xs font-bold">
              Scheduled Time (24h)
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>
          </div>

          <button
            type="submit"
            className="toy-press rounded-full bg-primary px-6 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-soft"
          >
            Save Reminder
          </button>
        </form>
      )}

      {/* Reminders List */}
      <div className="grid gap-3 sm:grid-cols-2">
        {reminders.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between gap-3 shadow-soft"
          >
            <div>
              <p className="font-display font-bold text-base text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                ⏰ {r.time} · <span className="capitalize">{r.type}</span>
              </p>
            </div>
            <button
              onClick={() => handleDeleteReminder(r.id)}
              className="text-xs text-muted-foreground hover:text-destructive p-1"
              title="Delete Reminder"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

