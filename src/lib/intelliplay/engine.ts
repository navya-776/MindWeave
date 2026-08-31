import {
  GAME_SKILL_WEIGHTS,
  SKILLS,
  type Adjustment,
  type Band,
  type CareLevel,
  type ChildProfile,
  type DifficultyMap,
  type GameType,
  type PatientProfile,
  type RoundMetrics,
  type RoundResult,
  type SeniorAccessibilitySettings,
  type SkillKey,
} from "./types";
import { addUsage, defaultBonusState, defaultSettings } from "./bonus";

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export function defaultDifficulty(): DifficultyMap {
  return {
    maze: { size: 5, complexity: 0.25, timeLimit: 0, hintAvailability: true },
    spot: { differenceCount: 5, subtlety: 0.25, objectCount: 14, timeLimit: 0 },
    simon: { sequenceLength: 3, speed: 0.3, paletteSize: 4, inputDelay: 300 },
    detective: { clueCount: 3, suspectCount: 2, irrelevantClues: 0, reasoningSteps: 1 },
  };
}

export function defaultAccessibility(): SeniorAccessibilitySettings {
  return {
    fontSize: "large",
    highContrast: false,
    voiceGuidance: true,
    speechRate: 0.85,
    simplifiedControls: true,
  };
}

export function createProfile(name: string, age: number, careLevel: CareLevel = "guided"): PatientProfile {
  return {
    id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    preferredName: name,
    age: age || 70,
    careLevel,
    language: "en",
    createdAt: Date.now(),
    assessmentDone: false,
    skills: SKILLS.reduce((acc, s) => ({ ...acc, [s]: 60 }), {} as Record<SkillKey, number>),
    difficulty: defaultDifficulty(),
    streaks: { maze: 0, spot: 0, simon: 0, detective: 0 },
    history: [],
    patterns: [],
    settings: defaultSettings(),
    accessibility: defaultAccessibility(),
    bonus: defaultBonusState(),
    usage: [],
  };
}

/** Older saved profiles get the new senior/caregiver fields filled in. */
export function migrateProfile(p: PatientProfile): PatientProfile {
  return {
    ...p,
    id: p.id ?? `pat-${Date.now()}`,
    careLevel: p.careLevel ?? "guided",
    language: p.language ?? "en",
    settings: { ...defaultSettings(), ...p.settings },
    accessibility: { ...defaultAccessibility(), ...p.accessibility },
    bonus: { ...defaultBonusState(), ...p.bonus },
    usage: p.usage ?? [],
  };
}



/* ---------------- Performance scoring ---------------- */

export function computePerformance(m: RoundMetrics, history: RoundResult[]): number {
  const accuracy = clamp(m.accuracy, 0, 1);
  const par = Math.max(5, m.expectedTime);
  const speed = clamp(1 - (m.timeTaken - par * 0.5) / (par * 1.5), 0, 1);
  const recent = history.slice(-5).map((r) => r.performance);
  const consistency = recent.length < 2 ? 0.7 : clamp(1 - standardDeviation(recent) / 35, 0, 1);
  const independence = clamp(1 - m.hintsUsed * 0.25, 0, 1);
  const attempts = clamp(1 - (m.attempts - 1) * 0.2, 0, 1);

  const score = 50 * accuracy + 20 * speed + 15 * consistency + 10 * independence + 5 * attempts;
  return Math.round(clamp(m.completed ? score : score * 0.8, 0, 100));
}

function standardDeviation(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
}

/**
 * Blend the newest round with a rolling window so a single bad round never
 * swings the difficulty. Outliers are damped before averaging.
 */
