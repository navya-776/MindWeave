export type GameType = "maze" | "spot" | "simon" | "detective";

export const SKILLS = [
  "spatialReasoning",
  "visualAttention",
  "workingMemory",
  "logicalReasoning",
  "problemSolving",
  "reactionControl",
  "concentration",
  "orientation",
  "faceRecognition",
  "languageRecall",
  "routineSequencing",
] as const;

export type SkillKey = (typeof SKILLS)[number];
export type CognitiveSkillKey = SkillKey;

export const SKILL_LABELS: Record<SkillKey, string> = {
  spatialReasoning: "Spatial Navigation",
  visualAttention: "Visual Attention",
  workingMemory: "Memory Recall",
  logicalReasoning: "Logical Reasoning",
  problemSolving: "Problem Solving",
  reactionControl: "Response Control",
  concentration: "Focus & Concentration",
  orientation: "Daily Orientation",
  faceRecognition: "Family Recognition",
  languageRecall: "Language Recall",
  routineSequencing: "Routine Sequencing",
};

export const GAME_LABELS: Record<GameType, string> = {
  maze: "Path Navigation",
  spot: "Spot the Difference",
  simon: "Memory Sequence",
  detective: "Story & Logic",
};

/** How much each game contributes to each cognitive skill. */
export const GAME_SKILL_WEIGHTS: Record<GameType, Partial<Record<SkillKey, number>>> = {
  maze: { spatialReasoning: 1, problemSolving: 0.8, concentration: 0.3 },
  spot: { visualAttention: 1, concentration: 0.8, reactionControl: 0.3 },
  simon: { workingMemory: 1, reactionControl: 0.8, concentration: 0.4 },
  detective: { logicalReasoning: 1, problemSolving: 0.6, concentration: 0.3 },
};

export type MazeDifficulty = {
  size: number;
  complexity: number; // 0..1 extra loops / dead ends
  timeLimit: number; // seconds, 0 = relaxed
  hintAvailability: boolean;
};

export type SpotDifficulty = {
  differenceCount: number;
  subtlety: number; // 0..1
  objectCount: number;
  timeLimit: number;
};

export type SimonDifficulty = {
  sequenceLength: number;
  speed: number; // 0..1
  paletteSize: number;
  inputDelay: number;
};

export type DetectiveDifficulty = {
  clueCount: number;
  suspectCount: number;
  irrelevantClues: number;
  reasoningSteps: number;
};

export type DifficultyMap = {
  maze: MazeDifficulty;
  spot: SpotDifficulty;
  simon: SimonDifficulty;
  detective: DetectiveDifficulty;
};

export type RoundMetrics = {
  accuracy: number; // 0..1
  timeTaken: number; // seconds
  expectedTime: number; // seconds
  attempts: number;
  mistakes: number;
  hintsUsed: number;
  completed: boolean;
  reactionTime?: number;
  mistakeType?: string;
};

export type Band = "excelling" | "strong" | "optimal" | "struggling" | "overwhelmed";
export type Adjustment = "harder" | "same" | "scaffold" | "easier" | "much-easier";

export type RoundResult = {
  id: string;
  gameType: GameType;
  timestamp: number;
  metrics: RoundMetrics;
  performance: number; // 0..100
  difficulty: Record<string, number | boolean>;
  band: Band;
  feedback: string;
  adjustment: Adjustment;
  notes: string[];
};

/* ---------------- Bonus / Secondary Mind Exercises ---------------- */

export type BonusGameType = "sudoku" | "advMaze" | "advMemory" | "logicGrid" | "pattern";

export const BONUS_LABELS: Record<BonusGameType, string> = {
  sudoku: "Number Grid",
  advMaze: "Advanced Route",
  advMemory: "Memory Pattern",
  logicGrid: "Logic Puzzle",
  pattern: "Pattern Sequence",
};

export const BONUS_EMOJI: Record<BonusGameType, string> = {
  sudoku: "🧩",
  advMaze: "🗺️",
  advMemory: "🧠",
  logicGrid: "🔗",
  pattern: "🔢",
};

export const BONUS_SKILL: Record<BonusGameType, SkillKey> = {
  sudoku: "problemSolving",
  advMaze: "spatialReasoning",
  advMemory: "workingMemory",
  logicGrid: "logicalReasoning",
  pattern: "visualAttention",
};

