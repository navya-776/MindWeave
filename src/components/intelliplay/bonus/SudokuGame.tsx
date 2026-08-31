import { useCallback, useEffect, useState } from "react";
import type { BonusDifficultyMap, BonusMetrics } from "@/lib/intelliplay/types";
import { cn } from "@/lib/utils";

type Props = {
  difficulty: BonusDifficultyMap["sudoku"];
  onComplete: (metrics: BonusMetrics) => void;
};

// Generate valid solved grid using backtracking
function generateSolvedGrid(size: number): number[][] {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const subW = size === 4 ? 2 : size === 6 ? 3 : 3;
  const subH = size === 4 ? 2 : size === 6 ? 2 : 3;

  function isValid(g: number[][], r: number, c: number, val: number) {
    for (let i = 0; i < size; i++) {
      if (g[r]![i] === val) return false;
      if (g[i]![c] === val) return false;
    }
    const boxR = Math.floor(r / subH) * subH;
    const boxC = Math.floor(c / subW) * subW;
    for (let i = 0; i < subH; i++) {
      for (let j = 0; j < subW; j++) {
        if (g[boxR + i]![boxC + j] === val) return false;
      }
    }
    return true;
  }

  function fill(r = 0, c = 0): boolean {
    if (r === size) return true;
    const nextR = c === size - 1 ? r + 1 : r;
    const nextC = c === size - 1 ? 0 : c + 1;

    const nums = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    for (const num of nums) {
      if (isValid(grid, r, c, num)) {
        grid[r]![c] = num;
        if (fill(nextR, nextC)) return true;
        grid[r]![c] = 0;
      }
    }
    return false;
  }

  fill();
  return grid;
}

export function SudokuGame({ difficulty, onComplete }: Props) {
  const { gridSize, clueRatio, timeLimit, hints } = difficulty;
  const [solution, setSolution] = useState<number[][]>([]);
  const [grid, setGrid] = useState<number[][]>([]);
  const [initial, setInitial] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [finished, setFinished] = useState(false);

  const initGame = useCallback(() => {
    const sol = generateSolvedGrid(gridSize);
    setSolution(sol);

    const totalCells = gridSize * gridSize;
    const cluesCount = Math.max(gridSize * 2, Math.floor(totalCells * clueRatio));

    const initMask: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(true));
    const playerGrid: number[][] = JSON.parse(JSON.stringify(sol));

    // Remove numbers to reach clue count
    let toRemove = totalCells - cluesCount;
    const coords: [number, number][] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        coords.push([r, c]);
      }
    }
    coords.sort(() => Math.random() - 0.5);

    for (const [r, c] of coords) {
      if (toRemove <= 0) break;
      playerGrid[r]![c] = 0;
      initMask[r]![c] = false;
      toRemove--;
    }

    setGrid(playerGrid);
    setInitial(initMask);
    setSelected(null);
    setHintsUsed(0);
    setTimeTaken(0);
    setFinished(false);
  }, [gridSize, clueRatio]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setTimeTaken((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [finished]);

  const handleCellClick = (r: number, c: number) => {
    if (finished) return;
    setSelected([r, c]);
  };

  const handleInput = (val: number) => {
    if (!selected || finished) return;
    const [r, c] = selected;
    if (initial[r]![c]) return;

    const next = grid.map((row) => [...row]);
    next[r]![c] = val;
    setGrid(next);

    // Check if fully & correctly filled
    checkCompletion(next);
  };

  const checkCompletion = (currentGrid: number[][]) => {
    let filled = 0;
    let correct = 0;
    const total = gridSize * gridSize;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const v = currentGrid[r]![c];
        if (v !== 0) {
          filled++;
          if (v === solution[r]![c]) correct++;
        }
      }
    }

    if (filled === total && correct === total) {
      setFinished(true);
      const expectedTime = gridSize * gridSize * 4;
      onComplete({
        accuracy: 1,
        timeTaken,
        expectedTime,
        hintsUsed,
        completed: true,
      });
    }
  };

  const useHint = () => {
    if (!hints || finished) return;
    // Find an unfilled or incorrect cell
    const emptyCoords: [number, number][] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r]![c] !== solution[r]![c]) emptyCoords.push([r, c]);
      }
    }
    if (emptyCoords.length === 0) return;

    const [r, c] = emptyCoords[Math.floor(Math.random() * emptyCoords.length)]!;
    const next = grid.map((row) => [...row]);
    next[r]![c] = solution[r]![c] ?? 0;
    setGrid(next);
    setHintsUsed((h) => h + 1);

    checkCompletion(next);
  };

  const subW = gridSize === 4 ? 2 : gridSize === 6 ? 3 : 3;
  const subH = gridSize === 4 ? 2 : gridSize === 6 ? 2 : 3;

  return (
    <div className="panel animate-pop flex flex-col items-center p-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <div>
          <span className="font-display text-xl font-bold">🧩 Sudoku ({gridSize}×{gridSize})</span>
          {timeLimit > 0 ? (
            <p className="text-xs font-semibold text-muted-foreground">
              Limit: {timeLimit}s | Elapsed: {timeTaken}s
            </p>
          ) : (
            <p className="text-xs font-semibold text-muted-foreground">Time: {timeTaken}s</p>
          )}
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

      {/* Grid */}
      <div
        className="mt-6 grid gap-1 rounded-2xl border-4 border-primary/40 bg-card p-3 shadow-soft"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const isSel = selected && selected[0] === r && selected[1] === c;
            const isInit = initial[r]?.[c];
            const isWrong = val !== 0 && val !== solution[r]?.[c];

            const borderRight = (c + 1) % subW === 0 && c < gridSize - 1;
            const borderBottom = (r + 1) % subH === 0 && r < gridSize - 1;

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={cn(
                  "toy-press flex size-10 items-center justify-center rounded-xl font-display text-xl font-bold transition-all sm:size-12 sm:text-2xl",
                  isInit
                    ? "bg-muted/70 text-foreground cursor-default"
                    : val !== 0
                    ? isWrong
                      ? "bg-destructive/20 text-destructive border-2 border-destructive"
                      : "bg-primary/20 text-primary"
                    : "bg-background hover:bg-muted/40",
                  isSel && "ring-4 ring-primary",
                  borderRight && "mr-1.5",
                  borderBottom && "mb-1.5"
                )}
              >
                {val !== 0 ? val : ""}
              </button>
            );
          })
        )}
      </div>

      {/* Keypad */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xs">
        {Array.from({ length: gridSize }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => handleInput(n)}
            disabled={finished}
            className="toy-press grid size-12 place-items-center rounded-2xl border-2 border-border bg-card font-display text-xl font-bold shadow-soft hover:border-primary"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => handleInput(0)}
          disabled={finished}
          className="toy-press grid px-4 h-12 place-items-center rounded-2xl border-2 border-border bg-muted font-display text-sm font-bold shadow-soft"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