export function rollingAbility(history: RoundResult[], gameType: GameType, latest: number): number {
  const sameGame = history.filter((r) => r.gameType === gameType).map((r) => r.performance);
  const window = [...sameGame, latest].slice(-5);
  if (window.length === 1) return latest;

  const median = [...window].sort((a, b) => a - b)[Math.floor(window.length / 2)]!;
  const damped = window.map((v) => (Math.abs(v - median) > 30 ? median + (v - median) * 0.35 : v));
  const weights = damped.map((_, i) => i + 1); // recency weighted
  const recentScore =
    damped.reduce((a, v, i) => a + v * weights[i]!, 0) / weights.reduce((a, b) => a + b, 0);

  const historical =
    sameGame.length > 0 ? sameGame.reduce((a, b) => a + b, 0) / sameGame.length : recentScore;

  return Math.round(0.7 * recentScore + 0.3 * historical);
}

export function bandFor(score: number): Band {
  if (score >= 85) return "excelling";
  if (score >= 70) return "strong";
  if (score >= 50) return "optimal";
  if (score >= 30) return "struggling";
  return "overwhelmed";
}

export function adjustmentFor(band: Band, streak: number): Adjustment {
  if (band === "excelling" || (band === "strong" && streak >= 3)) return "harder";
  if (band === "strong") return "same";
  if (band === "optimal") return "scaffold";
  if (band === "struggling") return "easier";
  return "much-easier";
}

/* ---------------- Cognitive profile update ---------------- */

export function updateSkills(
  skills: Record<SkillKey, number>,
  gameType: GameType,
  performance: number,
): Record<SkillKey, number> {
  const weights = GAME_SKILL_WEIGHTS[gameType];
  const next = { ...skills };
  for (const key of Object.keys(weights) as SkillKey[]) {
    const w = weights[key]!;
    const alpha = 0.28 * w; // exponential moving average
    next[key] = Math.round(clamp(skills[key] * (1 - alpha) + performance * alpha, 0, 100));
  }
  return next;
}

/* ---------------- Multi-dimensional difficulty adaptation ---------------- */

export type Diagnostics = {
  fastButWrong?: boolean;
  slowButAccurate?: boolean;
  hintReliant?: boolean;
  impulsive?: boolean;
  timePressureLoss?: boolean;
  memoryLoadLoss?: boolean;
  wanders?: boolean;
};

export function diagnose(m: RoundMetrics, extra: Diagnostics = {}): Diagnostics {
  const fast = m.timeTaken < m.expectedTime * 0.6;
  const slow = m.timeTaken > m.expectedTime * 1.4;
  return {
    fastButWrong: fast && m.accuracy < 0.6,
    slowButAccurate: slow && m.accuracy >= 0.8,
    hintReliant: m.hintsUsed >= 2,
    impulsive: (m.reactionTime ?? 1) < 0.45 && m.mistakes > 0,
    ...extra,
  };
}

/**
 * Adapts ONLY one or two dimensions at a time, chosen by what actually caused
 * the failure — and moderated by the child's cross-game cognitive profile.
 */
