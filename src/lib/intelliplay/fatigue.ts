import type { FatigueMetrics, RoundMetrics } from "./types";

export type FatigueObservation = {
  reactionTime: number;
  isMistake: boolean;
  timestamp: number;
};

/**
 * Real-time Fatigue & Hesitation Tracker
 * Monitors cognitive drift, reaction slowing, and error clustering.
 */
export class FatigueDetector {
  private history: FatigueObservation[] = [];
  private baselineReactionTime: number = 3.0; // seconds default baseline

  constructor(baseline?: number) {
    if (baseline && baseline > 0) {
      this.baselineReactionTime = baseline;
    }
  }

  public recordAction(reactionTime: number, isMistake: boolean): FatigueMetrics {
    const now = Date.now();
    this.history.push({ reactionTime, isMistake, timestamp: now });

    // Keep only the last 15 actions
    if (this.history.length > 15) {
      this.history.shift();
    }

    return this.evaluate();
  }

  public evaluate(): FatigueMetrics {
    if (this.history.length < 3) {
      return {
        currentFatigueScore: 0,
        slowDownRatio: 1.0,
        errorClusterCount: 0,
        recommendedBreak: false,
      };
    }

    const recent = this.history.slice(-5);
    const avgRecentTime =
      recent.reduce((sum, item) => sum + item.reactionTime, 0) / recent.length;

    const slowDownRatio = avgRecentTime / Math.max(1, this.baselineReactionTime);

    // Count consecutive errors in last 5 actions
    let errorClusterCount = 0;
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i]?.isMistake) {
        errorClusterCount++;
      } else {
        break;
      }
    }

    // Fatigue Score Calculation (0 to 100)
    let score = 0;
    if (slowDownRatio > 1.8) score += 30;
    if (slowDownRatio > 2.5) score += 30;
    if (errorClusterCount >= 2) score += 20;
    if (errorClusterCount >= 3) score += 20;

    score = Math.min(100, Math.max(0, score));

    return {
      currentFatigueScore: score,
      slowDownRatio: Number(slowDownRatio.toFixed(2)),
      errorClusterCount,
      recommendedBreak: score >= 60,
    };
  }

  public reset() {
    this.history = [];
  }
}
