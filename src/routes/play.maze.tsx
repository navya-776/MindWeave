import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppShell,
  GameHeader,
  GameWinOverlay,
  NeedsProfile,
  RoundSummary,
  Stat,
} from "@/components/intelliplay/shell";
import {
  crossGameNote,
  recommendation,
  rollingAbility,
  adjustmentFor,
  bandFor,
} from "@/lib/intelliplay/engine";
import { useProfile } from "@/lib/intelliplay/store";
import type { MazeDifficulty, RoundResult } from "@/lib/intelliplay/types";

export const Route = createFileRoute("/play/maze")({
  head: () => ({
    meta: [
      { title: "Path Navigation — MindWeave" },
      {
        name: "description",
        content:
          "Calm adaptive route planning and spatial navigation exercises for senior cognitive support.",
      },
      { property: "og:title", content: "Path Navigation — MindWeave" },
      {
        property: "og:description",
        content:
          "Adaptive spatial reasoning and route planning practice at a relaxed pace.",
      },
    ],
  }),
  component: MazePage,
});

type Cell = { n: boolean; e: boolean; s: boolean; w: boolean };

function buildMaze(size: number, complexity: number) {
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      n: true,
      e: true,
      s: true,
      w: true,
    })),
  );
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const stack: [number, number][] = [[0, 0]];
  visited[0]![0] = true;

  while (stack.length) {
    const [r, c] = stack[stack.length - 1]!;
    const neighbours: [number, number, keyof Cell, keyof Cell][] = [
      [r - 1, c, "n", "s"],
      [r, c + 1, "e", "w"],
      [r + 1, c, "s", "n"],
      [r, c - 1, "w", "e"],
    ].filter(
      ([nr, nc]) =>
        (nr as number) >= 0 &&
        (nr as number) < size &&
        (nc as number) >= 0 &&
        (nc as number) < size &&
        !visited[nr as number]![nc as number],
    ) as [number, number, keyof Cell, keyof Cell][];

    if (!neighbours.length) {
      stack.pop();
      continue;
    }
    const [nr, nc, wall, opposite] =
      neighbours[Math.floor(Math.random() * neighbours.length)]!;
    grid[r]![c]![wall] = false;
    grid[nr]![nc]![opposite] = false;
    visited[nr]![nc] = true;
    stack.push([nr, nc]);
  }

  // extra loops => more possible routes
  const extra = Math.floor(complexity * size * size * 0.25);
  for (let i = 0; i < extra; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (c < size - 1) {
      grid[r]![c]!.e = false;
      grid[r]![c + 1]!.w = false;
    }
  }
  return grid;
}

function shortestPath(grid: Cell[][], size: number) {
  const key = (r: number, c: number) => r * size + c;
  const prev = new Map<number, number>();
  const queue: [number, number][] = [[0, 0]];
  const seen = new Set([key(0, 0)]);
  while (queue.length) {
    const [r, c] = queue.shift()!;
    if (r === size - 1 && c === size - 1) break;
    const cell = grid[r]![c]!;
    const steps: [number, number][] = [];
    if (!cell.n) steps.push([r - 1, c]);
    if (!cell.s) steps.push([r + 1, c]);
    if (!cell.e) steps.push([r, c + 1]);
    if (!cell.w) steps.push([r, c - 1]);
    for (const [nr, nc] of steps) {
      if (nr < 0 || nc < 0 || nr >= size || nc >= size || seen.has(key(nr, nc)))
        continue;
      seen.add(key(nr, nc));
      prev.set(key(nr, nc), key(r, c));
      queue.push([nr, nc]);
    }
  }
  const path: number[] = [];
  let cur = key(size - 1, size - 1);
  while (cur !== key(0, 0)) {
    path.push(cur);
    const p = prev.get(cur);
    if (p === undefined) return [key(0, 0)];
    cur = p;
  }
  path.push(key(0, 0));
  return path.reverse();
}

function MazePage() {
  const { profile } = useProfile();
  if (!profile)
    return (
      <AppShell>
        <NeedsProfile />
      </AppShell>
    );
  return (
    <AppShell>
      <MazeGame />
    </AppShell>
  );
}

