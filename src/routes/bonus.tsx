import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, NeedsProfile, Stat } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { evaluateBonus } from "@/lib/intelliplay/bonus";
import { BONUS_EMOJI, BONUS_LABELS, BONUS_SKILL, SKILL_LABELS, type BonusMetrics, type BonusResult } from "@/lib/intelliplay/types";

import { SudokuGame } from "@/components/intelliplay/bonus/SudokuGame";
import { AdvMazeGame } from "@/components/intelliplay/bonus/AdvMazeGame";
import { AdvMemoryGame } from "@/components/intelliplay/bonus/AdvMemoryGame";
import { LogicGridGame } from "@/components/intelliplay/bonus/LogicGridGame";
import { PatternGame } from "@/components/intelliplay/bonus/PatternGame";

export const Route = createFileRoute("/bonus")({
  head: () => ({
    meta: [
      { title: "Advanced Cognitive Puzzle — MindWeave" },
      {
        name: "description",
        content: "Personalized advanced cognitive exercises tailored to your steady practice.",
      },
    ],
  }),
  component: BonusPage,
});

function BonusPage() {
  const { profile, ready, submitBonus, dismissBonus } = useProfile();
  const router = useRouter();

  const [view, setView] = useState<"offer" | "playing" | "result">("offer");
  const [result, setResult] = useState<BonusResult | null>(null);

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

  const offer = evaluateBonus(profile);

  const handleBonusComplete = async (metrics: BonusMetrics) => {
    const res = await submitBonus(offer.game, metrics);
    setResult(res);
    setView("result");
  };

  const handleDismiss = () => {
    dismissBonus();
    router.navigate({ to: "/" });
  };

  if (view === "playing") {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          {offer.game === "sudoku" && (
            <SudokuGame
              difficulty={profile.bonus.difficulty.sudoku}
              onComplete={handleBonusComplete}
            />
          )}
          {offer.game === "advMaze" && (
            <AdvMazeGame
              difficulty={profile.bonus.difficulty.advMaze}
              onComplete={handleBonusComplete}
            />
          )}
          {offer.game === "advMemory" && (
            <AdvMemoryGame
              difficulty={profile.bonus.difficulty.advMemory}
              onComplete={handleBonusComplete}
            />
          )}
          {offer.game === "logicGrid" && (
            <LogicGridGame
              difficulty={profile.bonus.difficulty.logicGrid}
              onComplete={handleBonusComplete}
            />
          )}
          {offer.game === "pattern" && (
            <PatternGame
              difficulty={profile.bonus.difficulty.pattern}
              onComplete={handleBonusComplete}
            />
          )}
        </div>
      </AppShell>
    );
  }

  if (view === "result" && result) {
    return (
      <AppShell>
        <div className="panel animate-pop mx-auto max-w-xl p-8 text-center">
          <span className="text-6xl">🌟</span>
          <h1 className="mt-4 font-display text-4xl font-bold">Activity Complete!</h1>
          <p className="mt-1 text-muted-foreground">
            {BONUS_LABELS[result.game]} · Level {result.level}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Score" value={`${result.performance}`} />
            <Stat label="Accuracy" value={`${Math.round(result.accuracy * 100)}%`} />
            <Stat label="Time" value={`${result.timeTaken}s`} />
          </div>

          {result.notes.length > 0 ? (
            <div className="mt-6 text-left rounded-2xl bg-muted/60 p-4">
              <h3 className="font-display text-sm font-bold uppercase text-muted-foreground">
                ⚙️ Adaptive AI Response
              </h3>
              <ul className="mt-2 space-y-1 text-sm font-semibold">
                {result.notes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="toy-press rounded-full bg-primary px-6 py-3 font-display text-lg font-bold text-primary-foreground shadow-soft"
            >
              Back to Activities
            </Link>
            <Link
              to="/dashboard"
              className="toy-press rounded-full border-2 border-border bg-card px-6 py-3 font-display text-lg font-bold"
            >
              View Activity Summary
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!offer.unlocked) {
    return (
      <AppShell>
        <div className="panel animate-pop mx-auto max-w-xl p-8">
          <div className="text-center">
            <span className="text-5xl">🔒</span>
            <h1 className="mt-3 font-display text-3xl font-bold">Advanced Challenge Locked</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your daily core activities to unlock advanced cognitive puzzles!
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-destructive/10 p-5 border border-destructive/20">
            <h3 className="font-display text-base font-bold text-destructive">
              📋 Why it's locked today:
            </h3>
            <ul className="mt-2 space-y-2 text-sm font-medium">
              {offer.blockers.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <span>❌</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-center">
            <Stat label="Activities Completed" value={`${offer.gamesCompleted} / 4`} />
            <Stat label="Daily Average" value={`${offer.dailyAverage}% / 85%`} />
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="toy-press inline-block rounded-full bg-primary px-6 py-3 font-display text-lg font-bold text-primary-foreground shadow-soft"
            >
              Play Main Activities
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="panel animate-pop mx-auto max-w-xl p-8 text-center">
        <span className="text-6xl">{BONUS_EMOJI[offer.game]}</span>
        <h1 className="mt-3 font-display text-4xl font-bold">
          🌟 Advanced Challenge Available!
        </h1>
        <p className="mt-2 text-lg font-bold text-primary">
          {BONUS_LABELS[offer.game]}
        </p>
        <p className="text-sm text-muted-foreground">
          Target Skill: {SKILL_LABELS[BONUS_SKILL[offer.game]]} · Est. Time: {offer.estimatedMinutes} min
        </p>

        {/* Explainable AI Card */}
        <div className="mt-6 text-left rounded-2xl bg-card border-2 border-primary/30 p-5 shadow-soft">
          <h3 className="font-display text-sm font-bold uppercase text-primary">
            🤖 Why this challenge is available for {profile.name}:
          </h3>
          <ul className="mt-2 space-y-2 text-sm font-semibold">
            {offer.reasons.map((r) => (
              <li key={r} className="flex items-center gap-2">
                <span>🌟</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setView("playing")}
            className="toy-press rounded-full bg-primary px-8 py-4 font-display text-xl font-bold text-primary-foreground shadow-soft"
          >
            Start Challenge →
          </button>
          <button
            onClick={handleDismiss}
            className="toy-press rounded-full border-2 border-border bg-card px-6 py-4 font-display text-lg font-bold"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </AppShell>
  );
}
