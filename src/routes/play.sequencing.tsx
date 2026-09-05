import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, GameHeader, RoundSummary } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { SeniorVoiceBar } from "@/components/intelliplay/SeniorVoiceBar";
import type { RoundResult } from "@/lib/intelliplay/types";

export const Route = createFileRoute("/play/sequencing")({
  head: () => ({
    meta: [
      { title: "Daily Routine Sequencing — MindWeave" },
      {
        name: "description",
        content: "Arrange everyday activity steps in proper chronological order to support executive function.",
      },
    ],
  }),
  component: SequencingGamePage,
});

type StepItem = {
  id: string;
  text: string;
  order: number; // 0-indexed correct order
};

type RoutineScenario = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  steps: StepItem[];
};

const SCENARIOS: RoutineScenario[] = [
  {
    id: "sc-tea",
    title: "Making a Warm Cup of Tea",
    emoji: "🍵",
    description: "Put the steps for making morning tea into the correct chronological order.",
    steps: [
      { id: "s1", text: "Boil fresh water in the kettle or pot", order: 0 },
      { id: "s2", text: "Add tea leaves or tea bag and brew for a few minutes", order: 1 },
      { id: "s3", text: "Add a splash of milk and a spoonful of honey", order: 2 },
      { id: "s4", text: "Pour into your favourite cup and enjoy", order: 3 },
    ],
  },
  {
    id: "sc-walk",
    title: "Preparing for an Evening Walk",
    emoji: "🚶‍♂️",
    description: "Arrange the steps you take before stepping outside for a gentle walk.",
    steps: [
      { id: "s1", text: "Put on comfortable walking shoes and socks", order: 0 },
      { id: "s2", text: "Take your walking stick or support if needed", order: 1 },
      { id: "s3", text: "Check that the house door is safely closed", order: 2 },
      { id: "s4", text: "Step outside into the garden or park path", order: 3 },
    ],
  },
  {
    id: "sc-morning",
    title: "Morning Freshness Routine",
    emoji: "🌅",
    description: "Arrange the steps for your morning wake-up routine.",
    steps: [
      { id: "s1", text: "Wake up and sit calmly on the edge of the bed", order: 0 },
      { id: "s2", text: "Wash your face with warm water and brush teeth", order: 1 },
      { id: "s3", text: "Drink a glass of warm water", order: 2 },
      { id: "s4", text: "Enjoy a nutritious morning breakfast", order: 3 },
    ],
  },
];

