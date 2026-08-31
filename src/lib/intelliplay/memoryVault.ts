import type { MemoryItem } from "./types";
export type { MemoryItem };

const MEMORY_STORAGE_KEY = "mindweave.memories.v1";

export const SAMPLE_MEMORIES: MemoryItem[] = [
  {
    id: "mem-1",
    patientId: "default",
    name: "Ravi Sharma",
    relation: "Son",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    location: "Delhi",
    interests: ["Cricket", "Gardening"],
    notes: "Ravi visits every Sunday morning and brings fresh sweets.",
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: "mem-2",
    patientId: "default",
    name: "Ananya Sharma",
    relation: "Granddaughter",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    location: "Mumbai",
    interests: ["Painting", "Piano"],
    notes: "Ananya loves drawing sunset landscapes and calling on weekends.",
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: "mem-3",
    patientId: "default",
    name: "Sunita Sharma",
    relation: "Spouse",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    location: "Home",
    interests: ["Classical Music", "Reading"],
    notes: "Married for 48 wonderful years. Enjoys morning tea in the garden.",
    createdAt: Date.now() - 86400000 * 60,
  },
];

/** Fetch stored memory items with fallback to sample memories. */
export function getStoredMemories(): MemoryItem[] {
  if (typeof window === "undefined") return SAMPLE_MEMORIES;
  try {
    const raw = window.localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(SAMPLE_MEMORIES));
      return SAMPLE_MEMORIES;
    }
    const items = JSON.parse(raw) as MemoryItem[];
    return items.length > 0 ? items : SAMPLE_MEMORIES;
  } catch (err) {
    console.error("Error reading memory vault:", err);
    return SAMPLE_MEMORIES;
  }
}

/** Save updated memory list to local storage. */
export function saveStoredMemories(memories: MemoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch (err) {
    console.error("Error writing memory vault:", err);
  }
}

/* ---------------- AI Personal Memory Exercise Generator ---------------- */

export type ExerciseType = "recognition" | "relation" | "association" | "sequence" | "conversational";

export type MemoryExercise = {
  id: string;
  type: ExerciseType;
  targetMemory: MemoryItem;
  question: string;
  options?: string[];
  correctAnswerIndex?: number;
  promptText?: string;
};

/**
 * AI Memory Exercise Generator: Transforms personal memory records
 * into dynamic recognition, relation, association, and story exercises.
 */
export function generateMemoryExercises(memories: MemoryItem[]): MemoryExercise[] {
  if (!memories || memories.length === 0) return [];
  const exercises: MemoryExercise[] = [];

  memories.forEach((target, idx) => {
    const otherNames = memories.filter((m) => m.id !== target.id).map((m) => m.name);
    const otherRelations = memories.filter((m) => m.id !== target.id).map((m) => m.relation);
    const otherLocations = memories.filter((m) => m.id !== target.id && m.location).map((m) => m.location!);

    // 1. Photo Recognition ("Who is this?")
    const recogOptions = shuffle([
      target.name,
      otherNames[0] || "Vikram",
      otherNames[1] || "Meera",
    ]);
    exercises.push({
      id: `ex-recog-${target.id}-${idx}`,
      type: "recognition",
      targetMemory: target,
      question: "Who is this family member in the photo?",
      options: recogOptions,
      correctAnswerIndex: recogOptions.indexOf(target.name),
    });

    // 2. Relation Recall ("What is Ravi's relation to you?")
    const relOptions = shuffle([
      target.relation,
      otherRelations[0] || "Nephew",
      otherRelations[1] || "Neighbor",
    ]);
    exercises.push({
      id: `ex-rel-${target.id}-${idx}`,
      type: "relation",
      targetMemory: target,
      question: `What is ${target.name}'s relationship to you?`,
      options: relOptions,
      correctAnswerIndex: relOptions.indexOf(target.relation),
    });

    // 3. Association Matching (Location or Interest)
    if (target.location) {
      const locOptions = shuffle([
        target.location,
        otherLocations[0] || "Bengaluru",
        otherLocations[1] || "Kolkata",
      ]);
      exercises.push({
        id: `ex-assoc-${target.id}-${idx}`,
        type: "association",
        targetMemory: target,
        question: `Where does ${target.name} currently live?`,
        options: locOptions,
        correctAnswerIndex: locOptions.indexOf(target.location),
      });
    }

    // 4. Conversational Recall Prompt
    exercises.push({
      id: `ex-conv-${target.id}-${idx}`,
      type: "conversational",
      targetMemory: target,
      question: `Tell us about a happy memory with ${target.name} (${target.relation}).`,
      promptText: target.notes || `Say or record a warm memory about ${target.name}.`,
    });
  });

  return shuffle(exercises);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}
