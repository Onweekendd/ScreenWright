import { compactionConfig } from "../config";

const failureCounts = new Map<string, number>();
const lastCompactionRound = new Map<string, number>();
const roundCounters = new Map<string, number>();

export const isCircuitBroken = (threadId: string): boolean =>
  (failureCounts.get(threadId) ?? 0) >= compactionConfig.history.circuitBreakerFailures;

export const recordCompactionSuccess = (threadId: string): void => {
  failureCounts.delete(threadId);
  lastCompactionRound.set(threadId, roundCounters.get(threadId) ?? 0);
};

export const recordCompactionFailure = (threadId: string): void => {
  failureCounts.set(threadId, (failureCounts.get(threadId) ?? 0) + 1);
};

export const tickRound = (threadId: string): number => {
  const next = (roundCounters.get(threadId) ?? 0) + 1;
  roundCounters.set(threadId, next);
  return next;
};

const isInCooldown = (threadId: string): boolean => {
  const lastRound = lastCompactionRound.get(threadId);
  if (lastRound === undefined) {
    return false;
  }
  const current = roundCounters.get(threadId) ?? 0;
  return current - lastRound < compactionConfig.history.cooldownRounds;
};

export const shouldAutoCompact = (
  promptTokens: number,
  threadId: string
): { compact: boolean; reason: string; tokens: number } => {
  if (isCircuitBroken(threadId)) {
    return { compact: false, reason: "circuit-broken", tokens: promptTokens };
  }
  if (isInCooldown(threadId)) {
    return { compact: false, reason: "cooldown", tokens: promptTokens };
  }
  if (promptTokens < compactionConfig.history.triggerTokens) {
    return { compact: false, reason: "below-threshold", tokens: promptTokens };
  }
  return { compact: true, reason: "triggered", tokens: promptTokens };
};