export function adaptDifficulty(
  difficulty: DifficultyMap,
  gameType: GameType,
  adjustment: Adjustment,
  diag: Diagnostics,
  skills: Record<SkillKey, number>,
): { difficulty: DifficultyMap; notes: string[] } {
  const d: DifficultyMap = JSON.parse(JSON.stringify(difficulty));
  const notes: string[] = [];
  const up = adjustment === "harder";
  const down = adjustment === "easier" || adjustment === "much-easier";
  const big = adjustment === "much-easier";

  if (gameType === "maze") {
    const m = d.maze;
    if (up) {
      if (diag.timePressureLoss || skills.reactionControl < 55) {
        m.complexity = round1(clamp(m.complexity + 0.15, 0, 1));
        notes.push("Maze complexity raised, time kept relaxed (time pressure is a weak spot).");
      } else if (m.complexity > 0.55) {
        m.size = clamp(m.size + 1, 5, 12);
        m.complexity = 0.4;
        notes.push(`Maze grew to ${m.size}×${m.size}.`);
      } else {
        m.complexity = round1(clamp(m.complexity + 0.15, 0, 1));
        if (m.size >= 7 && m.timeLimit === 0) m.timeLimit = m.size * 12;
        notes.push("More dead ends and branching routes added.");
      }
      if (m.size >= 8) m.hintAvailability = false;
    } else if (down) {
      if (diag.wanders) {
        m.complexity = round1(clamp(m.complexity - 0.2, 0, 1));
        m.hintAvailability = true;
        notes.push("Fewer dead ends and directional hints enabled.");
      } else if (m.timeLimit > 0) {
        m.timeLimit = big ? 0 : Math.round(m.timeLimit * 1.4);
        notes.push("Time pressure relaxed.");
      } else {
        m.size = clamp(m.size - (big ? 2 : 1), 4, 12);
        notes.push(`Maze reduced to ${m.size}×${m.size}.`);
      }
      if (big) m.complexity = round1(clamp(m.complexity - 0.2, 0, 1));
    } else if (adjustment === "scaffold") {
      m.hintAvailability = true;
      if (m.timeLimit > 0) m.timeLimit = Math.round(m.timeLimit * 1.2);
      notes.push("Same challenge, with hints and a little extra time.");
    } else {
      m.complexity = round1(clamp(m.complexity + (Math.random() - 0.5) * 0.1, 0, 1));
      notes.push("Same level with a fresh layout so patterns can't be memorised.");
    }
  }

  if (gameType === "spot") {
    const s = d.spot;
    if (up) {
      if (diag.slowButAccurate) {
        s.subtlety = round1(clamp(s.subtlety + 0.12, 0, 1));
        s.objectCount = clamp(s.objectCount + 4, 8, 40);
        notes.push("Scene made busier and differences subtler — time left generous.");
      } else {
        s.differenceCount = clamp(s.differenceCount + 1, 3, 12);
        s.objectCount = clamp(s.objectCount + 3, 8, 40);
        notes.push(`Now ${s.differenceCount} differences to find.`);
      }
    } else if (down) {
      if (diag.fastButWrong) {
        s.timeLimit = 0;
        s.subtlety = round1(clamp(s.subtlety - 0.15, 0, 1));
        notes.push("Timer removed and differences made clearer to encourage careful looking.");
      } else {
        s.differenceCount = clamp(s.differenceCount - (big ? 2 : 1), 3, 12);
        s.subtlety = round1(clamp(s.subtlety - 0.15, 0, 1));
        notes.push(`Reduced to ${s.differenceCount} clearer differences.`);
      }
      if (big) s.objectCount = clamp(s.objectCount - 4, 8, 40);
    } else if (adjustment === "scaffold") {
      s.timeLimit = s.timeLimit > 0 ? Math.round(s.timeLimit * 1.25) : 0;
      s.subtlety = round1(clamp(s.subtlety - 0.05, 0, 1));
      notes.push("Same number of differences, with more time to search.");
    } else {
      notes.push("Same difficulty with a brand new scene.");
    }
  }

  if (gameType === "simon") {
    const s = d.simon;
    if (up) {
      if (diag.memoryLoadLoss) {
        s.speed = round1(clamp(s.speed + 0.1, 0, 1));
        notes.push("Sequence length held steady, presentation sped up slightly.");
      } else {
        s.sequenceLength = clamp(s.sequenceLength + 1, 3, 12);
        notes.push(`Sequence grew to ${s.sequenceLength} steps.`);
        if (s.sequenceLength % 3 === 0) s.paletteSize = clamp(s.paletteSize + 1, 4, 6);
      }
      if (s.sequenceLength >= 6) s.inputDelay = 200;
    } else if (down) {
      if (diag.impulsive) {
        s.inputDelay = 700;
        notes.push("A short pause added before answers are accepted.");
      }
      if (diag.memoryLoadLoss || !diag.impulsive) {
        s.sequenceLength = clamp(s.sequenceLength - (big ? 2 : 1), 3, 12);
        notes.push(`Sequence shortened to ${s.sequenceLength} steps.`);
      }
      if (diag.timePressureLoss) s.speed = round1(clamp(s.speed - 0.2, 0, 1));
      if (big) {
        s.speed = round1(clamp(s.speed - 0.2, 0, 1));
        s.paletteSize = 4;
      }
    } else if (adjustment === "scaffold") {
      s.speed = round1(clamp(s.speed - 0.1, 0, 1));
      notes.push("Same sequence length, shown a little slower.");
    } else {
      notes.push("Same memory load with a different sequence.");
    }
  }

  if (gameType === "detective") {
    const c = d.detective;
    const visuallyStrong = skills.visualAttention >= 80 && skills.concentration >= 75;
    const memoryWeak = skills.workingMemory < 55;
    if (up) {
      if (memoryWeak) {
        c.irrelevantClues = clamp(c.irrelevantClues + 1, 0, 5);
        notes.push("Added a red herring but kept the clue count low (working memory support).");
      } else {
        c.clueCount = clamp(c.clueCount + (visuallyStrong ? 2 : 1), 3, 10);
        c.suspectCount = clamp(c.suspectCount + (c.clueCount >= 6 ? 1 : 0), 2, 5);
        c.reasoningSteps = clamp(c.reasoningSteps + (c.clueCount >= 7 ? 1 : 0), 1, 4);
        notes.push(`Case expanded to ${c.clueCount} clues and ${c.suspectCount} suspects.`);
      }
    } else if (down) {
      c.clueCount = clamp(c.clueCount - (big ? 2 : 1), 3, 10);
      c.irrelevantClues = clamp(c.irrelevantClues - 1, 0, 5);
      if (big) c.suspectCount = clamp(c.suspectCount - 1, 2, 5);
      notes.push(`Case trimmed to ${c.clueCount} clues with fewer distractions.`);
    } else if (adjustment === "scaffold") {
      c.irrelevantClues = clamp(c.irrelevantClues - 1, 0, 5);
      notes.push("Same reasoning depth, with the important clues easier to organise.");
    } else {
      notes.push("Same case size, new mystery.");
    }
  }

  return { difficulty: d, notes };
}

