import { useCallback, useEffect, useState } from "react";
import type { BonusDifficultyMap, BonusMetrics } from "@/lib/intelliplay/types";
import { cn } from "@/lib/utils";

type Props = {
  difficulty: BonusDifficultyMap["advMaze"];
  onComplete: (metrics: BonusMetrics) => void;
};

type Pos = [number, number];

/** Generates a simple maze grid with walls and open paths using Recursive Backtracking. */
function generateMaze(size: number): { grid: number[][]; start: Pos; goal: Pos } {
  // 0 = path, 1 = wall
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(1));

  function carve(r: number, c: number) {
    grid[r]![c] = 0;
    const dirs: Pos[] = ([
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ] as Pos[]).sort(() => Math.random() - 0.5);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr > 0 && nr < size - 1 && nc > 0 && nc < size - 1 && grid[nr]![nc] === 1) {
        grid[r + dr / 2]![c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  grid[1]![1] = 0; // Start
  grid[size - 2]![size - 2] = 0; // Goal
  // Ensure goal area is open
  grid[size - 2]![size - 3] = 0;
  grid[size - 3]![size - 2] = 0;

  return { grid, start: [1, 1], goal: [size - 2, size - 2] };
}

/** BFS pathfinder for hints & optimal path length. */
function findShortestPath(grid: number[][], start: Pos, goal: Pos): Pos[] {
  const size = grid.length;
  const queue: Pos[][] = [[start]];
  const visited = new Set<string>([`${start[0]},${start[1]}`]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const [r, c] = path[path.length - 1]!;

    if (r === goal[0] && c === goal[1]) return path;

    const dirs: Pos[] = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        grid[nr]![nc] !== 1 &&
        !visited.has(`${nr},${nc}`)
      ) {
        visited.add(`${nr},${nc}`);
        queue.push([...path, [nr, nc]]);
      }
    }
  }
  return [];
}

