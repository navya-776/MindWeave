import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, GameHeader, RoundSummary } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { getStoredMemories, generateMemoryExercises, type MemoryExercise } from "@/lib/intelliplay/memoryVault";
import type { RoundResult } from "@/lib/intelliplay/types";

export const Route = createFileRoute("/play/memory")({
  head: () => ({
    meta: [
      { title: "Family & Personal Memory Recall — MindWeave" },
      {
        name: "description",
        content: "Personalized family memory recognition and recall exercises for elderly users.",
      },
    ],
  }),
  component: MemoryGamePage,
});

function MemoryGamePage() {
  const { profile, ready, submitRound } = useProfile();
  const navigate = useNavigate();

  const [exercises, setExercises] = useState<MemoryExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completedResult, setCompletedResult] = useState<RoundResult | null>(null);

  useEffect(() => {
    const mems = getStoredMemories();
    const generated = generateMemoryExercises(mems);
    setExercises(generated);
  }, []);

  if (!ready) {
    return (
      <AppShell>
        <div className="panel p-8 text-center font-display text-xl">Loading Memory Activity…</div>
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

  if (exercises.length === 0) {
    return (
      <AppShell>
        <div className="panel p-8 text-center max-w-lg mx-auto my-12 space-y-4">
          <span className="text-5xl">🖼️</span>
          <h2 className="font-display text-2xl font-bold">No Family Memories Found</h2>
          <p className="text-muted-foreground">
            Ask your caregiver to add family photos and memories in the Memory Vault to start personalized memory recall.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/memories" className="toy-press rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground">
              Open Memory Vault
            </Link>
            <Link to="/" className="toy-press rounded-full border-2 border-border px-6 py-3 font-display font-bold">
              Back to Home
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const current = exercises[currentIndex]!;
  const isLast = currentIndex === exercises.length - 1;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === current.correctAnswerIndex;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = async () => {
    if (isLast) {
      const duration = Math.max(5, (Date.now() - startTime) / 1000);
      const accuracy = exercises.length > 0 ? correctCount / exercises.length : 1;
      try {
        const res = await submitRound("simon", {
          accuracy,
          timeTaken: duration,
          expectedTime: exercises.length * 10,
          attempts: exercises.length,
          mistakes: exercises.length - correctCount,
          hintsUsed,
          completed: true,
        });
        setCompletedResult(res);
      } catch (err) {
        console.error("Error submitting round:", err);
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
    }
  };

  if (completedResult) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="panel p-8 text-center space-y-4">
            <span className="text-5xl">🌟</span>
            <h1 className="font-display text-3xl font-bold">Memory Session Complete</h1>
            <p className="text-lg text-muted-foreground">
              You remembered <strong>{correctCount}</strong> out of <strong>{exercises.length}</strong> family memory prompts!
            </p>
          </div>

          <RoundSummary
            result={completedResult}
            onAgain={() => {
              setCompletedResult(null);
              setCurrentIndex(0);
              setCorrectCount(0);
              setSelectedOption(null);
              setIsAnswered(false);
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
          title="Family Memory Recognition"
          emoji="🖼️"
          skills="Family Recognition & Personal Recall"
          params={[
            { label: "Prompt", value: `${currentIndex + 1} of ${exercises.length}` },
            { label: "Pace", value: "Relaxed" },
          ]}
        />

        {/* Exercise Card */}
        <div className="panel p-6 sm:p-8 space-y-6 animate-pop">
          {/* Target Photo if available */}
          {current.targetMemory.photoUrl ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-border">
              <img
                src={current.targetMemory.photoUrl}
                alt={current.targetMemory.name}
                className="size-40 sm:size-48 rounded-2xl object-cover border-4 border-primary/20 shadow-soft shrink-0"
              />
              <div className="text-center sm:text-left space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {current.targetMemory.relation}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold">
                  {current.question}
                </h2>
                {current.targetMemory.notes ? (
                  <p className="text-sm text-muted-foreground italic">
                    "{current.targetMemory.notes}"
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-center">
              {current.question}
            </h2>
          )}

          {/* Multiple Choice Options */}
          {current.options ? (
            <div className="grid gap-3 pt-2">
              {current.options.map((opt, i) => {
                const isSelected = selectedOption === i;
                const isCorrect = i === current.correctAnswerIndex;
                let btnStyle = "border-border bg-card hover:border-primary/50";

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = "border-success bg-success/15 text-success font-bold";
                  } else if (isSelected) {
                    btnStyle = "border-destructive bg-destructive/15 text-destructive";
                  } else {
                    btnStyle = "border-border bg-card opacity-50";
                  }
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(i)}
                    disabled={isAnswered}
                    className={`toy-press w-full p-4 sm:p-5 rounded-2xl border-2 text-left font-display text-lg sm:text-xl transition-all ${btnStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {isAnswered && isCorrect && <span>✅</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Conversational Recall Prompt */
            <div className="space-y-4 text-center py-4 bg-muted/40 rounded-2xl p-6">
              <p className="text-base font-semibold text-foreground">
                💭 "{current.promptText}"
              </p>
              <p className="text-xs text-muted-foreground">
                Take a moment to share or speak aloud with your caregiver.
              </p>
              <button
                onClick={() => setIsAnswered(true)}
                disabled={isAnswered}
                className="toy-press inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground font-display font-bold text-base"
              >
                {isAnswered ? "Memory Shared ✓" : "I Shared a Memory"}
              </button>
            </div>
          )}

          {/* Hint & Assistance Box */}
          {showHint && (
            <div className="rounded-2xl bg-primary/10 p-4 border border-primary/30 text-sm font-semibold text-foreground animate-pop">
              💡 <strong>Hint:</strong> This family member is {current.targetMemory.name} ({current.targetMemory.relation}).
            </div>
          )}

          {/* Controls */}
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

            {isAnswered && (
              <button
                onClick={handleNext}
                className="toy-press rounded-full bg-primary px-8 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-soft"
              >
                {isLast ? "Finish Memory Session" : "Next Memory →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