/** Cross-game influence: a weak skill softens a game before it is even played. */
export function crossGameNote(gameType: GameType, skills: Record<SkillKey, number>): string | null {
  if (gameType === "detective" && skills.workingMemory < 55)
    return "Working memory is still building, so this case keeps clues few and clearly grouped.";
  if (gameType === "detective" && skills.visualAttention >= 80)
    return "Strong visual attention detected — this case hides more detail in the clues.";
  if (gameType === "maze" && skills.reactionControl < 55)
    return "Time pressure stays gentle here while reaction control develops.";
  if (gameType === "simon" && skills.workingMemory >= 80)
    return "Great memory recall — sequences here run a little longer.";
  if (gameType === "spot" && skills.concentration >= 80)
    return "Excellent concentration — expect a busier scene.";
  return null;
}

/* ---------------- Adaptive feedback ---------------- */

export function buildFeedback(
  m: RoundMetrics,
  performance: number,
  band: Band,
  history: RoundResult[],
  diag: Diagnostics,
): string {
  const prev = history[history.length - 1]?.performance;
  if (diag.fastButWrong) return "Take all the time you need to look carefully — you are doing wonderful!";
  if (diag.slowButAccurate) return "Splendid focus! You took your time and answered thoughtfully.";
  if (band === "overwhelmed")
    return "Let's try a calmer, more relaxed activity together — every attempt keeps the mind active.";
  if (band === "struggling" && m.hintsUsed >= 2)
    return "Great effort! Hints are here to guide you whenever you'd like.";
  if (prev !== undefined && performance > prev + 8)
    return "Wonderful progress! Your focus and clarity are improving nicely.";
  if (band === "excelling") return "Excellent work! You are handling these exercises with great ease.";
  if (band === "strong") return "Solid concentration — well done!";
  return "Wonderful work today! Keep going at your own comfortable pace.";
}

