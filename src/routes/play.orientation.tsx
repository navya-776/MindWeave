import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, GameHeader, RoundSummary } from "@/components/intelliplay/shell";
import { useProfile } from "@/lib/intelliplay/store";
import { SeniorVoiceBar } from "@/components/intelliplay/SeniorVoiceBar";
import type { RoundResult } from "@/lib/intelliplay/types";

export const Route = createFileRoute("/play/orientation")({
  head: () => ({
    meta: [
      { title: "Daily Orientation Check-In — MindWeave" },
      {
        name: "description",
        content: "Calm daily orientation exercises: date, time, season, and calendar recall for seniors.",
      },
    ],
  }),
  component: OrientationGamePage,
});

type OrientationQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
};

function generateOrientationQuestions(): OrientationQuestion[] {
  const now = new Date();

  // 1. Day of the week
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = days[now.getDay()]!;
  const dayOptions = [
    currentDay,
    days[(now.getDay() + 1) % 7]!,
    days[(now.getDay() + 5) % 7]!,
  ].sort(() => Math.random() - 0.5);

  // 2. Current Month
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = months[now.getMonth()]!;
  const monthOptions = [
    currentMonth,
    months[(now.getMonth() + 2) % 12]!,
    months[(now.getMonth() + 7) % 12]!,
  ].sort(() => Math.random() - 0.5);

  // 3. Time of Day
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const timeOptions = ["Morning", "Afternoon", "Evening"];

  // 4. Current Year
  const currentYear = String(now.getFullYear());
  const yearOptions = [
    currentYear,
    String(now.getFullYear() - 1),
    String(now.getFullYear() + 1),
  ].sort(() => Math.random() - 0.5);

  return [
    {
      id: "q-day",
      question: "Which day of the week is today?",
      options: dayOptions,
      correctIndex: dayOptions.indexOf(currentDay),
      hint: `Today is the day after ${days[(now.getDay() + 6) % 7]}.`,
    },
    {
      id: "q-month",
      question: "Which month of the year are we in right now?",
      options: monthOptions,
      correctIndex: monthOptions.indexOf(currentMonth),
      hint: `This month follows ${months[(now.getMonth() + 11) % 12]}.`,
    },
    {
      id: "q-time",
      question: `Looking outside or at the clock, is it currently Morning, Afternoon, or Evening?`,
      options: timeOptions,
      correctIndex: timeOptions.indexOf(timeOfDay),
      hint: `The current hour is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    },
    {
      id: "q-year",
      question: "What is the current calendar year?",
      options: yearOptions,
      correctIndex: yearOptions.indexOf(currentYear),
      hint: `We are in the 2020s decade.`,
    },
  ];
}

function OrientationGamePage() {
  const { profile, ready, submitRound } = useProfile();
  const [questions, setQuestions] = useState<OrientationQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());
  const [completedResult, setCompletedResult] = useState<RoundResult | null>(null);

  useEffect(() => {
    setQuestions(generateOrientationQuestions());
  }, []);

  if (!ready) {
    return (
      <AppShell>
        <div className="panel p-8 text-center font-display text-xl">Loading Orientation Activity…</div>
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

  if (questions.length === 0) return null;

  const current = questions[currentIndex]!;
  const isLast = currentIndex === questions.length - 1;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === current.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = async () => {
    if (isLast) {
      const duration = Math.max(5, (Date.now() - startTime) / 1000);
      const accuracy = questions.length > 0 ? correctCount / questions.length : 1;
      try {
        const res = await submitRound("simon", {
          accuracy,
          timeTaken: duration,
          expectedTime: questions.length * 8,
          attempts: questions.length,
          mistakes: questions.length - correctCount,
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

  const handleVoiceAnswer = (transcript: string) => {
    const lower = transcript.toLowerCase();
    const matchIdx = current.options.findIndex((opt) => lower.includes(opt.toLowerCase()));
    if (matchIdx !== -1) {
      handleSelectOption(matchIdx);
    }
  };

  if (completedResult) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="panel p-8 text-center space-y-4">
            <span className="text-5xl">☀️</span>
            <h1 className="font-display text-3xl font-bold">Daily Orientation Completed</h1>
            <p className="text-lg text-muted-foreground">
              You answered <strong>{correctCount}</strong> out of <strong>{questions.length}</strong> orientation questions correctly.
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
              setQuestions(generateOrientationQuestions());
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
          title="Daily Orientation Check-In"
          emoji="☀️"
          skills="Date, Time, Season & Calendar Awareness"
          params={[
            { label: "Question", value: `${currentIndex + 1} of ${questions.length}` },
            { label: "Pace", value: "Relaxed" },
          ]}
        />

        {/* Voice Assistant Bar */}
        <SeniorVoiceBar
          promptText={current.question}
          onVoiceResult={handleVoiceAnswer}
        />

        {/* Question Panel */}
        <div className="panel p-6 sm:p-8 space-y-6 animate-pop">
          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
              Orientation Question {currentIndex + 1}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {current.question}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="grid gap-3 pt-2">
            {current.options.map((opt, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = i === current.correctIndex;
              let btnStyle = "border-border bg-card hover:border-primary/50";

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = "border-success bg-success/15 text-success font-bold high-contrast:bg-success/25 high-contrast:border-2";
                } else if (isSelected) {
                  btnStyle = "border-destructive bg-destructive/15 text-destructive high-contrast:bg-destructive/25 high-contrast:border-2";
                } else {
                  btnStyle = "border-border bg-card opacity-50 high-contrast:opacity-75";
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

          {/* Hint Area */}
          {showHint && (
            <div className="rounded-2xl bg-primary/10 p-4 border border-primary/30 text-sm font-semibold text-foreground animate-pop">
              💡 <strong>Hint:</strong> {current.hint}
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

            {isAnswered && (
              <button
                onClick={handleNext}
                className="toy-press rounded-full bg-primary px-8 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-soft"
              >
                {isLast ? "Complete Orientation" : "Next Question →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