function SequencingGamePage() {
  const { profile, ready, submitRound } = useProfile();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState<StepItem[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completedResult, setCompletedResult] = useState<RoundResult | null>(null);

  const scenario = SCENARIOS[scenarioIndex]!;

  useEffect(() => {
    // Scramble the steps
    const scrambled = [...scenario.steps].sort(() => Math.random() - 0.5);
    setCurrentSteps(scrambled);
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);
  }, [scenarioIndex]);

  if (!ready) {
    return (
      <AppShell>
        <div className="panel p-8 text-center font-display text-xl">Loading Routine Activity…</div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="panel p-8 text-center max-w-md mx-auto my-12 space-y-4">
          <h2 className="font-display text-2xl font-bold">Please set up a profile first</h2>
          <Link to="/" className="toy-press inline-block rounded-full bg-primary px-6 py-3 font-display text-lg font-bold text-primary-foreground">
            Go to Setup
          </Link>
        </div>
      </AppShell>
    );
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    if (isAnswered) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= currentSteps.length) return;

    const copy = [...currentSteps];
    const temp = copy[index]!;
    copy[index] = copy[target]!;
    copy[target] = temp;
    setCurrentSteps(copy);
  };

  const handleCheckOrder = () => {
    const correct = currentSteps.every((step, idx) => step.order === idx);
    setIsCorrect(correct);
    setIsAnswered(true);
  };

  const handleNext = async () => {
    const isLast = scenarioIndex === SCENARIOS.length - 1;
    if (isLast) {
      const duration = Math.max(8, (Date.now() - startTime) / 1000);
      try {
        const res = await submitRound("detective", {
          accuracy: isCorrect ? 1.0 : 0.75,
          timeTaken: duration,
          expectedTime: SCENARIOS.length * 15,
          attempts: SCENARIOS.length,
          mistakes: isCorrect ? 0 : 1,
          hintsUsed,
          completed: true,
        });
        setCompletedResult(res);
      } catch (err) {
        console.error("Error submitting round:", err);
      }
    } else {
      setScenarioIndex((i) => i + 1);
    }
  };

  if (completedResult) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="panel p-8 text-center space-y-4">
            <span className="text-5xl">📋</span>
            <h1 className="font-display text-3xl font-bold">Routine Activity Complete</h1>
            <p className="text-lg text-muted-foreground">
              You arranged everyday routine sequences with great focus!
            </p>
          </div>

          <RoundSummary
            result={completedResult}
            onAgain={() => {
              setCompletedResult(null);
              setScenarioIndex(0);
            }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <GameHeader
          title="Daily Routine Sequencing"
          emoji="📋"
          skills="Sequential Planning & Routine Organization"
          params={[
            { label: "Activity", value: `${scenarioIndex + 1} of ${SCENARIOS.length}` },
            { label: "Pace", value: "Relaxed" },
          ]}
        />

        {/* Audio Assistant */}
        <SeniorVoiceBar promptText={`${scenario.title}. ${scenario.description}`} />

        <div className="panel p-6 sm:p-8 space-y-6 animate-pop">
          <div className="flex items-center gap-4 pb-2 border-b border-border">
            <span className="text-4xl">{scenario.emoji}</span>
            <div>
              <h2 className="font-display text-2xl font-bold">{scenario.title}</h2>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
            </div>
          </div>

          {/* Scrambled Steps Cards with Move Up / Down controls */}
          <div className="space-y-3 pt-2">
            {currentSteps.map((step, idx) => {
              const isItemCorrectPosition = isAnswered && step.order === idx;
              let itemBorder = "border-border bg-card";
              if (isAnswered) {
                itemBorder = isItemCorrectPosition
                  ? "border-success bg-success/10 high-contrast:bg-success/20 high-contrast:border-2"
                  : "border-warning bg-warning/10 high-contrast:bg-warning/20 high-contrast:border-2";
              }

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-2 transition-all shadow-soft ${itemBorder}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display font-bold text-sm shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-display text-base sm:text-lg font-semibold text-foreground">
                      {step.text}
                    </span>
                  </div>

                  {!isAnswered ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, "up")}
                        disabled={idx === 0}
                        className="toy-press size-9 rounded-xl border border-border bg-muted flex items-center justify-center font-bold text-sm disabled:opacity-30 hover:border-primary"
                        title="Move step up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, "down")}
                        disabled={idx === currentSteps.length - 1}
                        className="toy-press size-9 rounded-xl border border-border bg-muted flex items-center justify-center font-bold text-sm disabled:opacity-30 hover:border-primary"
                        title="Move step down"
                      >
                        ▼
                      </button>
                    </div>
                  ) : (
                    <span className="text-xl shrink-0">
                      {isItemCorrectPosition ? "✅" : "💡"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback & Hint */}
          {showHint && (
            <div className="rounded-2xl bg-primary/10 p-4 border border-primary/30 text-sm font-semibold text-foreground animate-pop">
              💡 <strong>Hint:</strong> Step 1 should be "{scenario.steps[0]?.text}".
            </div>
          )}

          {isAnswered && (
            <div
              className={`rounded-2xl p-4 text-center font-display text-base font-bold animate-pop ${
                isCorrect ? "bg-success/15 text-success high-contrast:bg-success/25" : "bg-primary/10 text-primary high-contrast:bg-primary/20"
              }`}
            >
              {isCorrect
                ? "✨ Perfect Order! All steps are sequenced accurately."
                : "🌟 Great attempt! The correct daily routine order is highlighted."}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={() => {
                setShowHint(true);
                setHintsUsed((h) => h + 1);
              }}
              className="text-sm font-bold text-muted-foreground hover:text-primary underline"
            >
              💡 Show Hint
            </button>

            {!isAnswered ? (
              <button
                onClick={handleCheckOrder}
                className="toy-press rounded-full bg-primary px-8 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-soft"
              >
                Check Order ✓
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="toy-press rounded-full bg-primary px-8 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-soft"
              >
                {scenarioIndex === SCENARIOS.length - 1 ? "Complete Routine" : "Next Routine →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