export function behaviouralPatterns(history: RoundResult[]): string[] {
  const last = history.slice(-8);
  if (last.length < 3) return [];
  const out: string[] = [];
  const avg = (f: (r: RoundResult) => number) => last.reduce((a, r) => a + f(r), 0) / last.length;

  if (
    avg((r) => r.metrics.accuracy) < 0.6 &&
    avg((r) => r.metrics.timeTaken / Math.max(1, r.metrics.expectedTime)) < 0.7
  )
    out.push("Answers quickly but often incorrectly — benefits from a pause-and-check prompt.");
  if (
    avg((r) => r.metrics.accuracy) > 0.85 &&
    avg((r) => r.metrics.timeTaken / Math.max(1, r.metrics.expectedTime)) > 1.3
  )
    out.push("Highly accurate but deliberate — keep complexity high and time generous.");
  if (avg((r) => r.metrics.hintsUsed) >= 1.5)
    out.push("Leans on hints — needs more independent practice at a lower level.");
  const timed = last.filter((r) => Number(r.difficulty["timeLimit"] ?? 0) > 0);
  if (timed.length >= 2 && timed.reduce((a, r) => a + r.performance, 0) / timed.length < 55)
    out.push("Accuracy drops when a timer appears — time pressure is introduced slowly.");
  const simon = last.filter((r) => r.gameType === "simon");
  if (simon.length >= 2 && simon.reduce((a, r) => a + r.performance, 0) / simon.length < 55)
    out.push("Struggles as memory load grows — sequences grow one step at a time.");
  return out;
}

/** Rule-based classifier mirroring the EASIER / SAME / HARDER ML output. */
export function recommendation(adjustment: Adjustment, ability: number) {
  const label =
    adjustment === "harder"
      ? "HARDER"
      : adjustment === "easier" || adjustment === "much-easier"
        ? "EASIER"
        : "SAME";
  const confidence = clamp(0.55 + Math.abs(ability - 62) / 100, 0.5, 0.97);
  return { label, confidence: Math.round(confidence * 100) / 100 };
}

export function processRound(
  profile: ChildProfile,
  gameType: GameType,
  metrics: RoundMetrics,
  extraDiag: Diagnostics = {},
): { profile: ChildProfile; result: RoundResult } {
  const performance = computePerformance(metrics, profile.history);
  const ability = rollingAbility(profile.history, gameType, performance);
  const success = metrics.accuracy >= 0.7 && metrics.completed;
  const streak = success
    ? Math.max(0, profile.streaks[gameType]) + 1
    : Math.min(0, profile.streaks[gameType]) - 1;

  const band = bandFor(ability);
  let adjustment = adjustmentFor(band, streak);
  if (streak <= -3 && adjustment !== "much-easier") adjustment = "easier";

  const diag = diagnose(metrics, extraDiag);
  const skills = updateSkills(profile.skills, gameType, performance);
  const { difficulty, notes } = adaptDifficulty(
    profile.difficulty,
    gameType,
    adjustment,
    diag,
    skills,
  );

  const result: RoundResult = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    gameType,
    timestamp: Date.now(),
    metrics,
    performance,
    difficulty: profile.difficulty[gameType] as unknown as Record<string, number | boolean>,
    band,
    adjustment,
    feedback: buildFeedback(metrics, performance, band, profile.history, diag),
    notes,
  };

  const history = [...profile.history, result].slice(-120);

  return {
    profile: {
      ...profile,
      skills,
      difficulty,
      history,
      streaks: { ...profile.streaks, [gameType]: streak },
      patterns: behaviouralPatterns(history),
      usage: addUsage(profile, metrics.timeTaken),
    },
    result,
  };
}
