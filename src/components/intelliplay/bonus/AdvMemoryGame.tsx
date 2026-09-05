import { useCallback, useEffect, useRef, useState } from "react";
import type { BonusDifficultyMap, BonusMetrics } from "@/lib/intelliplay/types";
import { cn } from "@/lib/utils";

type Props = {
  difficulty: BonusDifficultyMap["advMemory"];
  onComplete: (metrics: BonusMetrics) => void;
};

const PADS = [
  { id: 0, color: "bg-red-600 hover:bg-red-500 text-white high-contrast:bg-red-700 high-contrast:text-white high-contrast:border-4 high-contrast:border-white", label: "🔴 Red", icon: "🍎" },
  { id: 1, color: "bg-blue-600 hover:bg-blue-500 text-white high-contrast:bg-blue-700 high-contrast:text-white high-contrast:border-4 high-contrast:border-white", label: "🔵 Blue", icon: "🫐" },
  { id: 2, color: "bg-green-600 hover:bg-green-500 text-white high-contrast:bg-green-700 high-contrast:text-white high-contrast:border-4 high-contrast:border-white", label: "🟢 Green", icon: "🍏" },
  { id: 3, color: "bg-amber-400 hover:bg-amber-300 text-black font-extrabold high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:border-4 high-contrast:border-white", label: "🟡 Yellow", icon: "🍌" },
  { id: 4, color: "bg-purple-600 hover:bg-purple-500 text-white high-contrast:bg-purple-800 high-contrast:text-white high-contrast:border-4 high-contrast:border-white", label: "🟣 Purple", icon: "🍇" },
  { id: 5, color: "bg-pink-600 hover:bg-pink-500 text-white high-contrast:bg-pink-800 high-contrast:text-white high-contrast:border-4 high-contrast:border-white", label: "🩷 Pink", icon: "🌸" },
];

export function AdvMemoryGame({ difficulty, onComplete }: Props) {
  const { sequenceLength, speed, paletteSize, reverse } = difficulty;
  const activePads = PADS.slice(0, paletteSize);

  const [sequence, setSequence] = useState<number[]>([]);
  const [targetSeq, setTargetSeq] = useState<number[]>([]);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [activePad, setActivePad] = useState<number | null>(null);

  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "success" | "fail">("idle");
  const [round, setRound] = useState(1);
  const totalRounds = 3;

  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [finished, setFinished] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => setTimeTaken((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [finished]);

  const startRound = useCallback(() => {
    setUserSeq([]);
    setPhase("showing");

    const seq: number[] = [];
    for (let i = 0; i < sequenceLength; i++) {
      seq.push(Math.floor(Math.random() * paletteSize));
    }
    setSequence(seq);

    const expected = reverse ? [...seq].reverse() : seq;
    setTargetSeq(expected);

    // Playback sequence
    const delay = Math.max(300, Math.round(900 - speed * 550));
    let step = 0;

    const playStep = () => {
      if (step >= seq.length) {
        setActivePad(null);
        setPhase("input");
        return;
      }
      setActivePad(seq[step]!);
      timerRef.current = setTimeout(() => {
        setActivePad(null);
        step++;
        timerRef.current = setTimeout(playStep, 150);
      }, delay);
    };

    timerRef.current = setTimeout(playStep, 400);
  }, [sequenceLength, paletteSize, reverse, speed]);

  useEffect(() => {
    startRound();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startRound]);

  const handlePadClick = (id: number) => {
    if (phase !== "input" || finished) return;

    setActivePad(id);
    setTimeout(() => setActivePad(null), 200);

    const nextUser = [...userSeq, id];
    setUserSeq(nextUser);
    setTotalAttempts((a) => a + 1);

    const idx = nextUser.length - 1;
    if (targetSeq[idx] === id) {
      setTotalCorrect((c) => c + 1);
      // Check if finished sequence for this round
      if (nextUser.length === targetSeq.length) {
        if (round < totalRounds) {
          setPhase("success");
          setTimeout(() => {
            setRound((r) => r + 1);
            startRound();
          }, 1200);
        } else {
          setFinished(true);
          setPhase("success");
          const acc = (totalCorrect + 1) / Math.max(1, totalAttempts + 1);
          const expectedTime = sequenceLength * totalRounds * 3;
          onComplete({
            accuracy: Math.min(1, acc),
            timeTaken,
            expectedTime,
            hintsUsed: 0,
            completed: true,
          });
        }
      }
    } else {
      // Incorrect pad pressed
      setPhase("fail");
      setTimeout(() => {
        if (round < totalRounds) {
          setRound((r) => r + 1);
          startRound();
        } else {
          setFinished(true);
          const acc = totalCorrect / Math.max(1, totalAttempts + 1);
          const expectedTime = sequenceLength * totalRounds * 3;
          onComplete({
            accuracy: Math.min(1, acc),
            timeTaken,
            expectedTime,
            hintsUsed: 0,
            completed: true,
          });
        }
      }, 1400);
    }
  };

  return (
    <div className="panel animate-pop flex flex-col items-center p-6 text-center">
      <div className="w-full max-w-md flex items-center justify-between">
        <div>
          <span className="font-display text-xl font-bold">🧠 Advanced Memory</span>
          <p className="text-xs font-semibold text-muted-foreground">
            Round {round} of {totalRounds} | Sequence Length: {sequenceLength}
          </p>
        </div>
        <span className="text-sm font-bold bg-muted px-3 py-1 rounded-full">
          Time: {timeTaken}s
        </span>
      </div>

      {reverse ? (
        <div className="mt-4 w-full max-w-md rounded-xl bg-accent/20 px-4 py-2 text-sm font-bold text-accent-foreground">
          🔄 REVERSE MODE: Repeat the sequence BACKWARDS!
        </div>
      ) : null}

      {/* Status banner */}
      <div className="mt-4 font-display text-lg font-bold min-h-8">
        {phase === "showing" && "👀 Watch carefully..."}
        {phase === "input" && "👉 Your turn! Click the sequence."}
        {phase === "success" && "🎉 Spot on! Great memory!"}
        {phase === "fail" && "❌ Oops! Let's try the next one."}
      </div>

      {/* Pads */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-md">
        {activePads.map((pad) => {
          const isActive = activePad === pad.id;
          return (
            <button
              key={pad.id}
              onClick={() => handlePadClick(pad.id)}
              disabled={phase !== "input" || finished}
              className={cn(
                "toy-press flex flex-col items-center justify-center p-6 rounded-3xl font-display text-2xl font-bold shadow-soft transition-all h-28 sm:h-32",
                pad.color,
                isActive ? "scale-105 ring-8 ring-white shadow-toy brightness-125" : "opacity-90"
              )}
            >
              <span className="text-3xl">{pad.icon}</span>
              <span className="text-sm mt-1 font-bold">{pad.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
