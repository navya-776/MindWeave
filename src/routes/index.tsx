import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { GAME_LABELS, type CareLevel } from "@/lib/intelliplay/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MindWeave — Cognitive & Memory Companion for Seniors" },
      {
        name: "description",
        content:
          "AI-powered cognitive activities, daily orientation, and memory assistance tailored for elderly dementia care.",
      },
      { property: "og:title", content: "MindWeave — Cognitive & Memory Companion for Seniors" },
      {
        property: "og:description",
        content:
          "Personalized cognitive exercises and memory assistance for elderly users.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { profile, ready, user } = useProfile();
  const navigate = useNavigate();

  if (!ready)
    return (
      <AppShell>
        <div className="panel p-8 text-center font-display text-xl">Loading MindWeave…</div>
      </AppShell>
    );

  if (!user) {
    navigate({ to: "/login" });
    return null;
  }

  if (!profile)
    return (
      <AppShell>
        <CreatePatientProfile />
      </AppShell>
    );

  return (
    <AppShell>
      <SeniorHub />
    </AppShell>
  );
}

function CreatePatientProfile() {
  const { start } = useProfile();
  const [name, setName] = useState("");
  const [age, setAge] = useState(72);
  const [careLevel, setCareLevel] = useState<CareLevel>("guided");

  return (
    <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto my-6">
      <section className="animate-pop space-y-4">
        <h1 className="font-display text-4xl font-bold leading-tight">
          Welcome to MindWeave
        </h1>
        <p className="text-lg text-muted-foreground">
          An AI-powered cognitive and memory companion. MindWeave provides calm, personalized activities to support daily orientation, visual memory, and focus — tailored to your comfortable pace.
        </p>
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-soft">
            <span className="text-2xl">🧭</span>
            <div>
              <p className="font-display font-bold text-base">Path Navigation</p>
              <p className="text-xs text-muted-foreground">Spatial reasoning and route planning.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-soft">
            <span className="text-2xl">👀</span>
            <div>
              <p className="font-display font-bold text-base">Spot the Difference</p>
              <p className="text-xs text-muted-foreground">Visual attention and scene observation.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-soft">
            <span className="text-2xl">🎵</span>
            <div>
              <p className="font-display font-bold text-base">Memory Sequence</p>
              <p className="text-xs text-muted-foreground">Short-term recall and pattern recognition.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-soft">
            <span className="text-2xl">🔎</span>
            <div>
              <p className="font-display font-bold text-base">Story & Logic</p>
              <p className="text-xs text-muted-foreground">Logical deduction and context recall.</p>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) start(name.trim(), age, "p1", careLevel);
        }}
        className="panel animate-pop h-fit space-y-5 p-8"
      >
        <h2 className="font-display text-2xl font-bold">Set Up Patient Profile</h2>
        
        <label className="block text-sm font-bold">
          Full Name / Preferred Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Sharma"
            required
            className="mt-1.5 w-full rounded-2xl border-2 border-border bg-background px-4 py-3.5 text-base font-semibold outline-none focus:border-primary"
          />
        </label>

        <label className="block text-sm font-bold">
          Age: {age}
          <input
            type="range"
            min={50}
            max={95}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--primary)] h-3 rounded-lg cursor-pointer"
          />
        </label>

        <div>
          <label className="block text-sm font-bold mb-2">Select Assistance & Guidance Mode</label>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(["independent", "guided", "high-support"] as CareLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setCareLevel(level)}
                className={`p-3 rounded-xl border-2 font-display text-sm font-bold transition-all ${
                  careLevel === level
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {level.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="toy-press w-full rounded-full bg-primary px-6 py-4 font-display text-xl font-bold text-primary-foreground shadow-soft"
        >
          Start Cognitive Session
        </button>
      </form>
    </div>
  );
}

/* ---------------- Senior Patient Home Hub ---------------- */

const CORE_ACTIVITIES = [
  {
    to: "/play/orientation",
    emoji: "☀️",
    title: "Daily Orientation Check-In",
    desc: "Check today's date, time, season, and weather in a calm interactive session.",
    color: "var(--primary)",
  },
  {
    to: "/play/memory",
    emoji: "🖼️",
    title: "Family Memory Recognition",
    desc: "Recognize loved ones, recall relations, and enjoy warm personal stories.",
    color: "var(--accent)",
  },
  {
    to: "/play/sequencing",
    emoji: "📋",
    title: "Daily Routine Sequencing",
    desc: "Arrange everyday activity steps in sequence to support daily independence.",
    color: "var(--detective)",
  },
  {
    to: "/reminders",
    emoji: "💊",
    title: "Medication & Reminders",
    desc: "View your daily health schedule, water intake, and medication checklists.",
    color: "var(--spot)",
  },
  {
    to: "/memories",
    emoji: "📸",
    title: "Family Memories Vault",
    desc: "Browse photo flashcards of family members and loved ones.",
    color: "var(--primary)",
  },
  {
    to: "/play/maze",
    emoji: "🧭",
    title: GAME_LABELS.maze,
    desc: "Plan a clear path through simple routes at your own pace.",
    color: "var(--maze)",
  },
  {
    to: "/play/spot",
    emoji: "👀",
    title: GAME_LABELS.spot,
    desc: "Look closely and find subtle differences in clear scenes.",
    color: "var(--spot)",
  },
  {
    to: "/play/simon",
    emoji: "🎵",
    title: GAME_LABELS.simon,
    desc: "Listen and watch sequence patterns to exercise working memory.",
    color: "var(--simon)",
  },
] as const;

function SeniorHub() {
  const { profile } = useProfile();
  const p = profile!;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-8">
      {/* Daily Orientation Banner */}
      <div className="panel animate-pop p-6 bg-card border-2 border-primary/30 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary text-3xl shrink-0">
            ☀️
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Daily Orientation Check-In
            </span>
            <h2 className="font-display text-2xl font-bold">
              Good day, {p.preferredName || p.name}!
            </h2>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              📅 {dateStr} · 🕒 {timeStr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/play/orientation"
            className="toy-press rounded-full bg-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-soft"
          >
            Start Orientation →
          </Link>
          <span className="rounded-full bg-muted px-3.5 py-2 text-xs font-bold text-muted-foreground border border-border">
            Mode: <strong className="text-foreground capitalize">{p.careLevel}</strong>
          </span>
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Today's Cognitive Activities
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Choose an activity below. Every exercise adapts to your comfortable pace without pressure or time limits.
        </p>
      </div>

      {/* Activity Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {CORE_ACTIVITIES.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            className="panel toy-press animate-pop relative block overflow-hidden p-7 shadow-soft hover:-translate-y-1 transition-all"
            style={{ borderColor: g.color }}
          >
            <span
              className="absolute -right-8 -top-8 size-28 rounded-full opacity-10"
              style={{ background: g.color }}
            />
            <span className="text-5xl">{g.emoji}</span>
            <h2 className="mt-3 font-display text-2xl font-bold">{g.title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-primary">
              <span>Start Activity →</span>
              <span className="text-muted-foreground">Relaxed Pace</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

