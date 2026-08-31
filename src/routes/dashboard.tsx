import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, NeedsProfile, SkillBar, Stat } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { BONUS_LABELS, GAME_LABELS, SKILLS, SKILL_LABELS, type GameType } from "@/lib/intelliplay/types";
import { BADGES, evaluateBonus } from "@/lib/intelliplay/bonus";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Activity Summary — MindWeave" },
      {
        name: "description",
        content:
          "Cognitive activity summary: skill profile, strengths, observations, and session engagement history.",
      },
      { property: "og:title", content: "Activity Summary — MindWeave" },
      {
        property: "og:description",
        content: "Track cognitive engagement across personalized activities.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, ready, reset } = useProfile();
  if (!ready)
    return (
      <AppShell>
        <div className="panel p-8 text-center font-display text-xl">Loading…</div>
      </AppShell>
    );
  if (!profile)
    return (
      <AppShell>
        <NeedsProfile />
      </AppShell>
    );

  const skills = SKILLS.map((s) => ({ skill: SKILL_LABELS[s], value: profile.skills[s], key: s }));
  const sorted = [...skills].sort((a, b) => b.value - a.value);
  const strengths = sorted.slice(0, 3);
  const growth = sorted.slice(-2);

  const trend = profile.history.map((r, i) => ({
    session: i + 1,
    score: Math.round(r.metrics.accuracy * 100),
    game: GAME_LABELS[r.gameType],
  }));

  const perGame = (Object.keys(GAME_LABELS) as GameType[]).map((g) => {
    const rounds = profile.history.filter((r) => r.gameType === g);
    const avg = rounds.length
      ? Math.round((rounds.reduce((a, r) => a + r.metrics.accuracy, 0) / rounds.length) * 100)
      : 0;
    return { game: g, rounds: rounds.length, avg };
  });

  return (
    <AppShell>
      <div className="panel animate-pop mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="font-display text-3xl font-bold">{profile.name}'s Activity Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Age {profile.age} · Care Level: <strong className="capitalize text-foreground">{profile.careLevel}</strong> · {profile.history.length} cognitive sessions completed
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Reset profile and historical session data?")) reset();
          }}
          className="rounded-full border-2 border-border px-4 py-2 text-xs font-bold hover:bg-muted transition-colors"
        >
          Reset Profile
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="font-display text-xl font-bold mb-4">Cognitive Profile Overview</h2>
          <div className="space-y-3">
            {SKILLS.map((s) => (
              <SkillBar key={s} skill={s} value={profile.skills[s]} />
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="font-display text-xl font-bold mb-2">Cognitive Balance</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skills} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Radar
                  dataKey="value"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="font-display text-xl font-bold">Strengths & Engagement Focus</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {strengths.map((s) => (
              <li key={s.key} className="rounded-xl bg-success/15 px-4 py-2.5 flex items-center justify-between">
                <span>🌟 {s.skill}</span>
                <span className="text-success font-bold">{s.value}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-display text-xl font-bold">Recommended Guidance Areas</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {growth.map((s) => (
              <li key={s.key} className="rounded-xl bg-warning/20 px-4 py-2.5 flex items-center justify-between">
                <span>🌱 {s.skill}</span>
                <span className="text-warning-foreground font-bold">{s.value}</span>
              </li>
            ))}
          </ul>
          {profile.patterns.length ? (
            <>
              <h2 className="mt-6 font-display text-xl font-bold">Observed Behavioral Patterns</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {profile.patterns.map((p) => (
                  <li key={p} className="rounded-xl bg-muted/60 px-4 py-2.5">
                    🔍 {p}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section className="panel p-6">
          <h2 className="font-display text-xl font-bold">Accuracy Across Sessions</h2>
          {trend.length > 1 ? (
            <div className="h-64 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis dataKey="session" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Complete a few sessions to view your accuracy trend.
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {perGame.map((g) => (
              <Stat
                key={g.game}
                label={GAME_LABELS[g.game]}
                value={g.rounds ? `${g.avg}% accuracy · ${g.rounds}×` : "Not played yet"}
              />
            ))}
          </div>
        </section>

        <section className="panel p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Adaptive AI Guidance Log</h2>
          {profile.history.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No sessions completed yet.</p>
          ) : (
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
              {[...profile.history]
                .reverse()
                .slice(0, 12)
                .map((r) => (
                  <div key={r.id} className="rounded-2xl bg-muted/50 px-4 py-3.5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
                      <span className="font-display text-base">{GAME_LABELS[r.gameType]}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-card px-3 py-1 border border-border">
                          {Math.round(r.metrics.accuracy * 100)}% Accuracy
                        </span>
                        <span className="rounded-full bg-card px-3 py-1 border border-border">
                          {r.metrics.timeTaken.toFixed(0)}s Duration
                        </span>
                        <span className="text-muted-foreground">
                          {r.metrics.hintsUsed} hints used
                        </span>
                      </div>
                    </div>
                    {r.notes.map((n) => (
                      <p key={n} className="mt-2 text-xs text-muted-foreground font-semibold">
                        ⚙️ {n}
                      </p>
                    ))}
                  </div>
                ))}
            </div>
          )}
          <div className="mt-6">
            <Link
              to="/"
              className="toy-press inline-block rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground shadow-soft"
            >
              Return to Activities
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