export type BonusDifficultyMap = {
  sudoku: { gridSize: 4 | 6 | 9; clueRatio: number; timeLimit: number; hints: boolean };
  advMaze: { size: number; obstacles: number; timeLimit: number; hints: boolean };
  advMemory: { sequenceLength: number; speed: number; paletteSize: number; reverse: boolean };
  logicGrid: { suspects: number; clues: number; redHerrings: number };
  pattern: { steps: number; complexity: number; options: number };
};

import type { BonusMetrics } from "./bonus";
export type { BonusMetrics };

export type BonusResult = {
  id: string;
  game: BonusGameType;
  timestamp: number;
  performance: number;
  accuracy: number;
  timeTaken: number;
  hintsUsed: number;
  completed: boolean;
  level: number;
  xp: number;
  adjustment: Adjustment;
  notes: string[];
};

export type BonusOffer = {
  unlocked: boolean;
  game: BonusGameType;
  targetSkill: SkillKey;
  mode: "strength" | "growth";
  reasons: string[];
  blockers: string[];
  dailyAverage: number;
  lowestGame: number;
  gamesCompleted: number;
  consistentSessions: number;
  estimatedMinutes: number;
};

export type CaregiverSettings = {
  dailyLimitMinutes: number;
  bonusEnabled: boolean;
};

// Retain alias for backward compatibility during migration
export type ParentSettings = CaregiverSettings;

export type BonusState = {
  level: number;
  xp: number;
  badges: string[];
  history: BonusResult[];
  difficulty: BonusDifficultyMap;
  dismissedOn?: string;
};

export type DayUsage = { date: string; seconds: number };

/* ---------------- Senior & Dementia Care Data Models ---------------- */

export type CareLevel = "independent" | "guided" | "high-support";

export type SeniorAccessibilitySettings = {
  fontSize: "medium" | "large" | "extra-large";
  highContrast: boolean;
  voiceGuidance: boolean;
  speechRate: number; // 0.7 .. 1.0 (slower for senior comprehension)
  simplifiedControls: boolean;
};

export type FatigueMetrics = {
  currentFatigueScore: number; // 0..100
  slowDownRatio: number;
  errorClusterCount: number;
  recommendedBreak: boolean;
};

export type PatientProfile = {
  id: string;
  caregiverId?: string;
  name: string;
  preferredName?: string;
  age: number;
  careLevel: CareLevel;
  language: string; // e.g. "en", "hi", "mr"
  avatar?: string;
  createdAt: number;
  assessmentDone: boolean;
  skills: Record<SkillKey, number>;
  difficulty: DifficultyMap;
  streaks: Record<GameType, number>;
  history: RoundResult[];
  patterns: string[];
  settings: CaregiverSettings;
  accessibility: SeniorAccessibilitySettings;
  bonus: BonusState;
  usage: DayUsage[];
  fatigueState?: FatigueMetrics;
};

// Alias ChildProfile to PatientProfile for smooth backward compatibility
export type ChildProfile = PatientProfile;

export type CognitiveProfile = {
  patientId: string;
  skills: Record<SkillKey, number>;
  difficulty: DifficultyMap;
  patterns: string[];
};

export type CaregiverProfile = {
  uid: string;
  email: string;
  name: string;
  linkedPatientIds: string[];
  selectedPatientId?: string;
};

export type MemoryItem = {
  id: string;
  patientId: string;
  relation: string; // e.g. "Son", "Granddaughter"
  name: string; // e.g. "Ravi"
  photoUrl: string;
  location?: string; // e.g. "Delhi"
  interests?: string[];
  notes?: string;
  createdAt: number;
};

export type ReminderItem = {
  id: string;
  patientId: string;
  title: string;
  type: "medication" | "routine" | "activity" | "appointment";
  time: string; // "09:30"
  days: string[];
  completedToday: boolean;
};

export type SessionRecord = {
  id: string;
  patientId: string;
  timestamp: number;
  gameType: string;
  performance: number;
  accuracy: number;
  timeTaken: number;
  hintsUsed: number;
  fatigueObserved: boolean;
};

export interface VoiceProvider {
  listen(): Promise<string>;
  speak(text: string, language?: string): Promise<void>;
  stop(): void;
}


