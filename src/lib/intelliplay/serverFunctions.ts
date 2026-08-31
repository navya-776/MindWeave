import { createServerFn } from "@tanstack/react-start";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDb } from "../db";
import type {
  RoundResult,
  RoundMetrics,
  PatientProfile,
  GameType,
  BonusGameType,
  BonusResult,
} from "./types";
import { processRound } from "./engine";
import { processBonusRound } from "./bonus";
import type { BonusMetrics } from "./bonus";

// Helper to initialize Firebase Admin SDK safely
function initAdmin() {
  if (getApps().length === 0) {
    const projectId = process.env["FIREBASE_PROJECT_ID"];
    const clientEmail = process.env["FIREBASE_CLIENT_EMAIL"];
    const privateKey = process.env["FIREBASE_PRIVATE_KEY"]?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase Admin SDK environment variables. Please check your .env file."
      );
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

// Helper to authenticate user on server using JWT ID Token
async function authenticate(idToken: string): Promise<string> {
  initAdmin();
  const decodedToken = await getAuth().verifyIdToken(idToken);
  return decodedToken.uid;
}

// 1. Fetch User Profile
export const fetchProfile = createServerFn({ method: "GET" })
  .validator((idToken: string) => idToken)
  .handler(async ({ data: idToken }) => {
    const uid = await authenticate(idToken);
    const db = getDb();

    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return null;
    const data = snap.data();
    return (data?.["profile"] as PatientProfile) || null;
  });

// 2. Save User Profile directly (used on creating profile, updating avatar, updating settings, etc.)
export const saveProfile = createServerFn({ method: "POST" })
  .validator((data: { idToken: string; profile: PatientProfile | null }) => data)
  .handler(async ({ data }) => {
    const uid = await authenticate(data.idToken);
    const db = getDb();
    const ref = db.collection("users").doc(uid);

    if (data.profile === null) {
      await ref.delete();
      return { success: true };
    }

    await ref.set({ profile: data.profile }, { merge: true });
    return { success: true };
  });

// 3. Submit Game Round Results
export const submitRoundToServer = createServerFn({ method: "POST" })
  .validator(
    (data: {
      idToken: string;
      game: GameType;
      metrics: RoundMetrics;
      diag: any;
    }) => data
  )
  .handler(async ({ data }) => {
    const uid = await authenticate(data.idToken);
    const db = getDb();

    // Fetch the current user doc
    const snap = await db.collection("users").doc(uid).get();
    const docData = snap.data();
    if (!snap.exists || !docData?.["profile"]) {
      throw new Error("No profile found for this authenticated user.");
    }

    const currentProfile: PatientProfile = docData["profile"];

    // Run the cognitive adaptation engine on the server
    const { profile: nextProfile, result } = processRound(
      currentProfile,
      data.game,
      data.metrics,
      data.diag
    );

    // Save historical round detail
    await db.collection("game_rounds").add({
      userId: uid,
      gameType: data.game,
      result,
      timestamp: Date.now(),
    });

    // Save updated profile state
    await db.collection("users").doc(uid).set({ profile: nextProfile }, { merge: true });

    return { nextProfile, result };
  });

// 4. Submit Bonus Game Round Results
export const submitBonusToServer = createServerFn({ method: "POST" })
  .validator(
    (data: {
      idToken: string;
      game: BonusGameType;
      metrics: BonusMetrics;
    }) => data
  )
  .handler(async ({ data }) => {
    const uid = await authenticate(data.idToken);
    const db = getDb();

    // Fetch the current user doc
    const snap = await db.collection("users").doc(uid).get();
    const docData = snap.data();
    if (!snap.exists || !docData?.["profile"]) {
      throw new Error("No profile found for this authenticated user.");
    }

    const currentProfile: PatientProfile = docData["profile"];

    // Run the cognitive adaptation engine for bonus rounds on the server
    const { profile: nextProfile, result } = processBonusRound(
      currentProfile,
      data.game,
      data.metrics
    );

    // Save historical round detail
    await db.collection("game_rounds").add({
      userId: uid,
      gameType: `bonus-${data.game}`,
      result,
      timestamp: Date.now(),
    });

    // Save updated profile state
    await db.collection("users").doc(uid).set({ profile: nextProfile }, { merge: true });

    return { nextProfile, result };
  });