export function AdvMazeGame({ difficulty, onComplete }: Props) {
  const { size, obstacles, timeLimit, hints } = difficulty;
  const [maze, setMaze] = useState<number[][]>([]);
  const [startPos, setStartPos] = useState<Pos>([1, 1]);
  const [goalPos, setGoalPos] = useState<Pos>([1, 1]);
  const [player, setPlayer] = useState<Pos>([1, 1]);
  const [hazardPositions, setHazardPositions] = useState<Set<string>>(new Set());

  const [steps, setSteps] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintPath, setHintPath] = useState<Set<string>>(new Set());
  const [timeTaken, setTimeTaken] = useState(0);
  const [finished, setFinished] = useState(false);

  const initGame = useCallback(() => {
    const { grid, start, goal } = generateMaze(size);
    setMaze(grid);
    setStartPos(start);
    setGoalPos(goal);
    setPlayer(start);

    // Add hazards on empty tiles (excluding start & goal)
    const emptyCoords: Pos[] = [];
    for (let r = 1; r < size - 1; r++) {
      for (let c = 1; c < size - 1; c++) {
        if (
          grid[r]![c] === 0 &&
          !(r === start[0] && c === start[1]) &&
          !(r === goal[0] && c === goal[1])
        ) {
          emptyCoords.push([r, c]);
        }
      }
    }

    const hazards = new Set<string>();
    emptyCoords.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(obstacles, emptyCoords.length); i++) {
      const [hr, hc] = emptyCoords[i]!;
      hazards.add(`${hr},${hc}`);
    }
    setHazardPositions(hazards);

    setSteps(0);
    setMistakes(0);
    setHintsUsed(0);
    setHintPath(new Set());
    setTimeTaken(0);
    setFinished(false);
  }, [size, obstacles]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setTimeTaken((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [finished]);

  const movePlayer = useCallback(
    (dr: number, dc: number) => {
      if (finished || maze.length === 0) return;
      const [r, c] = player;
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= size || nc < 0 || nc >= size) return;
      if (maze[nr]![nc] === 1) return; // Wall

      const posKey = `${nr},${nc}`;
      if (hazardPositions.has(posKey)) {
        // Hit obstacle hazard
        setMistakes((m) => m + 1);
        return;
      }

      setPlayer([nr, nc]);
      setSteps((s) => s + 1);

      // Check win
      if (nr === goalPos[0] && nc === goalPos[1]) {
        setFinished(true);
        const optPath = findShortestPath(maze, startPos, goalPos);
        const accuracy = Math.min(1, optPath.length / Math.max(1, steps + 1));
        const expectedTime = size * 3;

        onComplete({
          accuracy,
          timeTaken,
          expectedTime,
          hintsUsed,
          completed: true,
        });
      }
    },
    [finished, maze, player, size, hazardPositions, goalPos, startPos, steps, timeTaken, hintsUsed, onComplete]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "w", "W"].includes(e.key)) movePlayer(-1, 0);
      if (["ArrowDown", "s", "S"].includes(e.key)) movePlayer(1, 0);
      if (["ArrowLeft", "a", "A"].includes(e.key)) movePlayer(0, -1);
      if (["ArrowRight", "d", "D"].includes(e.key)) movePlayer(0, 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer]);

  const useHint = () => {
    if (!hints || finished) return;
    const path = findShortestPath(maze, player, goalPos);
    if (path.length > 1) {
      const nextSteps = path.slice(1, 4).map(([r, c]) => `${r},${c}`);
      setHintPath(new Set(nextSteps));
      setHintsUsed((h) => h + 1);
    }
  };

  return (
    <div className="panel animate-pop flex flex-col items-center p-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <div>
          <span className="font-display text-xl font-bold">🗺️ Advanced Maze ({size}×{size})</span>
          <p className="text-xs font-semibold text-muted-foreground">
            Time: {timeTaken}s | Steps: {steps} | Traps hit: {mistakes}
          </p>
        </div>
        {hints ? (
          <button
            onClick={useHint}
            className="toy-press rounded-full border-2 border-border bg-secondary px-3 py-1 text-xs font-bold"
          >
            💡 Hint ({hintsUsed})
          </button>
        ) : null}
      </div>

      {/* Maze Grid */}
      <div
        className="mt-6 grid rounded-2xl border-4 border-primary/40 bg-card p-2 shadow-soft overflow-auto max-w-full"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          width: `${Math.min(480, size * 32)}px`,
          height: `${Math.min(480, size * 32)}px`,
        }}
      >
        {maze.map((row, r) =>
          row.map((cell, c) => {
            const isPlayer = player[0] === r && player[1] === c;
            const isGoal = goalPos[0] === r && goalPos[1] === c;
            const isHazard = hazardPositions.has(`${r},${c}`);
            const isHint = hintPath.has(`${r},${c}`);

            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "flex items-center justify-center font-bold transition-all text-sm sm:text-base",
                  cell === 1
                    ? "bg-muted-foreground/30 high-contrast:bg-foreground rounded-md"
                    : isPlayer
                    ? "bg-primary text-primary-foreground rounded-full text-lg shadow-toy"
                    : isGoal
                    ? "bg-success/30 high-contrast:bg-success high-contrast:text-success-foreground rounded-xl text-xl animate-bounce"
                    : isHazard
                    ? "bg-destructive/20 text-destructive high-contrast:bg-destructive high-contrast:text-destructive-foreground rounded-lg"
                    : isHint
                    ? "bg-warning/40 text-warning-foreground high-contrast:bg-warning high-contrast:text-warning-foreground high-contrast:border-2 high-contrast:border-black rounded-lg animate-pulse"
                    : "bg-background rounded-sm"
                )}
              >
                {isPlayer ? "🧙" : isGoal ? "🏁" : isHazard ? "⚠️" : isHint ? "✨" : ""}
              </div>
            );
          })
        )}
      </div>

      {/* On-screen D-Pad Controls */}
      <div className="mt-6 flex flex-col items-center gap-1">
        <button
          onClick={() => movePlayer(-1, 0)}
          className="toy-press grid size-12 place-items-center rounded-2xl border-2 border-border bg-card text-xl shadow-soft"
        >
          ⬆️
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => movePlayer(0, -1)}
            className="toy-press grid size-12 place-items-center rounded-2xl border-2 border-border bg-card text-xl shadow-soft"
          >
            ⬅️
          </button>
          <button
            onClick={() => movePlayer(1, 0)}
            className="toy-press grid size-12 place-items-center rounded-2xl border-2 border-border bg-card text-xl shadow-soft"
          >
            ⬇️
          </button>
          <button
            onClick={() => movePlayer(0, 1)}
            className="toy-press grid size-12 place-items-center rounded-2xl border-2 border-border bg-card text-xl shadow-soft"
          >
            ➡️
          </button>
        </div>
      </div>
    </div>
  );
}