function MazeGame() {
  const { profile, submitRound } = useProfile();
  const [diff, setDiff] = useState<MazeDifficulty>(profile!.difficulty.maze);
  const size = diff.size;

  const [seed, setSeed] = useState(0);
  const grid = useMemo(
    () => buildMaze(size, diff.complexity),
    [size, diff.complexity, seed],
  );
  const optimal = useMemo(() => shortestPath(grid, size), [grid, size]);
  const optimalSet = useMemo(() => new Set(optimal), [optimal]);

  const [pos, setPos] = useState(0);
  const [moves, setMoves] = useState(0);
  const [wrongTurns, setWrongTurns] = useState(0);
  const [backtracks, setBacktracks] = useState(0);
  const [hints, setHints] = useState(0);
  const [hintCells, setHintCells] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const visitedRef = useRef(new Set([0]));
  const startRef = useRef(Date.now());

  const finish = useCallback(
    async (completed: boolean) => {
      if (result) return;
      const time = (Date.now() - startRef.current) / 1000;
      const actual = Math.max(1, moves);
      const efficiency = Math.min(1, (optimal.length - 1) / actual);
      const res = await submitRound(
        "maze",
        {
          accuracy: completed ? Math.max(0.35, efficiency) : efficiency * 0.4,
          timeTaken: time,
          expectedTime: (optimal.length - 1) * 1.6 + 8,
          attempts: 1,
          mistakes: wrongTurns,
          hintsUsed: hints,
          completed,
          reactionTime: time / actual,
          mistakeType: wrongTurns > optimal.length ? "wandering" : "dead-end",
        },
        {
          wanders: wrongTurns > (optimal.length - 1) * 0.8,
          timePressureLoss: diff.timeLimit > 0 && !completed,
          slowButAccurate:
            efficiency > 0.8 && time > (optimal.length - 1) * 2.5,
        },
      );
      setResult(res);
      setElapsed(time);
    },
    [
      result,
      moves,
      optimal.length,
      submitRound,
      wrongTurns,
      hints,
      diff.timeLimit,
    ],
  );

  useEffect(() => {
    if (result) return;
    const id = window.setInterval(() => {
      const t = (Date.now() - startRef.current) / 1000;
      setElapsed(t);
      if (diff.timeLimit > 0 && t > diff.timeLimit) finish(false);
    }, 200);
    return () => window.clearInterval(id);
  }, [diff.timeLimit, finish, result]);

  const move = useCallback(
    (dir: "n" | "e" | "s" | "w") => {
      if (result) return;
      const r = Math.floor(pos / size);
      const c = pos % size;
      if (grid[r]![c]![dir]) return;
      const nr = dir === "n" ? r - 1 : dir === "s" ? r + 1 : r;
      const nc = dir === "e" ? c + 1 : dir === "w" ? c - 1 : c;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) return;

      const next = nr * size + nc;
      if (next === pos) return;

      setPos(next);
      setMoves((m) => m + 1);
      if (visitedRef.current.has(next)) setBacktracks((b) => b + 1);
      else visitedRef.current.add(next);
      if (!optimalSet.has(next)) setWrongTurns((w) => w + 1);
      setHintCells([]);

      if (next === size * size - 1) {
        finish(true);
      }
    },
    [grid, optimalSet, result, size, pos, finish],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, "n" | "e" | "s" | "w"> = {
        ArrowUp: "n",
        ArrowRight: "e",
        ArrowDown: "s",
        ArrowLeft: "w",
        w: "n",
        d: "e",
        s: "s",
        a: "w",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const showHint = () => {
    const idx = optimal.indexOf(pos);
    setHintCells(
      idx >= 0 ? optimal.slice(idx + 1, idx + 4) : optimal.slice(0, 3),
    );
    setHints((h) => h + 1);
  };

  const reset = () => {
    setDiff(profile!.difficulty.maze);
    setSeed((s) => s + 1);
    setPos(0);
    setMoves(0);
    setWrongTurns(0);
    setBacktracks(0);
    setHints(0);
    setHintCells([]);
    setResult(null);
    visitedRef.current = new Set([0]);
    startRef.current = Date.now();
    setElapsed(0);
  };

  const ability = rollingAbility(
    profile!.history,
    "maze",
    result?.performance ?? 60,
  );

  return (
    <div
      className={`flex h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] -mb-20 min-h-0 flex-col pb-2 ${
        result ? "overflow-y-auto" : "overflow-hidden"
      }`}
    >
      <div className="shrink-0 [&>.panel]:mb-2 sm:[&>.panel]:mb-3 [&>.panel]:p-3 sm:[&>.panel]:p-4">
        <GameHeader
          title="Maze Escape"
          emoji="🧭"
          skills="spatial reasoning, planning and problem solving"
          note={crossGameNote("maze", profile!.skills)}
          params={[
            { label: "Grid", value: `${size}×${size}` },
            { label: "Complexity", value: diff.complexity.toFixed(2) },
            {
              label: "Time limit",
              value: diff.timeLimit ? `${diff.timeLimit}s` : "relaxed",
            },
            { label: "Hints", value: diff.hintAvailability ? "on" : "off" },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden sm:gap-3 md:grid md:grid-cols-[minmax(0,1fr)_16rem] lg:grid-cols-[minmax(0,1fr)_18rem] md:items-stretch">
        <div className="panel relative flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden p-2.5 sm:p-3.5">
          <GameWinOverlay
            show={!!result && result.metrics.completed}
            onNextGame={reset}
          />
          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
            <div
              className="mx-auto grid aspect-square h-full max-h-full max-w-full overflow-hidden rounded-xl bg-muted/40"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0,1fr))` }}
            >
              {Array.from({ length: size * size }, (_, i) => {
                const r = Math.floor(i / size);
                const c = i % size;
                const cell = grid[r]![c]!;
                const isGoal = i === size * size - 1;
                return (
                  <div
                    key={i}
                    className="relative grid place-items-center"
                    style={{
                      borderTop: cell.n
                        ? "3px solid var(--foreground)"
                        : "3px solid transparent",
                      borderRight: cell.e
                        ? "3px solid var(--foreground)"
                        : "3px solid transparent",
                      borderBottom: cell.s
                        ? "3px solid var(--foreground)"
                        : "3px solid transparent",
                      borderLeft: cell.w
                        ? "3px solid var(--foreground)"
                        : "3px solid transparent",
                      backgroundColor: hintCells.includes(i)
                        ? "var(--warning)"
                        : undefined,
                    }}
                  >
                    {i === pos ? (
                      <span className="select-none text-[min(3.8vw,min(3.8vh,1.5rem))] leading-none">
                        🐣
                      </span>
                    ) : isGoal ? (
                      <span className="select-none text-[min(3.8vw,min(3.8vh,1.5rem))] leading-none">
                        🏡
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-1.5 flex shrink-0 flex-col items-center gap-1 sm:mt-2.5">
            <button
              onClick={() => move("n")}
              className="toy-press size-9 rounded-xl bg-primary text-base text-primary-foreground shadow-toy sm:size-10 sm:text-lg lg:size-11 lg:text-xl"
              aria-label="Move Up"
            >
              ▲
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => move("w")}
                className="toy-press size-9 rounded-xl bg-primary text-base text-primary-foreground shadow-toy sm:size-10 sm:text-lg lg:size-11 lg:text-xl"
                aria-label="Move Left"
              >
                ◀
              </button>
              <button
                onClick={() => move("s")}
                className="toy-press size-9 rounded-xl bg-primary text-base text-primary-foreground shadow-toy sm:size-10 sm:text-lg lg:size-11 lg:text-xl"
                aria-label="Move Down"
              >
                ▼
              </button>
              <button
                onClick={() => move("e")}
                className="toy-press size-9 rounded-xl bg-primary text-base text-primary-foreground shadow-toy sm:size-10 sm:text-lg lg:size-11 lg:text-xl"
                aria-label="Move Right"
              >
                ▶
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              Use arrow keys or the buttons
            </p>
          </div>
        </div>

        <aside className="panel flex shrink-0 flex-col justify-between space-y-2 overflow-y-auto p-2.5 sm:space-y-3 sm:p-3.5 md:h-full">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-2 sm:gap-2">
              <Stat label="Moves" value={moves} />
              <Stat label="Best route" value={optimal.length - 1} />
              <Stat label="Wrong turns" value={wrongTurns} />
              <Stat label="Backtracks" value={backtracks} />
            </div>
            <Stat
              label={diff.timeLimit ? "Time left" : "Time"}
              value={`${diff.timeLimit ? Math.max(0, diff.timeLimit - elapsed).toFixed(0) : elapsed.toFixed(0)}s`}
            />
          </div>
          <div className="flex flex-col gap-1.5 pt-1 sm:flex-row md:flex-col sm:gap-2">
            {diff.hintAvailability && !result ? (
              <button
                onClick={showHint}
                className="toy-press flex-1 rounded-full bg-warning px-3 py-2 font-display text-xs font-bold text-warning-foreground shadow-toy sm:text-sm md:py-2.5 lg:py-3 lg:text-base"
              >
                💡 Show a hint
              </button>
            ) : null}
            {!result ? (
              <button
                onClick={() => finish(false)}
                className="flex-1 rounded-full border-2 border-border px-3 py-1.5 text-xs font-bold sm:text-sm md:py-2"
              >
                Give up this round
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      {result ? (
        <div className="mt-3 shrink-0 overflow-y-auto sm:mt-4">
          <RoundSummary
            result={result}
            onAgain={reset}
            confidence={recommendation(
              adjustmentFor(bandFor(ability), profile!.streaks.maze),
              ability,
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
